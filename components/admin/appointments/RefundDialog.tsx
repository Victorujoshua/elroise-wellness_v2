'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { processRefund } from '@/app/(admin)/admin/(dashboard)/appointments/actions'

interface Props {
  appointmentId:      string
  clientName:         string
  originalAmountKobo: number
  open:               boolean
  onClose:            () => void
  onRefunded:         () => void
}

export default function RefundDialog({
  appointmentId, clientName, originalAmountKobo, open, onClose, onRefunded,
}: Props) {
  const [pending, startTransition] = useTransition()
  const fullNaira = Math.floor(originalAmountKobo / 100)

  const schema = z.object({
    amount_naira: z
      .number({ message: 'Enter a valid amount' })
      .int('Must be a whole number')
      .positive('Must be greater than ₦0')
      .max(fullNaira, `Maximum refund is ₦${fullNaira.toLocaleString()}`),
  })
  type FormData = { amount_naira: number }

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount_naira: fullNaira },
  })

  useEffect(() => {
    if (open) reset({ amount_naira: fullNaira })
  }, [open, fullNaira]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await processRefund(appointmentId, data.amount_naira * 100)
      if (!res.success) { toast.error(res.error); return }
      toast.success('Refund submitted to Paystack')
      reset(); onRefunded(); onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process refund</DialogTitle>
          <DialogDescription>
            Issuing a refund for <strong>{clientName}</strong>'s appointment.
            This will cancel the appointment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex gap-2 text-sm text-amber-800">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>Refunds are processed via Paystack and cannot be reversed once submitted.</span>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Refund amount (₦)</label>
            <div className="flex items-center gap-2">
              <input
                {...register('amount_naira', { valueAsNumber: true })}
                type="number"
                min={1}
                max={fullNaira}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('amount_naira', fullNaira, { shouldValidate: true })}
              >
                Full (₦{fullNaira.toLocaleString()})
              </Button>
            </div>
            {errors.amount_naira && (
              <p className="text-xs text-destructive mt-1">{errors.amount_naira.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="size-3 mr-1.5 animate-spin" />}
              Submit refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
