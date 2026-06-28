'use client'

import { useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowRight, ArrowUpDown, Download, Loader2, Search, X } from 'lucide-react'
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
  pending:   'bg-amber-100   text-amber-700   ring-amber-200/60',
  confirmed: 'bg-emerald-100 text-emerald-700 ring-emerald-200/60',
  completed: 'bg-sky-100     text-sky-700     ring-sky-200/60',
  cancelled: 'bg-muted       text-muted-foreground ring-border/40',
  no_show:   'bg-red-100     text-red-700     ring-red-200/60',
}

const STATUS_DOT: Record<Status, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-emerald-500',
  completed: 'bg-sky-400',
  cancelled: 'bg-muted-foreground/40',
  no_show:   'bg-red-400',
}

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed',
  cancelled: 'Cancelled', no_show: 'No Show',
}

const PAY_BADGE: Record<string, string> = {
  success:  'bg-emerald-100 text-emerald-700 ring-emerald-200/60',
  refunded: 'bg-purple-100  text-purple-700  ring-purple-200/60',
  pending:  'bg-amber-100   text-amber-700   ring-amber-200/60',
}

const PAY_DOT: Record<string, string> = {
  success:  'bg-emerald-500',
  refunded: 'bg-purple-500',
  pending:  'bg-amber-400',
}

const PAY_LABEL: Record<string, string> = {
  success: 'Paid', refunded: 'Refunded', pending: 'Pending',
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

function fmtAmount(kobo: number) {
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG')
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const FILTER_CLS = 'h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors'
const FILTER_KEYS = ['q', 'status', 'service_id', 'practitioner_id', 'payment_status', 'date_from', 'date_to']

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

  const totalPages       = Math.ceil(total / pageSize)
  const sort             = params.get('sort')
  const hasFilters       = !!params.toString()
  const activeFilterCount = FILTER_KEYS.filter(k => params.get(k)).length

  function SortHeader({ col, label }: { col: string; label: string }) {
    const active = sort === col
    return (
      <button
        onClick={() => handleSort(col)}
        className={cn(
          'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
        <ArrowUpDown className={cn('size-3 shrink-0', active ? 'text-[#C5A059]' : 'opacity-40')} />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter bar ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-3 flex flex-wrap gap-3 items-end">

        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search client, email…"
            defaultValue={params.get('q') ?? ''}
            onKeyDown={e => {
              if (e.key === 'Enter') pushParams({ q: (e.target as HTMLInputElement).value })
            }}
            onBlur={e => pushParams({ q: e.target.value })}
            className={cn(FILTER_CLS, 'pl-9 w-full')}
          />
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">From</span>
          <input type="date" defaultValue={params.get('date_from') ?? ''} onChange={e => pushParams({ date_from: e.target.value })} className={FILTER_CLS} />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">To</span>
          <input type="date" defaultValue={params.get('date_to') ?? ''} onChange={e => pushParams({ date_to: e.target.value })} className={FILTER_CLS} />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Status</span>
          <select defaultValue={params.get('status') ?? ''} onChange={e => pushParams({ status: e.target.value })} className={FILTER_CLS}>
            <option value="">All statuses</option>
            {(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as Status[]).map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Service</span>
          <select defaultValue={params.get('service_id') ?? ''} onChange={e => pushParams({ service_id: e.target.value })} className={FILTER_CLS}>
            <option value="">All services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Practitioner */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Practitioner</span>
          <select defaultValue={params.get('practitioner_id') ?? ''} onChange={e => pushParams({ practitioner_id: e.target.value })} className={FILTER_CLS}>
            <option value="">All practitioners</option>
            {practitioners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Payment */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Payment</span>
          <select defaultValue={params.get('payment_status') ?? ''} onChange={e => pushParams({ payment_status: e.target.value })} className={FILTER_CLS}>
            <option value="">All</option>
            <option value="success">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
            <option value="none">No payment</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2 ml-auto">
          {hasFilters && (
            <Button size="sm" variant="ghost" className="h-9 text-xs gap-1.5" onClick={() => router.push(pathname)}>
              <X className="size-3" />
              Clear
              {activeFilterCount > 0 && (
                <span className="size-4 rounded-full bg-foreground/10 text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleExport} disabled={exporting}>
            {exporting
              ? <Loader2 className="size-3 mr-1.5 animate-spin" />
              : <Download className="size-3 mr-1.5" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left"><SortHeader col="appointment_date" label="Date & Time" /></th>
                <th className="px-4 py-3 text-left"><SortHeader col="client_name" label="Client" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Practitioner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</th>
                <th className="px-3 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="text-sm text-muted-foreground">No appointments found.</p>
                    {hasFilters && (
                      <button
                        onClick={() => router.push(pathname)}
                        className="mt-2 text-xs text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : appointments.map((a, i) => (
                <tr
                  key={a.id}
                  className={cn(
                    'border-b last:border-0 hover:bg-muted/40 transition-colors duration-150 group',
                    i % 2 !== 0 && 'bg-muted/10',
                  )}
                >
                  {/* Date + Time */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="font-medium">{fmtDate(a.appointment_date)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{fmtTime(a.start_time)}</p>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-[#C5A059]/12 border border-[#C5A059]/25 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#C5A059]">{getInitials(a.client.full_name)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.client.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.client.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-3.5 whitespace-nowrap">{a.service.name}</td>

                  {/* Practitioner */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">{a.practitioner.full_name}</td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1',
                      STATUS_BADGE[a.status],
                    )}>
                      <span className={cn('size-1.5 rounded-full shrink-0', STATUS_DOT[a.status])} />
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>

                  {/* Payment */}
                  <td className="px-4 py-3.5">
                    {a.payment ? (
                      <div>
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1',
                          PAY_BADGE[a.payment.status] ?? 'bg-muted text-muted-foreground ring-border/40',
                        )}>
                          <span className={cn('size-1.5 rounded-full shrink-0', PAY_DOT[a.payment.status] ?? 'bg-muted-foreground/40')} />
                          {PAY_LABEL[a.payment.status] ?? a.payment.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{fmtAmount(a.payment.amount_kobo)}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-3 py-3.5 text-right">
                    <Link
                      href={`/admin/appointments/${a.id}`}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg',
                        'bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground',
                        'transition-all duration-150 whitespace-nowrap',
                        'opacity-0 group-hover:opacity-100 focus:opacity-100',
                      )}
                    >
                      View <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} appointment{total !== 1 ? 's' : ''}
          </span>
          <div className="inline-flex items-center rounded-lg border border-border divide-x divide-border overflow-hidden shadow-sm">
            <Button
              size="sm" variant="ghost"
              className="rounded-none h-8 px-3 text-xs"
              disabled={page <= 1}
              onClick={() => pushParams({ page: String(page - 1) })}
            >
              ← Prev
            </Button>
            <span className="px-3 h-8 flex items-center text-xs text-muted-foreground tabular-nums bg-muted/30">
              {page} / {totalPages}
            </span>
            <Button
              size="sm" variant="ghost"
              className="rounded-none h-8 px-3 text-xs"
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
