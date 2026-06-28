'use client'

import { useState, useTransition } from 'react'
import { X, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { updateAppointmentStatus } from '@/app/(admin)/admin/(dashboard)/calendar/actions'
import type { CalendarAppointment } from './CalendarView'

// ── Status styling ────────────────────────────────────────────────────────────

const CARD_BG: Record<string, string> = {
  pending:   'bg-amber-50   border-l-amber-400   text-amber-950',
  confirmed: 'bg-emerald-50 border-l-emerald-500 text-emerald-950',
  completed: 'bg-sky-50     border-l-sky-400     text-sky-950',
  no_show:   'bg-red-50     border-l-red-400     text-red-950',
  cancelled: 'bg-muted/50   border-l-border      text-muted-foreground',
}

const STATUS_DOT: Record<string, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-emerald-500',
  completed: 'bg-sky-400',
  no_show:   'bg-red-400',
  cancelled: 'bg-muted-foreground/40',
}

const STATUS_STRIPE: Record<string, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-emerald-500',
  completed: 'bg-sky-400',
  no_show:   'bg-red-400',
  cancelled: 'bg-border',
}

const BADGE_STYLE: Record<string, string> = {
  pending:   'bg-amber-100   text-amber-700   ring-amber-200/60',
  confirmed: 'bg-emerald-100 text-emerald-700 ring-emerald-200/60',
  completed: 'bg-sky-100     text-sky-700     ring-sky-200/60',
  no_show:   'bg-red-100     text-red-700     ring-red-200/60',
  cancelled: 'bg-muted       text-muted-foreground ring-border/40',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  no_show:   'No Show',
  cancelled: 'Cancelled',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── AppointmentCard ───────────────────────────────────────────────────────────

interface Props {
  appt:   CalendarAppointment
  top:    number
  height: number
}

export default function AppointmentCard({ appt, top, height }: Props) {
  const [open, setOpen] = useState(false)
  const isCancelled = appt.status === 'cancelled'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          top:      top + 2,
          height:   Math.max(height - 4, 24),
          left:     4,
          right:    4,
        }}
        className={cn(
          'rounded-lg border-l-4 overflow-hidden text-left',
          'shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]',
          'hover:shadow-[0_4px_8px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
          'hover:-translate-y-px transition-all duration-150 cursor-pointer',
          isCancelled && 'opacity-50',
          CARD_BG[appt.status] ?? CARD_BG.pending,
        )}
        title={`${appt.clients?.full_name ?? ''} — ${appt.services?.name ?? ''}`}
      >
        <div className="px-2 py-1 text-xs h-full flex flex-col justify-start gap-px overflow-hidden">
          {/* Name row with status dot */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('size-1.5 rounded-full shrink-0', STATUS_DOT[appt.status] ?? STATUS_DOT.pending)} />
            <p className="font-semibold truncate leading-tight text-[11px]">
              {appt.clients?.full_name ?? 'Unknown'}
            </p>
          </div>
          {/* Service */}
          <p className="truncate leading-tight text-[10px] opacity-70 pl-3">
            {appt.services?.name ?? ''}
          </p>
          {/* Time range */}
          <p className="leading-tight text-[10px] opacity-55 pl-3 tabular-nums whitespace-nowrap">
            {fmtTime(appt.start_time)} – {fmtTime(appt.end_time)}
          </p>
        </div>
      </button>

      <AppointmentDetail appt={appt} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

// ── AppointmentDetail ─────────────────────────────────────────────────────────

function AppointmentDetail({
  appt,
  open,
  onClose,
}: {
  appt:    CalendarAppointment
  open:    boolean
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const durationMin = timeToMin(appt.end_time) - timeToMin(appt.start_time)

  function handleStatusChange(val: string | null) {
    if (!val) return
    startTransition(async () => {
      const res = await updateAppointmentStatus(appt.id, val as CalendarAppointment['status'])
      if (!res.success) toast.error(res.error)
      else toast.success('Status updated')
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm flex flex-col gap-0 p-0 overflow-hidden" showCloseButton={false}>
        {/* Status colour stripe */}
        <div className={cn('h-1 w-full shrink-0', STATUS_STRIPE[appt.status] ?? STATUS_STRIPE.pending)} />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b bg-muted/20 shrink-0">
          {/* Client avatar */}
          <div className="size-9 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/25 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[11px] font-bold text-[#C5A059]">
              {appt.clients?.full_name ? getInitials(appt.clients.full_name) : '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold truncate leading-tight">
              {appt.clients?.full_name ?? 'Unknown client'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              {fmtTime(appt.start_time)} – {fmtTime(appt.end_time)} · {durationMin} min
            </p>
          </div>
          <DialogClose render={<Button variant="ghost" size="icon-sm" type="button" />} onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4 text-sm overflow-y-auto">
          {/* Service */}
          <Section label="Service">
            <p className="font-medium">{appt.services?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {appt.pricing_tier} session · booked via {appt.source}
            </p>
          </Section>

          {/* Client contact */}
          {appt.clients && (
            <Section label="Client">
              <p className="font-medium">{appt.clients.full_name}</p>
              <a href={`tel:${appt.clients.phone}`} className="text-xs text-[#636B2F] hover:underline block mt-0.5">
                {appt.clients.phone}
              </a>
              <a href={`mailto:${appt.clients.email}`} className="text-xs text-[#636B2F] hover:underline block">
                {appt.clients.email}
              </a>
            </Section>
          )}

          {/* Practitioner */}
          <Section label="Practitioner">
            <p>{appt.users?.full_name ?? '—'}</p>
          </Section>

          {/* Notes */}
          {appt.notes && (
            <Section label="Notes">
              <p className="text-foreground">{appt.notes}</p>
            </Section>
          )}

          {/* Status */}
          <Section label="Status">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1',
                BADGE_STYLE[appt.status],
              )}>
                <span className={cn('size-1.5 rounded-full', STATUS_DOT[appt.status])} />
                {STATUS_LABEL[appt.status]}
              </span>
              <Select value={appt.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {isPending && (
                <span className="text-xs text-muted-foreground">Saving…</span>
              )}
            </div>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">{label}</p>
      {children}
    </div>
  )
}
