'use server'

import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'

// ── getDashboardData ──────────────────────────────────────────────────────────

function weekBounds(now: Date): { weekStart: string; weekEnd: string } {
  const day = now.getDay() // 0 = Sun
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) }
}

export type DashboardAppointment = {
  id: string
  start_time: string
  end_time: string
  status: string
  client_name: string
  service_name: string
  practitioner_name: string
}

export type UpcomingAppointment = {
  id: string
  appointment_date: string
  start_time: string
  client_name: string
  service_name: string
  practitioner_name: string
}

export type DashboardData = {
  todayCount: number
  weekCount: number
  upcomingCount: number
  weekRevenueNaira: number
  todaysAppointments: DashboardAppointment[]
  upcomingAppointments: UpcomingAppointment[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const db  = getSupabaseServiceClient()
  const now = new Date()

  const todayStr = now.toISOString().slice(0, 10)
  const { weekStart, weekEnd } = weekBounds(now)

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const next7 = new Date(now)
  next7.setDate(now.getDate() + 7)
  const next7Str = next7.toISOString().slice(0, 10)

  const [
    todayCountRes,
    weekCountRes,
    upcomingCountRes,
    weekRevenueRes,
    todaysApptRes,
    upcomingApptRes,
  ] = await Promise.allSettled([
    // 1. Today's booking count
    db.from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('appointment_date', todayStr)
      .neq('status', 'cancelled'),

    // 2. This week's booking count (Mon–Sun)
    db.from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('appointment_date', weekStart)
      .lte('appointment_date', weekEnd)
      .neq('status', 'cancelled'),

    // 3. Upcoming next 7 days (tomorrow → today+7)
    db.from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('appointment_date', tomorrowStr)
      .lte('appointment_date', next7Str)
      .neq('status', 'cancelled'),

    // 4. Revenue: week appointments with their payments (sum in JS)
    db.from('appointments')
      .select('payments(amount_kobo, status, refunded_amount_kobo)')
      .gte('appointment_date', weekStart)
      .lte('appointment_date', weekEnd)
      .neq('status', 'cancelled'),

    // 5. Today's appointments (full detail for table)
    db.from('appointments')
      .select(`
        id, start_time, end_time, status,
        clients!inner(full_name),
        services!inner(name),
        users!appointments_practitioner_id_fkey(full_name)
      `)
      .eq('appointment_date', todayStr)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true }),

    // 6. Upcoming 7 days (list view, max 20)
    db.from('appointments')
      .select(`
        id, appointment_date, start_time,
        clients!inner(full_name),
        services!inner(name),
        users!appointments_practitioner_id_fkey(full_name)
      `)
      .gte('appointment_date', tomorrowStr)
      .lte('appointment_date', next7Str)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20),
  ])

  // Revenue: sum paid statuses (Paystack, cash, POS), net of any partial refunds
  type PaymentRow = { amount_kobo: number; status: string; refunded_amount_kobo: number | null }
  let weekRevenueNaira = 0
  if (weekRevenueRes.status === 'fulfilled' && weekRevenueRes.value.data) {
    weekRevenueNaira =
      (weekRevenueRes.value.data as unknown as { payments: PaymentRow[] | null }[])
        .flatMap(a => a.payments ?? [])
        .filter(p => ['success', 'cash', 'pos'].includes(p.status))
        .reduce((sum, p) => sum + (p.amount_kobo - (p.refunded_amount_kobo ?? 0)), 0) / 100
  }

  // Shape today's appointments
  type RawToday = {
    id: string; start_time: string; end_time: string; status: string
    clients: { full_name: string } | null
    services: { name: string } | null
    users: { full_name: string } | null
  }
  const todaysAppointments: DashboardAppointment[] =
    todaysApptRes.status === 'fulfilled'
      ? ((todaysApptRes.value.data ?? []) as unknown as RawToday[]).map(r => ({
          id: r.id,
          start_time: r.start_time,
          end_time: r.end_time,
          status: r.status,
          client_name: r.clients?.full_name ?? '—',
          service_name: r.services?.name ?? '—',
          practitioner_name: r.users?.full_name ?? '—',
        }))
      : []

  // Shape upcoming appointments
  type RawUpcoming = {
    id: string; appointment_date: string; start_time: string
    clients: { full_name: string } | null
    services: { name: string } | null
    users: { full_name: string } | null
  }
  const upcomingAppointments: UpcomingAppointment[] =
    upcomingApptRes.status === 'fulfilled'
      ? ((upcomingApptRes.value.data ?? []) as unknown as RawUpcoming[]).map(r => ({
          id: r.id,
          appointment_date: r.appointment_date,
          start_time: r.start_time,
          client_name: r.clients?.full_name ?? '—',
          service_name: r.services?.name ?? '—',
          practitioner_name: r.users?.full_name ?? '—',
        }))
      : []

  return {
    todayCount:    todayCountRes.status    === 'fulfilled' ? (todayCountRes.value.count    ?? 0) : 0,
    weekCount:     weekCountRes.status     === 'fulfilled' ? (weekCountRes.value.count     ?? 0) : 0,
    upcomingCount: upcomingCountRes.status === 'fulfilled' ? (upcomingCountRes.value.count ?? 0) : 0,
    weekRevenueNaira,
    todaysAppointments,
    upcomingAppointments,
  }
}

// ── signOut ───────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createAuthClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function getAppointmentDensity(
  year: number,
  month: number,
): Promise<Record<string, number>> {
  return unstable_cache(
    async () => {
      const db      = getSupabaseServiceClient()
      const start   = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const end     = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const { data } = await db
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .neq('status', 'cancelled')

      const density: Record<string, number> = {}
      for (const row of data ?? []) {
        density[row.appointment_date] = (density[row.appointment_date] ?? 0) + 1
      }
      return density
    },
    [`appointment-density-${year}-${month}`],
    { revalidate: 60 },
  )()
}
