'use client'

import { useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUpDown, Download, Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { exportAppointmentsCsv } from '@/app/(admin)/admin/(dashboard)/appointments/actions'
import type { AppointmentRow } from '@/lib/database.types'

// ── shared types ──────────────────────────────────────────────────────────────

type Status = AppointmentRow['status']

export type AppointmentListItem = {
  id: string
  appointment_date: string
  start_time: string
  status: Status
  client:       { full_name: string; email: string }
  service:      { name: string }
  practitioner: { full_name: string }
  payment:      { status: string; amount_kobo: number } | null
}

export type FilterOption = { id: string; name: string }

interface Props {
  appointments:  AppointmentListItem[]
  total:         number
  page:          number
  pageSize:      number
  services:      FilterOption[]
  practitioners: FilterOption[]
}

// ── styling maps ──────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<Status, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-sky-100 text-sky-700',
  cancelled: 'bg-muted text-muted-foreground',
  no_show:   'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed',
  cancelled: 'Cancelled', no_show: 'No Show',
}
const PAY_BADGE: Record<string, string> = {
  success:  'bg-emerald-100 text-emerald-700',
  refunded: 'bg-purple-100 text-purple-700',
  pending:  'bg-amber-100 text-amber-700',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AppointmentTable({
  appointments, total, page, pageSize, services, practitioners,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const [exporting, startExport] = useTransition()

  const pushParams = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in updates)) next.delete('page')
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  function handleSort(col: string) {
    const currentSort = params.get('sort')
    const currentDir  = params.get('dir') ?? 'desc'
    const newDir = currentSort === col && currentDir === 'asc' ? 'desc' : 'asc'
    pushParams({ sort: col, dir: newDir, page: null })
  }

  function handleExport() {
    startExport(async () => {
      const res = await exportAppointmentsCsv({
        q:               params.get('q') ?? undefined,
        status:          params.get('status') as Status | undefined,
        service_id:      params.get('service_id') ?? undefined,
        practitioner_id: params.get('practitioner_id') ?? undefined,
        payment_status:  params.get('payment_status') ?? undefined,
        date_from:       params.get('date_from') ?? undefined,
        date_to:         params.get('date_to') ?? undefined,
      })
      if (!res.success) { toast.error(res.error); return }
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const totalPages = Math.ceil(total / pageSize)
  const sort = params.get('sort')

  function SortHeader({ col, label }: { col: string; label: string }) {
    const active = sort === col
    return (
      <button
        onClick={() => handleSort(col)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown className={cn('size-3', active ? 'text-foreground' : 'opacity-40')} />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter bar ── */}
      <div className="rounded-lg border bg-background p-3 flex flex-wrap gap-2 items-end">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search client, email…"
            defaultValue={params.get('q') ?? ''}
            onKeyDown={e => {
              if (e.key === 'Enter') pushParams({ q: (e.target as HTMLInputElement).value })
            }}
            onBlur={e => pushParams({ q: e.target.value })}
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">From</span>
          <input
            type="date"
            defaultValue={params.get('date_from') ?? ''}
            onChange={e => pushParams({ date_from: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">To</span>
          <input
            type="date"
            defaultValue={params.get('date_to') ?? ''}
            onChange={e => pushParams({ date_to: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Status</span>
          <select
            defaultValue={params.get('status') ?? ''}
            onChange={e => pushParams({ status: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All statuses</option>
            {(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as Status[]).map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Service</span>
          <select
            defaultValue={params.get('service_id') ?? ''}
            onChange={e => pushParams({ service_id: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Practitioner */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Practitioner</span>
          <select
            defaultValue={params.get('practitioner_id') ?? ''}
            onChange={e => pushParams({ practitioner_id: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All practitioners</option>
            {practitioners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Payment status */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Payment</span>
          <select
            defaultValue={params.get('payment_status') ?? ''}
            onChange={e => pushParams({ payment_status: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All</option>
            <option value="success">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
            <option value="none">No payment</option>
          </select>
        </div>

        {/* Clear + Export */}
        <div className="flex items-end gap-2 ml-auto">
          {params.toString() && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => router.push(pathname)}
            >
              <X className="size-3 mr-1" /> Clear
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport} disabled={exporting}>
            {exporting
              ? <Loader2 className="size-3 mr-1.5 animate-spin" />
              : <Download className="size-3 mr-1.5" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left"><SortHeader col="appointment_date" label="Date" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</th>
              <th className="px-4 py-3 text-left"><SortHeader col="client_name" label="Client" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Practitioner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No appointments found
                </td>
              </tr>
            ) : appointments.map(a => (
              <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">{fmtDate(a.appointment_date)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtTime(a.start_time)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{a.client.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.client.email}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{a.service.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{a.practitioner.full_name}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    STATUS_BADGE[a.status],
                  )}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.payment ? (
                    <div>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        PAY_BADGE[a.payment.status] ?? 'bg-muted text-muted-foreground',
                      )}>
                        {a.payment.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ₦{Math.floor(a.payment.amount_kobo / 100).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/appointments/${a.id}`}
                    className="text-xs text-primary hover:underline underline-offset-2 whitespace-nowrap"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {total} appointment{total !== 1 ? 's' : ''} · page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={page <= 1}
              onClick={() => pushParams({ page: String(page - 1) })}
            >
              ← Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={page >= totalPages}
              onClick={() => pushParams({ page: String(page + 1) })}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
