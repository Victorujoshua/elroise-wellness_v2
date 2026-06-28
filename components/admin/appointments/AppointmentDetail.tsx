'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Check, X, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import StatusDialog from './StatusDialog'
import CancelDialog from './CancelDialog'
import RescheduleDialog from './RescheduleDialog'
import RefundDialog from './RefundDialog'
import { updateAppointmentNotes } from '@/app/(admin)/admin/(dashboard)/appointments/actions'
import type { AppointmentRow, Json } from '@/lib/database.types'

// ── types ─────────────────────────────────────────────────────────────────────

type Status = AppointmentRow['status']

export type DetailAppointment = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: Status
  notes: string | null
  source: string
  pricing_tier: string
  client: {
    id: string; full_name: string; email: string; phone: string; lifetime_count: number
  }
  service: { id: string; name: string; duration_minutes: number }
  practitioner: { id: string; full_name: string }
  payment: {
    id: string; paystack_reference: string; amount_kobo: number
    status: string; channel: string | null; verified_at: string | null
  } | null
  audit: {
    id: string; action: string; actor_name: string | null
    changes: Json | null; created_at: string
  }[]
}

// ── status styling ────────────────────────────────────────────────────────────

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
const PAYMENT_BADGE: Record<string, string> = {
  success:  'bg-emerald-100 text-emerald-700',
  refunded: 'bg-purple-100 text-purple-700',
  pending:  'bg-amber-100 text-amber-700',
  cash:     'bg-sky-100 text-sky-700',
  pos:      'bg-sky-100 text-sky-700',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
function fmtAuditAction(action: string) {
  const map: Record<string, string> = {
    update_status: 'Status changed', reschedule: 'Rescheduled',
    cancel: 'Cancelled', refund: 'Refund processed',
    update_notes: 'Notes updated', create: 'Appointment created',
  }
  return map[action] ?? action
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border bg-background flex flex-col">
      <div className="px-4 py-3 border-b">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <div className="px-4 py-4 flex-1">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm py-1">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground break-all">{children}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AppointmentDetail({ appt: initial }: { appt: DetailAppointment }) {
  const router = useRouter()
  const [appt, setAppt]               = useState(initial)
  const [statusOpen, setStatusOpen]   = useState(false)
  const [cancelOpen, setCancelOpen]   = useState(false)
  const [reschedOpen, setReschedOpen] = useState(false)
  const [refundOpen, setRefundOpen]   = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue]     = useState(initial.notes ?? '')
  const [, startTransition]             = useTransition()

  const canRefund =
    (['confirmed', 'no_show'] as Status[]).includes(appt.status) &&
    appt.payment?.status === 'success'

  function handleStatusUpdated(newStatus: Status) {
    setAppt(a => ({ ...a, status: newStatus }))
  }

  function handleNoteSave() {
    startTransition(async () => {
      const res = await updateAppointmentNotes(appt.id, notesValue)
      if (!res.success) { toast.error(res.error); return }
      toast.success('Notes saved')
      setAppt(a => ({ ...a, notes: notesValue || null }))
      setEditingNotes(false)
    })
  }

  function handleRescheduled() { router.refresh() }
  function handleCancelled()   { router.refresh() }
  function handleRefunded()    { router.refresh() }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href="/admin/appointments"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="size-3" /> All appointments
          </Link>
          <h2 className="text-lg font-semibold leading-tight">
            {appt.client.full_name} · {appt.service.name}
          </h2>
          <p className="text-sm text-muted-foreground">{fmtDate(appt.appointment_date)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
            STATUS_BADGE[appt.status],
          )}>
            {STATUS_LABEL[appt.status]}
          </span>
          <Button size="sm" variant="outline" onClick={() => setStatusOpen(true)}>
            Change status
          </Button>
        </div>
      </div>

      {/* ── 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left — Client */}
        <Card title="Client">
          <div className="space-y-0.5">
            <p className="font-medium text-sm">{appt.client.full_name}</p>
            <p className="text-sm text-muted-foreground">{appt.client.email}</p>
            <p className="text-sm text-muted-foreground">{appt.client.phone}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {appt.client.lifetime_count} lifetime visit{appt.client.lifetime_count !== 1 ? 's' : ''}
          </p>
          <div className="mt-4">
            <Link
              href={`/admin/clients?q=${encodeURIComponent(appt.client.email)}`}
              className="text-xs text-primary hover:underline underline-offset-2 flex items-center gap-1 w-fit"
            >
              View client <ExternalLink className="size-3" />
            </Link>
          </div>
        </Card>

        {/* Centre — Appointment details */}
        <Card title="Appointment">
          <div className="space-y-0.5 mb-4">
            <Row label="Service">{appt.service.name}</Row>
            <Row label="Date">{fmtDate(appt.appointment_date)}</Row>
            <Row label="Time">{fmtTime(appt.start_time)} – {fmtTime(appt.end_time)}</Row>
            <Row label="Practitioner">{appt.practitioner.full_name}</Row>
            <Row label="Pricing">{appt.pricing_tier}</Row>
            <Row label="Source">{appt.source}</Row>
          </div>

          {/* Inline notes edit */}
          <div className="border-t pt-3 mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Notes</span>
              {!editingNotes && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                  onClick={() => { setNotesValue(appt.notes ?? ''); setEditingNotes(true) }}>
                  <Pencil className="size-3 mr-1" /> Edit
                </Button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  rows={3}
                  placeholder="Internal notes…"
                  className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs" onClick={handleNoteSave}>
                    <Check className="size-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => setEditingNotes(false)}>
                    <X className="size-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {appt.notes ?? <span className="italic">No notes</span>}
              </p>
            )}
          </div>
        </Card>

        {/* Right — Payment */}
        <Card title="Payment">
          {appt.payment ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold">
                  ₦{Math.floor(appt.payment.amount_kobo / 100).toLocaleString()}
                </span>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  PAYMENT_BADGE[appt.payment.status] ?? 'bg-muted text-muted-foreground',
                )}>
                  {appt.payment.status}
                </span>
              </div>
              <Row label="Reference">
                <span className="font-mono text-xs">{appt.payment.paystack_reference}</span>
              </Row>
              {appt.payment.channel && <Row label="Channel">{appt.payment.channel}</Row>}
              {appt.payment.verified_at && (
                <Row label="Verified">{fmtTs(appt.payment.verified_at)}</Row>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="https://dashboard.paystack.com/#/transactions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline underline-offset-2 flex items-center gap-1 w-fit"
                >
                  View in Paystack <ExternalLink className="size-3" />
                </a>
                {canRefund && (
                  <Button size="sm" variant="destructive" className="w-fit mt-1"
                    onClick={() => setRefundOpen(true)}>
                    Process refund
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No payment recorded</p>
          )}
        </Card>
      </div>

      {/* ── Actions bar ── */}
      {appt.status !== 'cancelled' && appt.status !== 'completed' && (
        <div className="flex items-center gap-2 flex-wrap border bg-muted/30 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-2">Actions</span>
          <Button size="sm" variant="outline" onClick={() => setReschedOpen(true)}>
            Reschedule
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setCancelOpen(true)}
          >
            Cancel without refund
          </Button>
        </div>
      )}

      {/* ── Activity log ── */}
      {appt.audit.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Activity log
          </h3>
          <div className="border bg-background divide-y">
            {appt.audit.map(entry => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-4 text-sm">
                <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 w-36 shrink-0">
                  {fmtTs(entry.created_at)}
                </span>
                <div className="min-w-0">
                  <span className="font-medium">{fmtAuditAction(entry.action)}</span>
                  {entry.actor_name && (
                    <span className="text-muted-foreground"> by {entry.actor_name}</span>
                  )}
                  {entry.changes && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                      {JSON.stringify(entry.changes)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <StatusDialog
        appointmentId={appt.id}
        currentStatus={appt.status}
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onUpdated={handleStatusUpdated}
      />
      <CancelDialog
        appointmentId={appt.id}
        clientName={appt.client.full_name}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
      />
      <RescheduleDialog
        appointmentId={appt.id}
        serviceId={appt.service.id}
        clientName={appt.client.full_name}
        open={reschedOpen}
        onClose={() => setReschedOpen(false)}
        onRescheduled={handleRescheduled}
      />
      {appt.payment && (
        <RefundDialog
          appointmentId={appt.id}
          clientName={appt.client.full_name}
          originalAmountKobo={appt.payment.amount_kobo}
          open={refundOpen}
          onClose={() => setRefundOpen(false)}
          onRefunded={handleRefunded}
        />
      )}
    </div>
  )
}
