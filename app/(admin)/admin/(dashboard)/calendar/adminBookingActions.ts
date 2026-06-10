'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { sendTransactional } from '@/lib/loops'
import type { Json } from '@/lib/database.types'

const schema = z.object({
  service_id:         z.string().uuid(),
  service_name:       z.string().min(1),
  appointment_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time:         z.string().regex(/^\d{2}:\d{2}$/),
  end_time:           z.string().regex(/^\d{2}:\d{2}$/),
  practitioner_id:    z.string().uuid(),
  pricing_tier:       z.enum(['single', 'package']),
  payment_method:     z.enum(['cash', 'pos', 'paystack', 'none']),
  paystack_reference: z.string().optional(),
  amount_naira:       z.number().int().nonnegative(),
  client: z.object({
    full_name: z.string().min(2),
    email:     z.string().email(),
    phone:     z.string().min(7),
    notes:     z.string().optional(),
  }),
})

export type AdminBookingInput = z.infer<typeof schema>
type Result = { success: true; appointmentId: string } | { success: false; error: string }

export async function createAdminBooking(input: AdminBookingInput): Promise<Result> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const auth = await createAuthClient()
  const { data: { user: actor } } = await auth.auth.getUser()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const {
    service_id, service_name, appointment_date, start_time, end_time,
    practitioner_id, pricing_tier, payment_method, paystack_reference,
    amount_naira, client,
  } = parsed.data

  try {
    const db = getSupabaseServiceClient()

    const { data: svc } = await db
      .from('services')
      .select('is_active, package_session_count')
      .eq('id', service_id)
      .single()

    if (!svc?.is_active) return { success: false, error: 'This service is no longer active.' }

    // Paystack path — verify before any writes
    let paystackRef: string | null = null
    let amountKobo:  number | null = null
    let channel:     string | null = null

    if (payment_method === 'paystack') {
      if (!paystack_reference) return { success: false, error: 'Missing Paystack reference.' }
      const verified = await verifyPaystackPayment(paystack_reference)
      if (verified.amount_kobo !== amount_naira * 100) {
        return { success: false, error: 'Payment amount does not match booking total.' }
      }
      paystackRef = verified.reference
      amountKobo  = verified.amount_kobo
      channel     = verified.channel
    }

    const packageSessionCount =
      pricing_tier === 'package' ? (svc.package_session_count ?? null) : null

    // Atomic RPC: client upsert + appointment + optional credits in one transaction
    const { data: appointmentId, error: rpcErr } = await db.rpc(
      'create_appointment_atomic',
      {
        p_full_name:             client.full_name,
        p_email:                 client.email,
        p_phone:                 client.phone,
        p_notes:                 client.notes || null,
        p_service_id:            service_id,
        p_practitioner_id:       practitioner_id,
        p_appointment_date:      appointment_date,
        p_start_time:            start_time,
        p_end_time:              end_time,
        p_pricing_tier:          pricing_tier,
        p_package_session_count: packageSessionCount,
      },
    )

    if (rpcErr) {
      const isSlotTaken =
        (rpcErr.code === 'P0001' && rpcErr.message === 'SLOT_TAKEN') ||
        rpcErr.code === '23505'
      if (isSlotTaken) return { success: false, error: 'This slot is already booked.' }
      console.error('[admin-booking] RPC error:', rpcErr)
      return { success: false, error: 'Failed to create appointment.' }
    }

    const apptId = appointmentId as string

    // Payment row — cash/pos get a synthetic reference; none skips entirely
    if (payment_method !== 'none') {
      const { error: payErr } = await db.from('payments').insert({
        appointment_id:     apptId,
        paystack_reference: paystackRef ?? `${payment_method}_${apptId.slice(0, 8)}`,
        amount_kobo:        amountKobo  ?? amount_naira * 100,
        status:             paystackRef ? 'success' : payment_method,
        channel:            channel     ?? payment_method,
        verified_at:        paystackRef ? new Date().toISOString() : null,
      })
      if (payErr) console.error('[admin-booking] Payment row insert failed (non-fatal):', payErr)
    }

    // Audit log
    await db.from('audit_log').insert({
      actor_id:    actor.id,
      action:      'create',
      entity_type: 'appointment',
      entity_id:   apptId,
      changes:     { source: 'admin', payment_method } as unknown as Json,
    })

    // Confirmation email — non-blocking
    const templateId = process.env.LOOPS_BOOKING_CONFIRMED_TEMPLATE_ID
    if (templateId) {
      try {
        const [y, m, d] = appointment_date.split('-').map(Number)
        const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        await sendTransactional({
          templateId,
          email: client.email,
          dataVariables: {
            first_name:   client.full_name.split(' ')[0],
            service_name,
            date:         dateLabel,
            start_time,
            reference:    apptId.slice(0, 8).toUpperCase(),
          },
        })
      } catch (err) {
        console.warn('[admin-booking] Loops email failed (non-fatal):', err)
      }
    }

    revalidatePath('/admin/calendar')
    return { success: true, appointmentId: apptId }
  } catch (err) {
    console.error('[admin-booking] Unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
