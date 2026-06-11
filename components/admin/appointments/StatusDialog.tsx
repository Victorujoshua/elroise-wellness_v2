'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { updateAppointmentStatus } from '@/app/(admin)/admin/(dashboard)/appointments/actions'
import type { AppointmentRow } from '@/lib/database.types'

type Status = AppointmentRow['status']

const STATUS_LABEL: Record<Status, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show:   'No Show',
}

const STATUSES: Status[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']

interface Props {
  appointmentId: string
  currentStatus: Status
  open:          boolean
  onClose:       () => void
  onUpdated:     (newStatus: Status) => void
}

export default function StatusDialog({
  appointmentId, currentStatus, open, onClose, onUpdated,
}: Props) {
  const [selected, setSelected] = useState<Status>(currentStatus)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    if (selected === currentStatus) { onClose(); return }
    startTransition(async () => {
      const res = await updateAppointmentStatus(appointmentId, selected)
      if (!res.success) { toast.error(res.error); return }
      toast.success(`Status → ${STATUS_LABEL[selected]}`)
      onUpdated(selected)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selected === s
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              {STATUS_LABEL[s]}
              {s === currentStatus && (
                <span className="ml-2 text-xs opacity-60">(current)</span>
              )}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={pending || selected === currentStatus}>
            {pending && <Loader2 className="size-3 mr-1.5 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
