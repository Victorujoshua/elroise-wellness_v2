'use server'

import { z } from 'zod'
import { getAvailableSlots, type PractitionerSlots } from '@/lib/availability'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import { verifyPaystackPayment, refundPaystackPayment } from '@/lib/paystack'
import { sendTransactional } from '@/lib/loops'

// ── getAvailability ──────────────────────────────────────────────────────────

const availabilitySchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

type AvailabilityResult =
  | { success: true; data: PractitionerSlots[] }
  | { success: false; error: string }

export async function getAvailability(
  serviceId: string,
  date: string,
): Promise<AvailabilityResult> {
  const parsed = availabilitySchema.safeParse({ serviceId, date })
  if (!parsed.success) return { success: false, error: 'Invalid parameters.' }

  try {
    const data = await getAvailableSlots(parsed.data)
    return { success: true, data }
  } catch (err) {
    console.error('[availability] Unexpected error:', err)
    return { success: false, error: 'Unable to load availability. Please try again.' }
  }
}

// ── createAppointment ────────────────────────────────────────────────────────

const createAppointmentSchema = z.object({
  service_id:         z.string().uuid(),
  service_name:       z.string().min(1),
  practitioner_name:  z.string().min(1),
  appointment_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time:         z.string().regex(/^\d{2}:\d{2}$/),
  end_time:           z.string().regex(/^\d{2}:\d{2}$/),
  practitioner_id:    z.string().uuid(),
  pricing_tier:       z.enum(['single', 'package']),
  amount_naira:       z.number().int().positive(),
  paystack_reference: z.string().min(1),
  client: z.object({
    full_name: z.string().min(2),
    email:     z.string().email(),
    phone:     z.string().min(7),
    notes:     z.string().optional(),
  }),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

type AppointmentResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string }

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<AppointmentResult> {
  const parsed = createAppointmentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Invalid booking details.' }

  const {
    service_id, service_name, practitioner_name, appointment_date, start_time, end_time,
    practitioner_id, pricing_tier, amount_naira, paystack_reference, client,
  } = parsed.data

  try {
    // 1. Verify with Paystack
    const verified = await verifyPaystackPayment(paystack_reference)

    // 2. Amount security check — potential tampering, no auto-refund
    const expectedKobo = amount_naira * 100
    if (verified.amount_kobo !== expectedKobo) {
      console.error(
        `[booking] Amount mismatch — expected ${expectedKobo} kobo, got ${verified.amount_kobo} kobo. ref=${verified.reference}`,
      )
      return { success: false, error: 'Payment amount does not match booking total. Please contact us.' }
    }

    const db = getSupabaseServiceClient()

    // PH-1: Guard against service being deactivated mid-session
    const { data: svc } = await db
      .from('services')
      .select('is_active, package_session_count, duration_minutes')
      .eq('id', service_id)
      .single()

    if (!svc?.is_active) {
      console.error(`[booking] Service ${service_id} is inactive — refunding ${verified.reference}`)
      try { await refundPaystackPayment(verified.reference) } catch (e) {
        console.error('[booking] Refund failed after inactive service:', e)
      }
      return {
        success: false,
        error: 'This service is no longer available. Your payment will be refunded within 5–10 business days.',
      }
    }

    const packageSessionCount =
      pricing_tier === 'package' ? (svc.package_session_count ?? null) : null

    // PH-5: Atomic RPC — slot overlap check (PH-2) + client upsert + appointment
    // + client_credits all run in a single Postgres transaction.
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
        p_source:                'web',
        p_credit_id:             null, // no redemption UI yet — always a fresh purchase/single booking
      },
    )
    if (rpcErr) {
      console.error('[booking] RPC error:', rpcErr)

      // PH-4: Slot conflict — refund automatically (our fault, not theirs)
      const isSlotTaken =
        (rpcErr.code === 'P0001' && rpcErr.message === 'SLOT_TAKEN') ||
        rpcErr.code === '23505'

      if (isSlotTaken) {
        console.error(`[booking] Slot taken — refunding ${verified.reference}`)
        try { await refundPaystackPayment(verified.reference) } catch (e) {
          console.error('[booking] Refund failed after slot conflict (MANUAL REFUND NEEDED):', e, verified.reference)
        }
        return {
          success: false,
          error: 'This slot was just booked by someone else. Your payment will be refunded within 5–10 business days.',
        }
      }

      // Other specific RPC exceptions (Session 1 concurrent-bookings).
      // Payment is already captured at this point and none of these are
      // auto-refunded (only the race-condition case above is confidently
      // "our fault" alone — e.g. DUPLICATE_BOOKING is the client's own
      // overlapping booking), so every message keeps the "contact us if
      // charged" framing the generic fallback already used, rather than
      // silently dropping it for a more specific-but-payment-silent one.
      if (rpcErr.code === 'P0001') {
        const errorMessages: Record<string, string> = {
          DUPLICATE_BOOKING: 'You already have a booking at this time. Please contact us if you were charged.',
          SLOT_FULL:         'This class just filled up. Please contact us if you were charged.',
          PRACTITIONER_BUSY: 'This time is no longer available. Please contact us if you were charged.',
          SERVICE_NOT_FOUND: 'This service is no longer available. Please contact us if you were charged.',
          CREDIT_NOT_FOUND:  'We could not find your package credit. Please contact us if you were charged.',
          CREDIT_EXHAUSTED:  'Your package has no remaining sessions. Please contact us if you were charged.',
        }

        const specificMessage = errorMessages[rpcErr.message]
        if (specificMessage) {
          return { success: false, error: specificMessage }
        }
      }

      return {
        success: false,
        error: 'Failed to create appointment. Please contact us if you were charged.',
      }
    }

    const apptId = (rpcRows as { appointment_id: string }[] | null)?.[0]?.appointment_id
    if (!apptId) {
      console.error('[booking] RPC returned no appointment row:', rpcRows)
      return {
        success: false,
        error: 'Failed to create appointment. Please contact us if you were charged.',
      }
    }

    // Payment row — non-fatal (appointment is confirmed; refund no longer possible here)
    const { error: paymentErr } = await db.from('payments').insert({
      appointment_id:     apptId,
      paystack_reference: verified.reference,
      amount_kobo:        verified.amount_kobo,
      status:             'success',
      channel:            verified.channel,
      verified_at:        new Date().toISOString(),
    })
    if (paymentErr) {
      console.error('[booking] Payment row insert failed (non-fatal):', paymentErr)
    }

    // Loops emails — non-fatal (errors are caught individually)
    const [ey, em, ed] = appointment_date.split('-').map(Number)
    const dateLabel = new Date(ey, em - 1, ed).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const { data: clientPref } = await db
      .from('clients')
      .select('notify_email')
      .eq('email', client.email)
      .maybeSingle()
    const shouldNotifyClient = clientPref?.notify_email ?? true

    const templateId = process.env.LOOPS_BOOKING_CONFIRMED_TEMPLATE_ID
    if (templateId && shouldNotifyClient) {
      try {
        await sendTransactional({
          templateId,
          email: client.email,
          dataVariables: {
            clientName:         client.full_name,
            serviceName:        service_name,
            practitionerName:   practitioner_name,
            bookingDate:        dateLabel,
            startTime:          start_time,
            endTime:            end_time,
            duration:           `${svc.duration_minutes ?? 0} min`,
            pricePaid:          `₦${new Intl.NumberFormat('en-NG').format(amount_naira)}`,
            pricingTier:        pricing_tier === 'package' ? 'Package' : 'Single session',
            reference:          apptId.slice(0, 8).toUpperCase(),
            locationAddress:    process.env.NEXT_PUBLIC_LOCATION_ADDRESS ?? '',
            cancellationNotice: process.env.NEXT_PUBLIC_CANCELLATION_NOTICE ?? '',
          },
        })
      } catch (err) {
        console.warn('[booking] Loops client email failed (non-fatal):', err)
      }
    }

    const notifTemplateId = process.env.LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID
    if (notifTemplateId) {
      const notifVariables = {
        clientName:       client.full_name,
        clientEmail:      client.email,
        clientPhone:      client.phone,
        serviceName:      service_name,
        practitionerName: practitioner_name,
        bookingDate:      dateLabel,
        startTime:        start_time,
        endTime:          end_time,
        pricePaid:        `₦${new Intl.NumberFormat('en-NG').format(amount_naira)}`,
        pricingTier:      pricing_tier === 'package' ? 'Package' : 'Single session',
        reference:        apptId.slice(0, 8).toUpperCase(),
        notes:            client.notes ?? '',
        adminUrl:         `${process.env.NEXT_PUBLIC_APP_URL}/admin/appointments/${apptId}`,
      }

      // Admin notification
      const adminEmail = process.env.STAFF_NOTIFICATION_EMAIL
      if (adminEmail) {
        try {
          await sendTransactional({ templateId: notifTemplateId, email: adminEmail, dataVariables: notifVariables })

        } catch (err) {
          console.warn('[booking] Admin notification failed (non-fatal):', err)
        }
      }
    }

    return { success: true as const, appointmentId: apptId }
  } catch (err) {
    console.error('[booking] Unexpected error:', err)
    return {
      success: false,
      error: 'Something went wrong. Please contact us if you were charged.',
    }
  }
}
