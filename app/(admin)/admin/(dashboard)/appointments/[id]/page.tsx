import { notFound } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import AppointmentDetail from '@/components/admin/appointments/AppointmentDetail'
import type { DetailAppointment } from '@/components/admin/appointments/AppointmentDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const db = getSupabaseServiceClient()

  const { data: appt, error } = await db
    .from('appointments')
    .select(`
      id, appointment_date, start_time, end_time, status, notes, source, pricing_tier, client_id,
      clients!inner(id, full_name, email, phone),
      services!inner(id, name, duration_minutes),
      users!appointments_practitioner_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single()

  if (error || !appt) notFound()

  // Payment, audit log, lifetime count in parallel
  const [paymentRes, auditRes, lifetimeRes] = await Promise.all([
    db
      .from('payments')
      .select('id, paystack_reference, amount_kobo, status, channel, verified_at')
      .eq('appointment_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('audit_log')
      .select('id, action, changes, created_at, actor_id')
      .eq('entity_type', 'appointment')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', appt.client_id)
      .eq('status', 'completed'),
  ])

  // Resolve actor names in one query
  const actorIds = [...new Set(
    (auditRes.data ?? []).map(e => e.actor_id).filter((a): a is string => !!a)
  )]
  const { data: actors } = actorIds.length > 0
    ? await db.from('users').select('id, full_name').in('id', actorIds)
    : { data: [] as { id: string; full_name: string }[] }
  const actorMap = new Map((actors ?? []).map(a => [a.id, a.full_name]))

  // Shape into DetailAppointment
  const c = appt.clients  as unknown as { id: string; full_name: string; email: string; phone: string }
  const s = appt.services as unknown as { id: string; name: string; duration_minutes: number }
  const u = appt.users    as unknown as { id: string; full_name: string }

  const detail: DetailAppointment = {
    id: appt.id,
    appointment_date: appt.appointment_date,
    start_time: appt.start_time,
    end_time: appt.end_time,
    status: appt.status,
    notes: appt.notes,
    source: appt.source,
    pricing_tier: appt.pricing_tier,
    client: {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      lifetime_count: lifetimeRes.count ?? 0,
    },
    service: { id: s.id, name: s.name, duration_minutes: s.duration_minutes },
    practitioner: { id: u.id, full_name: u.full_name },
    payment: paymentRes.data ?? null,
    audit: (auditRes.data ?? []).map(e => ({
      id: e.id,
      action: e.action,
      actor_name: e.actor_id ? (actorMap.get(e.actor_id) ?? null) : null,
      changes: e.changes,
      created_at: e.created_at,
    })),
  }

  return (
    <div className="p-6">
      <AppointmentDetail appt={detail} />
    </div>
  )
}
