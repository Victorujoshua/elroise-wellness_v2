'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
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

const CARD_STYLE: Record<string, string> = {
  pending:   'bg-amber-50   border-l-amber-400   text-amber-900',
  confirmed: 'bg-emerald-50 border-l-emerald-500 text-emerald-900',
  completed: 'bg-sky-50     border-l-sky-500     text-sky-900',
  no_show:   'bg-red-50     border-l-red-400     text-red-900',
  cancelled: 'bg-muted      border-l-border      text-muted-foreground opacity-60',
}

const BADGE_STYLE: Record<string, string> = {
  pending:   'bg-amber-100   text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-sky-100     text-sky-700',
  no_show:   'bg-red-100     text-red-700',
  cancelled: 'bg-muted       text-muted-foreground',
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

// ── AppointmentCard ───────────────────────────────────────────────────────────

interface Props {
  appt:   CalendarAppointment
  top:    number
  height: number
}

export default function AppointmentCard({ appt, top, height }: Props) {
  const [open, setOpen] = useState(false)

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
          'rounded-md border-l-[3px] px-2 py-1 text-left text-xs overflow-hidden',
          'shadow-sm hover:brightness-95 transition-[filter] cursor-pointer',
          CARD_STYLE[appt.status] ?? CARD_STYLE.pending,
        )}
        title={`${appt.clients?.full_name ?? ''} — ${appt.services?.name ?? ''}`}
      >
        <p className="font-semibold truncate leading-tight">
          {appt.clients?.full_name ?? 'Unknown'}
        </p>
        {height >= 48 && (
          <p className="truncate leading-tight mt-0.5 opacity-75">
            {appt.services?.name ?? ''}
          </p>
        )}
        {height >= 76 && (
          <p className="leading-tight mt-0.5 opacity-60 tabular-nums">
            {fmtTime(appt.start_time)} – {fmtTime(appt.end_time)}
          </p>
        )}
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
      <DialogContent className="sm:max-w-sm flex flex-col gap-0 p-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b shrink-0">
          <div className="min-w-0 pr-2">
            <DialogTitle className="text-base font-semibold truncate">
              {appt.clients?.full_name ?? 'Unknown client'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
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
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                BADGE_STYLE[appt.status],
              )}>
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
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  )
}
