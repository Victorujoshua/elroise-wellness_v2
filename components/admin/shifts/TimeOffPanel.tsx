'use client'

import { useState, useTransition } from 'react'
import { CalendarOff, Plus, Trash2, X } from 'lucide-react'
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
import { addTimeOff, deleteTimeOff } from '@/app/(admin)/admin/(dashboard)/shifts/actions'
import type { TimeOffRow } from '@/lib/database.types'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface Props {
  practitionerId: string
  timeOff:        TimeOffRow[]
}

export default function TimeOffPanel({ practitionerId, timeOff }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Time off blocks all availability for the specified date range.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5 mr-1.5" />
          Add time off
        </Button>
      </div>

      {timeOff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2926]/15 bg-muted/20 py-10 text-center">
          <p className="text-sm text-muted-foreground">No time off recorded.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {timeOff.map(row => (
            <TimeOffItem key={row.id} row={row} />
          ))}
        </ul>
      )}

      <AddTimeOffDialog
        open={dialogOpen}
        practitionerId={practitionerId}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}

function TimeOffItem({ row }: { row: TimeOffRow }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTimeOff(row.id)
      if (!res.success) toast.error(res.error)
      else toast.success('Time off removed')
    })
  }

  return (
    <li className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors duration-150 group">
      <div className="size-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
        <CalendarOff className="size-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {row.start_date === row.end_date
            ? fmtDate(row.start_date)
            : `${fmtDate(row.start_date)} – ${fmtDate(row.end_date)}`}
        </p>
        {row.reason && (
          <p className="text-xs text-muted-foreground mt-0.5">{row.reason}</p>
        )}
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  )
}

function AddTimeOffDialog({
  open,
  practitionerId,
  onClose,
}: {
  open:           boolean
  practitionerId: string
  onClose:        () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await addTimeOff({
        practitioner_id: practitionerId,
        start_date:      fd.get('start_date') as string,
        end_date:        fd.get('end_date') as string,
        reason:          (fd.get('reason') as string) || undefined,
      })
      if (res.success) {
        toast.success('Time off added')
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
          <DialogTitle className="text-base font-semibold">Add time off</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" type="button" />} onClick={handleClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start date *</Label>
              <Input name="start_date" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label>End date *</Label>
              <Input name="end_date" type="date" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input name="reason" placeholder="e.g. Annual leave" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose render={<Button variant="outline" type="button" onClick={handleClose} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Add time off'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
