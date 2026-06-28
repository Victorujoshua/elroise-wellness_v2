'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ShiftDialog from './ShiftDialog'
import { toggleShift, deleteShift } from '@/app/(admin)/admin/(dashboard)/shifts/actions'
import type { ShiftRow } from '@/lib/database.types'

const DAYS = [
  { label: 'Monday',    dow: 1 },
  { label: 'Tuesday',   dow: 2 },
  { label: 'Wednesday', dow: 3 },
  { label: 'Thursday',  dow: 4 },
  { label: 'Friday',    dow: 5 },
  { label: 'Saturday',  dow: 6 },
  { label: 'Sunday',    dow: 0 },
]

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

interface Props {
  practitionerId: string
  shifts:         ShiftRow[]
}

type DialogState = { open: boolean; dow: number; shift: ShiftRow | null }

export default function WeekGrid({ practitionerId, shifts }: Props) {
  const [dialog, setDialog] = useState<DialogState>({ open: false, dow: 1, shift: null })

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS.map(({ label, dow }) => (
          <DayCard
            key={dow}
            label={label}
            dayShifts={shifts.filter(s => s.day_of_week === dow)}
            onAdd={() => setDialog({ open: true, dow, shift: null })}
            onEdit={s => setDialog({ open: true, dow: s.day_of_week, shift: s })}
          />
        ))}
      </div>

      <ShiftDialog
        open={dialog.open}
        dow={dialog.dow}
        shift={dialog.shift}
        practitionerId={practitionerId}
        onClose={() => setDialog(d => ({ ...d, open: false }))}
      />
    </>
  )
}

function DayCard({
  label,
  dayShifts,
  onAdd,
  onEdit,
}: {
  label:     string
  dayShifts: ShiftRow[]
  onAdd:     () => void
  onEdit:    (s: ShiftRow) => void
}) {
  const activeCount = dayShifts.filter(s => s.is_active).length

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-3 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          {activeCount > 0 && (
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
              {activeCount} active
            </span>
          )}
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onAdd} title="Add shift" className="size-7 rounded-lg">
          <Plus className="size-3.5" />
        </Button>
      </div>
      {dayShifts.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">No shifts</p>
      ) : (
        <ul className="space-y-2">
          {dayShifts.map(s => (
            <ShiftItem key={s.id} shift={s} onEdit={onEdit} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ShiftItem({ shift, onEdit }: { shift: ShiftRow; onEdit: (s: ShiftRow) => void }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const res = await toggleShift(shift.id, checked)
      if (!res.success) toast.error(res.error)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteShift(shift.id)
      if (!res.success) toast.error(res.error)
      else toast.success('Shift deleted')
    })
  }

  return (
    <li className={cn(
      'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-all duration-150',
      shift.is_active
        ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
        : 'bg-muted/30 border-border text-muted-foreground opacity-60',
    )}>
      <Switch
        checked={shift.is_active}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold tabular-nums">
          {fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}
        </p>
        {shift.effective_until && (
          <p className="text-[10px] mt-0.5 opacity-70 truncate">until {shift.effective_until}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onEdit(shift)}
          disabled={isPending}
          className="size-6"
        >
          <Pencil className="size-3" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={isPending}
          className="size-6 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </li>
  )
}
