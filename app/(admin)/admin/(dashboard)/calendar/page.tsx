import { getSupabaseServiceClient } from '@/lib/supabase/server'
import CalendarView from '@/components/admin/calendar/CalendarView'
import type { CalendarAppointment, Practitioner } from '@/components/admin/calendar/CalendarView'
import type { ServiceOption } from '@/components/admin/calendar/AddBookingSheet'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const { date: rawDate } = await searchParams
  const date = rawDate ?? todayISO()

  const db = getSupabaseServiceClient()

  const [practitionersRes, appointmentsRes, servicesRes] = await Promise.all([
    db
      .from('users')
      .select('id, full_name')
      .in('role', ['practitioner', 'owner'])
      .eq('is_active', true)
      .order('full_name'),
    db
      .from('appointments')
      .select(`
        id, start_time, end_time, status, notes, pricing_tier, source,
        clients ( full_name, email, phone ),
        services ( name, color_hex ),
        users ( id, full_name )
      `)
      .eq('appointment_date', date)
      .order('start_time'),
    db
      .from('services')
      .select('id, name, duration_minutes, single_price_naira, package_price_naira, package_session_count')
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
  ])

  const appointments = (appointmentsRes.data ?? []) as unknown as CalendarAppointment[]

  // Build practitioner list from active users; append any inactive practitioners
  // who still have appointments on this day so their cards remain visible.
  const practitionerMap = new Map<string, Practitioner>(
    (practitionersRes.data ?? []).map(p => [p.id, p]),
  )
  for (const appt of appointments) {
    if (appt.users && !practitionerMap.has(appt.users.id)) {
      practitionerMap.set(appt.users.id, appt.users)
    }
  }
  const practitioners = Array.from(practitionerMap.values())

  const services = (servicesRes.data ?? []) as ServiceOption[]

  return (
    <CalendarView
      date={date}
      practitioners={practitioners}
      appointments={appointments}
      services={services}
    />
  )
}
