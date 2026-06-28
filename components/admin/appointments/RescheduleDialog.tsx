'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/app/(public)/book/steps/Step2Date'
import { getAvailability } from '@/app/(public)/book/actions'
import { rescheduleAppointment } from '@/app/(admin)/admin/(dashboard)/appointments/actions'
import type { PractitionerSlots } from '@/lib/availability'

interface Props {
  appointmentId:   string
  serviceId:       string
  durationMinutes: number
  clientName:      string
  open:            boolean
  onClose:         () => void
  onRescheduled:   () => void
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function RescheduleDialog({
  appointmentId, serviceId, durationMinutes, clientName, open, onClose, onRescheduled,
}: Props) {
  const [step, setStep]                       = useState<'date' | 'slot'>('date')
  const [date, setDate]                       = useState<string | null>(null)
  const [availability, setAvailability]       = useState<PractitionerSlots[]>([])
  const [loadingSlots, setLoadingSlots]       = useState(false)
  const [slotsError, setSlotsError]           = useState<string | null>(null)
  const [selPractitioner, setSelPractitioner] = useState<{ id: string; name: string } | null>(null)
  const [selSlot, setSelSlot]                 = useState<string | null>(null)
  const [pending, startTransition]            = useTransition()

  function reset() {
    setStep('date'); setDate(null); setAvailability([])
    setSlotsError(null); setSelPractitioner(null); setSelSlot(null)
  }

  function handleDateSelect(d: string) {
    setDate(d); setLoadingSlots(true); setSlotsError(null); setAvailability([])
    startTransition(async () => {
      const res = await getAvailability(serviceId, d)
      setLoadingSlots(false)
      if (res.success) { setAvailability(res.data); setStep('slot') }
      else setSlotsError(res.error)
    })
  }

  function handleConfirm() {
    if (!date || !selPractitioner || !selSlot) return
    startTransition(async () => {
      const res = await rescheduleAppointment(appointmentId, {
        date,
        start_time:      selSlot,
        end_time:        addMinutes(selSlot, durationMinutes),
        practitioner_id: selPractitioner.id,
      })
      if (!res.success) { toast.error(res.error); return }
      toast.success('Appointment rescheduled — client notified')
      reset(); onRescheduled(); onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            {step === 'date'
              ? `Pick a new date and time for ${clientName}'s appointment`
              : `Choose a slot on ${fmtDate(date!)}`}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: date picker ── */}
        {step === 'date' && (
          <div className="py-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
              Date
            </Label>
            <Calendar
              selectedDate={date}
              onSelect={handleDateSelect}
              disabled={loadingSlots || pending}
              maxDays={180}
            />
            {loadingSlots && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Checking availability…
              </p>
            )}
            {slotsError && <p className="mt-3 text-sm text-destructive">{slotsError}</p>}
          </div>
        )}

        {/* ── Step 2: slot grid ── */}
        {step === 'slot' && (
          <div className="py-2 space-y-3 max-h-72 overflow-y-auto pr-1">
            {availability.every(p => p.slots.length === 0) ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No availability on this date.{' '}
                <button
                  className="text-primary underline underline-offset-2"
                  onClick={() => setStep('date')}
                >
                  Choose another date
                </button>
              </p>
            ) : (
              availability.map(p => p.slots.length === 0 ? null : (
                <div key={p.practitioner_id} className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {p.practitioner_name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.slots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => {
                          setSelSlot(slot)
                          setSelPractitioner({ id: p.practitioner_id, name: p.practitioner_name })
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                          selSlot === slot && selPractitioner?.id === p.practitioner_id
                            ? 'bg-primary text-primary-foreground border-primary font-medium'
                            : 'border-input hover:border-ring hover:bg-muted'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'slot' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelSlot(null); setSelPractitioner(null); setStep('date') }}
            >
              ← Change date
            </Button>
          )}
          <Button variant="outline" onClick={() => { reset(); onClose() }}>Dismiss</Button>
          {step === 'slot' && (
            <Button onClick={handleConfirm} disabled={!selSlot || pending}>
              {pending && <Loader2 className="size-3 mr-1.5 animate-spin" />}
              Confirm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
