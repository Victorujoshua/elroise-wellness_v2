import { getDashboardData } from './actions'
import type { DashboardAppointment, UpcomingAppointment } from './actions'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNaira = (n: number) =>
  '₦' + new Intl.NumberFormat('en-NG').format(Math.round(n))

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function durationMin(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function dayHeading(dateStr: string, isTomorrow: boolean): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short',
  })
  return isTomorrow ? `Tomorrow — ${label}` : label
}

const STATUS_CLS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-zinc-100 text-zinc-500',
  no_show:   'bg-red-100 text-red-500',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={cn(
      'relative overflow-hidden border bg-card p-5',
      accent ? 'border-[#C5A059]/30' : 'border-border',
    )}>
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
      )}
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
        {label}
      </p>
      <p className={cn('text-3xl font-semibold tabular-nums tracking-tight', accent ? 'text-[#C5A059]' : 'text-foreground')}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full',
      STATUS_CLS[status] ?? 'bg-zinc-100 text-zinc-500',
    )}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status.replace('_', ' ')}
    </span>
  )
}

function TodayTable({ appointments }: { appointments: DashboardAppointment[] }) {
  if (appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        No appointments scheduled for today.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="border-b border-border">
            {['Time', 'Client', 'Service', 'Practitioner', 'Dur.', 'Status'].map(h => (
              <th
                key={h}
                className="text-left pb-2 pr-4 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground last:pr-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {appointments.map(a => (
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-150">
              <td className="py-3 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                {fmtTime(a.start_time)}
              </td>
              <td className="py-3 pr-4 font-medium">{a.client_name}</td>
              <td className="py-3 pr-4 text-muted-foreground">{a.service_name}</td>
              <td className="py-3 pr-4 text-muted-foreground">{a.practitioner_name}</td>
              <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                {durationMin(a.start_time, a.end_time)} min
              </td>
              <td className="py-3">
                <StatusBadge status={a.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UpcomingList({ appointments }: { appointments: UpcomingAppointment[] }) {
  if (appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        No upcoming appointments in the next 7 days.
      </p>
    )
  }

  const tomorrow = tomorrowStr()

  // Group by date preserving order
  const groups: { date: string; items: UpcomingAppointment[] }[] = []
  for (const appt of appointments) {
    const last = groups[groups.length - 1]
    if (last?.date === appt.appointment_date) {
      last.items.push(appt)
    } else {
      groups.push({ date: appt.appointment_date, items: [appt] })
    }
  }

  return (
    <div className="space-y-6">
      {groups.map(({ date, items }) => (
        <div key={date}>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
            {dayHeading(date, date === tomorrow)}
          </p>
          <div className="space-y-2">
            {items.map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <span className="font-mono text-xs text-muted-foreground w-[68px] shrink-0 pt-px">
                  {fmtTime(a.start_time)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">{a.client_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.service_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6 max-w-[1200px]">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{todayLabel()}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today"
          value={String(data.todayCount)}
          sub="bookings today"
        />
        <KpiCard
          label="This Week"
          value={String(data.weekCount)}
          sub="Mon – Sun"
        />
        <KpiCard
          label="Next 7 Days"
          value={String(data.upcomingCount)}
          sub="upcoming bookings"
        />
        <KpiCard
          label="Revenue This Week"
          value={fmtNaira(data.weekRevenueNaira)}
          sub="confirmed payments"
          accent
        />
      </div>

      {/* Main content: today (60%) + upcoming (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

        {/* Today's appointments */}
        <div className="border border-border bg-card p-6">
          <h2 className="text-sm font-semibold mb-4">Today&apos;s Appointments</h2>
          <TodayTable appointments={data.todaysAppointments} />
        </div>

        {/* Upcoming */}
        <div className="border border-border bg-card p-6">
          <h2 className="text-sm font-semibold mb-4">Upcoming — Next 7 Days</h2>
          <UpcomingList appointments={data.upcomingAppointments} />
        </div>

      </div>
    </div>
  )
}
