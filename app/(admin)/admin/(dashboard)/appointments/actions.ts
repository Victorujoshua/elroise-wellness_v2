'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import { refundPaystackPayment } from '@/lib/paystack'
import { sendTransactional } from '@/lib/loops'
import type { AppointmentRow, Json } from '@/lib/database.types'

type Status = AppointmentRow['status']
type ActionResult = { success: true } | { success: false; error: string }

// ── helpers ───────────────────────────────────────────────────────────────────

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ── updateAppointmentStatus (canonical — re-exported by calendar/actions.ts) ──

export async function updateAppointmentStatus(
  id: string,
  status: Status,
): Promise<ActionResult> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('appointments').update({ status }).eq('id', id)
  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id: user.id, action: 'update_status', entity_type: 'appointment',
    entity_id: id, changes: { status } as unknown as Json,
  })

  revalidatePath('/admin/calendar')
  revalidatePath('/admin/appointments')
  revalidatePath(`/admin/appointments/${id}`)
  return { success: true }
}

// ── updateAppointmentNotes ────────────────────────────────────────────────────

export async function updateAppointmentNotes(
  id: string,
  notes: string,
): Promise<ActionResult> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('appointments').update({ notes: notes || null }).eq('id', id)
  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id: user.id, action: 'update_notes', entity_type: 'appointment',
    entity_id: id, changes: { notes } as unknown as Json,
  })

  revalidatePath(`/admin/appointments/${id}`)
  return { success: true }
}

// ── rescheduleAppointment ─────────────────────────────────────────────────────

const rescheduleSchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time:      z.string().regex(/^\d{2}:\d{2}$/),
  practitioner_id: z.string().uuid(),
})

export async function rescheduleAppointment(
  appointmentId: string,
  data: z.infer<typeof rescheduleSchema>,
): Promise<ActionResult> {
  const parsed = rescheduleSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid reschedule data.' }

  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()

  // Fetch existing appointment + service duration
  const { data: appt } = await db
    .from('appointments')
    .select('id, appointment_date, start_time, end_time, practitioner_id, service_id, services(duration_minutes)')
    .eq('id', appointmentId)
    .single()
  if (!appt) return { success: false, error: 'Appointment not found.' }

  const duration = (appt.services as unknown as { duration_minutes: number } | null)?.duration_minutes ?? 60
  const end_time = addMinutes(parsed.data.start_time, duration)

  // Slot conflict check — exclude the appointment being rescheduled
  const { data: conflict } = await db
    .from('appointments')
    .select('id')
    .eq('practitioner_id', parsed.data.practitioner_id)
    .eq('appointment_date', parsed.data.date)
    .neq('id', appointmentId)
    .in('status', ['pending', 'confirmed'])
    .lt('start_time', end_time)
    .gt('end_time', parsed.data.start_time)
    .limit(1)
    .maybeSingle()

  if (conflict) return { success: false, error: 'That slot is already booked. Please choose another.' }

  const prev = {
    appointment_date: appt.appointment_date,
    start_time: appt.start_time,
    end_time: appt.end_time,
    practitioner_id: appt.practitioner_id,
  }

  const { error: updateErr } = await db
    .from('appointments')
    .update({
      appointment_date: parsed.data.date,
      start_time: parsed.data.start_time,
      end_time,
      practitioner_id: parsed.data.practitioner_id,
    })
    .eq('id', appointmentId)

  if (updateErr) return { success: false, error: updateErr.message }

  await db.from('audit_log').insert({
    actor_id: user.id, action: 'reschedule', entity_type: 'appointment',
    entity_id: appointmentId,
    changes: {
      from: prev,
      to: { appointment_date: parsed.data.date, start_time: parsed.data.start_time, end_time, practitioner_id: parsed.data.practitioner_id },
    } as unknown as Json,
  })

  revalidatePath('/admin/calendar')
  revalidatePath('/admin/appointments')
  revalidatePath(`/admin/appointments/${appointmentId}`)
  return { success: true }
}

// ── cancelAppointment ─────────────────────────────────────────────────────────

export async function cancelAppointment(
  appointmentId: string,
  reason: string,
): Promise<ActionResult> {
  if (!reason.trim()) return { success: false, error: 'Reason is required.' }

  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id: user.id, action: 'cancel', entity_type: 'appointment',
    entity_id: appointmentId,
    changes: { reason: reason.trim(), refund: false } as unknown as Json,
  })

  revalidatePath('/admin/calendar')
  revalidatePath('/admin/appointments')
  revalidatePath(`/admin/appointments/${appointmentId}`)
  return { success: true }
}

// ── processRefund ─────────────────────────────────────────────────────────────

