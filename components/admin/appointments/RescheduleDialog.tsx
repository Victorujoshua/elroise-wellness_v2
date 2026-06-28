'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/app/(public)/book/steps/Step2Date'
import { getAvailability } from '@/app/(public)/book/actions'
import { rescheduleAppointment } from '@/app/(admin)/admin/(dashboard)/appointments/actions'
import type { PractitionerSlots } from '@/lib/availability'

interface Props {
  appointmentId: string
  serviceId:     string
  clientName:    string
  open:          boolean
  onClose:       () => void
  onRescheduled: () => void
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RescheduleDialog({
  appointmentId, serviceId, clientName, open, onClose, onRescheduled,
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
        date, start_time: selSlot, practitioner_id: selPractitioner.id,
      })
      if (!res.success) { toast.error(res.error); return }
      toast.success('Appointment rescheduled')
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
              ? `Pick a new date for ${clientName}'s appointment`
              : `Choose a slot on ${fmtDate(date!)}`}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: date picker ── */}
        {step === 'date' && (
          <div className="py-2">
            <Calendar
              selectedDate={date}
              onSelect={handleDateSelect}
              disabled={loadingSlots}
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

        {/* ── Step 2: admin slot grid ── */}
        {step === 'slot' && (
          <div className="py-2 space-y-3 max-h-72 overflow-y-auto pr-1">
            {availability.every(p => p.slots.length === 0) ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No availability on this date.{' '}
                <button className="text-primary underline underline-offset-2" onClick={() => setStep('date')}>
                  Choose another date
                </button>
              </p>
            ) : (
              availability.map(p => p.slots.length === 0 ? null : (
                <div key={p.practitioner_id} className="border bg-background p-3">
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
