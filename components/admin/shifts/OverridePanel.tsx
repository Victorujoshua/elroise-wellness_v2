'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { upsertOverride, deleteOverride } from '@/app/(admin)/admin/(dashboard)/shifts/actions'
import type { ShiftOverrideRow } from '@/lib/database.types'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

interface Props {
  practitionerId: string
  overrides:      ShiftOverrideRow[]
}

export default function OverridePanel({ practitionerId, overrides }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Overrides replace the regular schedule for a specific date.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5 mr-1.5" />
          Add override
        </Button>
      </div>

      {overrides.length === 0 ? (
        <div className="rounded-lg border border-dashed border-charcoal/20 py-10 text-center">
          <p className="text-sm text-muted-foreground">No overrides recorded.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {overrides.map(row => (
            <OverrideItem key={row.id} row={row} />
          ))}
        </ul>
      )}

      <AddOverrideDialog
        open={dialogOpen}
        practitionerId={practitionerId}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}

function OverrideItem({ row }: { row: ShiftOverrideRow }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteOverride(row.id)
      if (!res.success) toast.error(res.error)
      else toast.success('Override removed')
    })
  }

  return (
    <li className="flex items-center justify-between px-4 py-3 text-sm">
      <div>
        <span className="font-medium">{fmtDate(row.override_date)}</span>
        <p className="text-xs text-muted-foreground mt-0.5">
          {row.is_unavailable
            ? 'Unavailable'
            : `${fmtTime(row.start_time!)} – ${fmtTime(row.end_time!)}`}
          {row.reason ? ` — ${row.reason}` : ''}
        </p>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  )
}

function AddOverrideDialog({
  open,
  practitionerId,
  onClose,
}: {
  open:           boolean
  practitionerId: string
  onClose:        () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setIsUnavailable(false)
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await upsertOverride({
        practitioner_id: practitionerId,
        override_date:   fd.get('override_date') as string,
        is_unavailable:  isUnavailable,
        start_time:      isUnavailable ? null : ((fd.get('start_time') as string) || null),
        end_time:        isUnavailable ? null : ((fd.get('end_time')   as string) || null),
        reason:          (fd.get('reason') as string) || undefined,
      })
      if (res.success) {
        toast.success('Override added')
        handleClose()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-sm flex flex-col gap-0 p-0" showCloseButton={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">Add date override</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" type="button" />} onClick={handleClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input name="override_date" type="date" required />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <span className="text-sm">Mark as unavailable all day</span>
            <Switch checked={isUnavailable} onCheckedChange={setIsUnavailable} />
          </div>

          {!isUnavailable && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start time *</Label>
                <Input name="start_time" type="time" required />
              </div>
              <div className="space-y-1.5">
                <Label>End time *</Label>
                <Input name="end_time" type="time" required />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input name="reason" placeholder="e.g. Training day" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose render={<Button variant="outline" type="button" onClick={handleClose} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Add override'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