export async function processRefund(
  appointmentId: string,
  refundAmountKobo: number,
): Promise<ActionResult> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()

  const { data: appt } = await db
    .from('appointments')
    .select('id, status, clients(full_name, email, notify_email), services(name)')
    .eq('id', appointmentId)
    .single()

  if (!appt) return { success: false, error: 'Appointment not found.' }
  if (!['confirmed', 'no_show'].includes(appt.status)) {
    return { success: false, error: 'Refunds can only be issued for confirmed or no-show appointments.' }
  }

  const { data: payment } = await db
    .from('payments')
    .select('id, paystack_reference, amount_kobo, status')
    .eq('appointment_id', appointmentId)
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!payment) return { success: false, error: 'No successful payment found for this appointment.' }

  if (refundAmountKobo <= 0 || refundAmountKobo > payment.amount_kobo) {
    return { success: false, error: `Refund amount must be between ₦1 and ₦${Math.floor(payment.amount_kobo / 100).toLocaleString()}.` }
  }

  try {
    const isPartial = refundAmountKobo < payment.amount_kobo
    await refundPaystackPayment(payment.paystack_reference, isPartial ? refundAmountKobo : undefined)
  } catch (err) {
    console.error('[refund] Paystack refund failed:', err)
    return { success: false, error: 'Paystack refund request failed. Please try again or process manually.' }
  }

  await db.from('payments').update({ status: 'refunded' }).eq('id', payment.id)
  await db.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)

  await db.from('audit_log').insert({
    actor_id: user.id, action: 'refund', entity_type: 'appointment',
    entity_id: appointmentId,
    changes: {
      refund_amount_kobo: refundAmountKobo,
      original_amount_kobo: payment.amount_kobo,
      paystack_reference: payment.paystack_reference,
    } as unknown as Json,
  })

  const templateId = process.env.LOOPS_REFUND_PROCESSED_TEMPLATE_ID
  const client = appt.clients as unknown as { full_name: string; email: string; notify_email: boolean } | null
  const service = appt.services as unknown as { name: string } | null
  if (templateId && client && client.notify_email !== false) {
    try {
      await sendTransactional({
        templateId,
        email: client.email,
        dataVariables: {
          recipientName: client.full_name,
          serviceName:   service?.name ?? 'your appointment',
          refundAmount:  `₦${Math.floor(refundAmountKobo / 100).toLocaleString()}`,
        },
      })
    } catch (err) {
      console.warn('[refund] Loops email failed (non-fatal):', err)
    }
  }

  revalidatePath('/admin/calendar')
  revalidatePath('/admin/appointments')
  revalidatePath(`/admin/appointments/${appointmentId}`)
  return { success: true }
}

// ── exportAppointmentsCsv ─────────────────────────────────────────────────────

export type AppointmentListParams = {
  q?: string
  status?: string
  service_id?: string
  practitioner_id?: string
  payment_status?: string
  date_from?: string
  date_to?: string
}

type CsvResult = { success: true; data: string } | { success: false; error: string }

export async function exportAppointmentsCsv(params: AppointmentListParams): Promise<CsvResult> {
  const db = getSupabaseServiceClient()

  let query = db
    .from('appointments')
    .select(`
      id, appointment_date, start_time, end_time, status, source, pricing_tier, created_at,
      clients!inner(full_name, email, phone),
      services!inner(name),
      users!appointments_practitioner_id_fkey(full_name),
      payments(paystack_reference, amount_kobo, status)
    `)
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (params.status)          query = query.eq('status', params.status as AppointmentRow['status'])
  if (params.service_id)      query = query.eq('service_id', params.service_id)
  if (params.practitioner_id) query = query.eq('practitioner_id', params.practitioner_id)
  if (params.date_from)       query = query.gte('appointment_date', params.date_from)
  if (params.date_to)         query = query.lte('appointment_date', params.date_to)

  if (params.q) {
    const term = params.q.trim()
    const { data: matchedClients } = await db
      .from('clients').select('id')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(500)
    const clientIds = (matchedClients ?? []).map(c => c.id)
    if (clientIds.length > 0) query = query.in('client_id', clientIds)
    else return { success: true, data: '' }
  }

  if (params.payment_status) {
    const { data: pmts } = await db
      .from('payments').select('appointment_id').eq('status', params.payment_status)
    const ids = (pmts ?? []).map(p => p.appointment_id).filter(Boolean) as string[]
    if (ids.length > 0) query = query.in('id', ids)
    else return { success: true, data: '' }
  }

  const { data, error } = await query
  if (error) return { success: false, error: error.message }
  const rows = data ?? []

  const header = 'Date,Time,Client,Email,Phone,Service,Practitioner,Status,Source,Pricing,Amount (₦),Payment Status,Paystack Ref'
  const lines = rows.map(r => {
    const c = r.clients as unknown as { full_name: string; email: string; phone: string }
    const s = r.services as unknown as { name: string }
    const u = r.users as unknown as { full_name: string } | null
    const p = (r.payments as unknown as { paystack_reference: string; amount_kobo: number; status: string }[] | null)?.[0]
    return [
      r.appointment_date, r.start_time,
      `"${c.full_name}"`, c.email, c.phone,
      `"${s.name}"`, u ? `"${u.full_name}"` : '',
      r.status, r.source, r.pricing_tier,
      p ? Math.floor(p.amount_kobo / 100) : '',
      p?.status ?? '', p?.paystack_reference ?? '',
    ].join(',')
  })

  return { success: true, data: [header, ...lines].join('\n') }
}
