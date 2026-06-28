'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { updateClient, getClientHistory } from '@/app/(admin)/admin/(dashboard)/clients/actions'
import type { ClientRow } from '@/lib/database.types'
import type { ClientHistoryItem } from '@/app/(admin)/admin/(dashboard)/clients/actions'

// ── Status styling ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-sky-100 text-sky-700',
  no_show:   'bg-red-100 text-red-700',
  cancelled: 'bg-muted text-muted-foreground',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  no_show:   'No Show',
  cancelled: 'Cancelled',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

// ── Edit form schema ──────────────────────────────────────────────────────────

const editSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone:     z.string().min(7, 'Phone number is too short'),
  notes:     z.string().optional(),
})
type EditData = z.infer<typeof editSchema>

// ── ClientDrawer ──────────────────────────────────────────────────────────────

interface Props {
  client:    ClientRow | null
  open:      boolean
  onClose:   () => void
  onUpdated: (updated: ClientRow) => void
}

export default function ClientDrawer({ client, open, onClose, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState<ClientHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError]     = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditData>({
    resolver: zodResolver(editSchema),
  })

  // When a different client is selected, reset edit state + history
  useEffect(() => {
    setEditing(false)
    setHistory([])
    setHistoryError(null)
    if (client) {
      reset({ full_name: client.full_name, phone: client.phone, notes: client.notes ?? '' })
    }
  }, [client?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch history when drawer opens
  useEffect(() => {
    if (!open || !client) return
    setHistoryLoading(true)
    setHistoryError(null)
    startTransition(async () => {
      const res = await getClientHistory(client.id)
      setHistoryLoading(false)
      if (res.success) setHistory(res.items)
      else setHistoryError(res.error)
    })
  }, [open, client?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: EditData) {
    if (!client) return
    const res = await updateClient(client.id, data)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success('Client updated')
    setEditing(false)
    onUpdated({ ...client, ...data, notes: data.notes || null })
  }

  if (!client) return null

  const visitCount = history.filter(h => h.status !== 'cancelled').length

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="sm:max-w-md flex flex-col gap-0 p-0" showCloseButton={false}>

        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold truncate">
                {client.full_name}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {visitCount} visit{visitCount !== 1 ? 's' : ''} · member since {fmtDate(client.created_at)}
              </p>
            </div>
            <SheetClose render={<Button variant="ghost" size="icon-sm" type="button" />} onClick={onClose}>
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* ── Details section ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Details
              </h3>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <Field label="Name" error={errors.full_name?.message}>
                  <input
                    {...register('full_name')}
                    className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Phone" error={errors.phone?.message}>
                  <input
                    {...register('phone')}
                    className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+234…"
                  />
                </Field>
                <Field label="Email">
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </Field>
                <Field label="Notes" error={errors.notes?.message}>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Internal notes…"
                  />
                </Field>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Check className="size-3 mr-1" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      reset({ full_name: client.full_name, phone: client.phone, notes: client.notes ?? '' })
                      setEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="space-y-2 text-sm">
                <DetailRow label="Email">{client.email}</DetailRow>
                <DetailRow label="Phone">{client.phone}</DetailRow>
                {client.notes && (
                  <DetailRow label="Notes">
                    <span className="whitespace-pre-wrap">{client.notes}</span>
                  </DetailRow>
                )}
              </dl>
            )}
          </section>

          {/* ── Appointment history ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Appointment history
            </h3>

            {historyLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            )}

            {historyError && (
              <p className="text-sm text-destructive">{historyError}</p>
            )}

            {!historyLoading && !historyError && history.length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments yet.</p>
            )}

            {!historyLoading && history.length > 0 && (
              <ul className="space-y-2">
                {history.map(item => (
                  <li
                    key={item.id}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-sm',
                      item.status === 'cancelled' && 'opacity-50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {item.service_name ?? 'Unknown service'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtDate(item.appointment_date)} · {fmtTime(item.start_time)}–{fmtTime(item.end_time)}
                        </p>
                        {item.practitioner_name && (
                          <p className="text-xs text-muted-foreground">
                            with {item.practitioner_name}
                          </p>
                        )}
                      </div>
                      <span className={cn(
                        'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_BADGE[item.status] ?? STATUS_BADGE.pending,
                      )}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic">
                        {item.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-foreground break-all">{children}</dd>
    </div>
  )
}
