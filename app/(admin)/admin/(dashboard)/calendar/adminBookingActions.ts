'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import { verifyPaystackPayment } from '@/lib/paystack'
import { sendTransactional } from '@/lib/loops'
import { getAvailableSlotsWithCapacity, type PractitionerSlotsWithCapacity } from '@/lib/availability'
import type { Json } from '@/lib/database.types'

// ── getAvailabilityWithCapacity ─────────────────────────────────────────────
// Admin-only counterpart to the public getAvailability (book/actions.ts).
// Uses getAvailableSlotsWithCapacity instead of getAvailableSlots so group
// service slots carry spots_taken/spots_total for the admin picker.

const availabilitySchema = z.object({
  serviceId: z.string().uuid(),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

type AvailabilityWithCapacityResult =
  | { success: true; data: PractitionerSlotsWithCapacity[] }
  | { success: false; error: string }

export async function getAvailabilityWithCapacity(
  serviceId: string,
  date: string,
): Promise<AvailabilityWithCapacityResult> {
  const parsed = availabilitySchema.safeParse({ serviceId, date })
  if (!parsed.success) return { success: false, error: 'Invalid parameters.' }

  try {
    const data = await getAvailableSlotsWithCapacity(parsed.data)
    return { success: true, data }
  } catch (err) {
    console.error('[admin-availability] Unexpected error:', err)
    return { success: false, error: 'Unable to load availability. Please try again.' }
  }
}

// Date/time formatters — duplicated from public booking flow.
// TODO: extract to lib/formatters.ts once branches are unified.
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

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
  existing_client_id: z.string().uuid().optional(),
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
    amount_naira, existing_client_id, client,
  } = parsed.data

  try {
    const db = getSupabaseServiceClient()

    const { data: svc } = await db
      .from('services')
      .select('is_active, package_session_count')
      .eq('id', service_id)
      .single()

    if (!svc?.is_active) return { success: false, error: 'This service is no longer active.' }

    // Existing client selected from search — verify it still exists before
    // proceeding. The RPC itself upserts by email (see 0011), so as long as
    // `client.email` still matches this row it will resolve to the same
    // client_id without needing to pass the id through the RPC directly.
    if (existing_client_id) {
      const { data: existingClient } = await db
        .from('clients')
        .select('id')
        .eq('id', existing_client_id)
        .maybeSingle()
      if (!existingClient) return { success: false, error: 'Selected client not found.' }
    }

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
    // NB: as of 0011_package_redemption, this RPC returns a row set
    // (appointment_id, client_id, credit_id, new_credit_id), not a bare uuid.
    const { data: rpcRows, error: rpcErr } = await db.rpc(
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
        p_source:                'admin',
        p_credit_id:             null, // no redemption UI yet — always a fresh purchase/single booking
      },
    )

    if (rpcErr) {
      console.error('[admin-booking] RPC error:', rpcErr)

      // Handle specific RPC exceptions (raised via RAISE EXCEPTION 'CODE')
      if (rpcErr.code === 'P0001') {
        const errorMessages: Record<string, string> = {
          DUPLICATE_BOOKING:  'This client already has a booking at this time.',
          SLOT_FULL:          'This class is fully booked.',
          PRACTITIONER_BUSY:  'The practitioner has a conflicting booking at this time.',
          SLOT_TAKEN:         'This slot is already booked.',
          SERVICE_NOT_FOUND:  'Selected service not found.',
          CREDIT_NOT_FOUND:   'The package credit could not be found.',
          CREDIT_EXHAUSTED:   'This package has no remaining sessions.',
        }

        const specificMessage = errorMessages[rpcErr.message]
        if (specificMessage) {
          return { success: false, error: specificMessage }
        }
      }

      // Unique constraint violation (belt-and-suspenders for old index if it existed)
      if (rpcErr.code === '23505') {
        return { success: false, error: 'This slot is already booked.' }
      }

      return { success: false, error: 'Failed to create appointment. Please try again.' }
    }

    const apptRow = (rpcRows as { appointment_id: string; client_id: string }[] | null)?.[0]
    const apptId = apptRow?.appointment_id
    if (!apptId) {
      console.error('[admin-booking] RPC returned no appointment row:', rpcRows)
      return { success: false, error: 'Failed to create appointment.' }
    }

    // Non-fatal telemetry: if the email was edited after selecting an
    // existing client, the RPC's upsert-by-email may resolve to a
    // different (or new) client row than the one that was selected.
    if (existing_client_id && apptRow?.client_id !== existing_client_id) {
      console.warn(
        '[admin-booking] existing_client_id did not match RPC-resolved client_id — email may have been edited:',
        { existing_client_id, resolved: apptRow?.client_id },
      )
    }

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
      changes:     { source: 'admin', payment_method, existing_client_id: existing_client_id ?? null } as unknown as Json,
    })

    // ── Fetch supplemental data for emails (parallel) ─────────────────────────
    const [{ data: svcFull }, { data: practitioner }, { data: clientRow }] = await Promise.all([
      db.from('services').select('duration_minutes').eq('id', service_id).single(),
      db.from('users').select('full_name').eq('id', practitioner_id).single(),
      db.from('clients').select('notify_email').eq('email', client.email).maybeSingle(),
    ])

    const practitionerName = practitioner?.full_name ?? 'Your practitioner'
    const durationMins     = svcFull?.duration_minutes ?? 0
    const shouldNotify     = clientRow?.notify_email ?? true
    const dateLabel        = fmtDate(appointment_date)
    const pricePaid        = amount_naira > 0
      ? `₦${new Intl.NumberFormat('en-NG').format(amount_naira)}`
      : 'Comp / No charge'
    const reference        = apptId.slice(0, 8).toUpperCase()

    // ── Client confirmation email ─────────────────────────────────────────────
    const confirmTemplateId = process.env.LOOPS_BOOKING_CONFIRMED_TEMPLATE_ID
    if (confirmTemplateId && shouldNotify) {
      try {
        await sendTransactional({
          templateId: confirmTemplateId,
          email: client.email,
          dataVariables: {
            clientName:         client.full_name,
            serviceName:        service_name,
            practitionerName,
            bookingDate:        dateLabel,
            startTime:          fmtTime(start_time),
            endTime:            fmtTime(end_time),
            duration:           `${durationMins} min`,
            pricePaid,
            pricingTier:        pricing_tier === 'package' ? 'Package' : 'Single session',
            reference,
            locationAddress:    process.env.NEXT_PUBLIC_LOCATION_ADDRESS ?? '',
            cancellationNotice: process.env.NEXT_PUBLIC_CANCELLATION_NOTICE ?? '',
          },
        })
      } catch (err) {
        console.warn('[admin-booking] Loops client email failed (non-fatal):', err)
      }
    }

    // ── Staff notification email ──────────────────────────────────────────────
    // Always fires regardless of client notify_email — staff inbox is the
    // source of truth for what got booked.
    const notifTemplateId = process.env.LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID
    const adminEmail      = process.env.STAFF_NOTIFICATION_EMAIL
    if (notifTemplateId && adminEmail) {
      try {
        await sendTransactional({
          templateId: notifTemplateId,
          email: adminEmail,
          dataVariables: {
            clientName:       client.full_name,
            clientEmail:      client.email,
            clientPhone:      client.phone,
            serviceName:      service_name,
            practitionerName,
            bookingDate:      dateLabel,
            startTime:        fmtTime(start_time),
            endTime:          fmtTime(end_time),
            pricePaid,
            pricingTier:      pricing_tier === 'package' ? 'Package' : 'Single session',
            reference,
            notes:            client.notes ?? '',
            adminUrl:         `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/appointments/${apptId}`,
          },
        })
      } catch (err) {
        console.warn('[admin-booking] Loops staff notification failed (non-fatal):', err)
      }
    }

    revalidatePath('/admin/calendar')
    return { success: true, appointmentId: apptId }
  } catch (err) {
    console.error('[admin-booking] Unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
