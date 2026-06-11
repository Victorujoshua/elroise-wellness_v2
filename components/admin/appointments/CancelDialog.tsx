'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cancelAppointment } from '@/app/(admin)/admin/(dashboard)/appointments/actions'

const schema = z.object({
  reason: z.string().min(1, 'Reason is required').min(10, 'Please provide at least 10 characters'),
})
type FormData = z.infer<typeof schema>

interface Props {
  appointmentId: string
  clientName:    string
  open:          boolean
  onClose:       () => void
  onCancelled:   () => void
}

export default function CancelDialog({
  appointmentId, clientName, open, onClose, onCancelled,
}: Props) {
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function handleClose() { reset(); onClose() }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await cancelAppointment(appointmentId, data.reason)
      if (!res.success) { toast.error(res.error); return }
      toast.success('Appointment cancelled')
      reset()
      onCancelled()
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel appointment</DialogTitle>
          <DialogDescription>
            Cancelling <strong>{clientName}</strong>'s appointment. No refund will be processed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register('reason')}
              rows={3}
              placeholder="Why is this appointment being cancelled?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.reason && (
              <p className="text-xs text-destructive mt-1">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
              Back
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="size-3 mr-1.5 animate-spin" />}
              Cancel appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
