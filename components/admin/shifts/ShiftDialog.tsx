'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
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
import { upsertShift } from '@/app/(admin)/admin/(dashboard)/shifts/actions'
import type { ShiftRow } from '@/lib/database.types'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sliceTime(t: string) {
  return t.slice(0, 5) // "09:00:00" → "09:00"
}

const schema = z.object({
  start_time:      z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  end_time:        z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  effective_from:  z.string().min(1, 'Required'),
  effective_until: z.string().optional(),
}).refine(d => d.start_time < d.end_time, {
  message: 'End time must be after start',
  path: ['end_time'],
})

type FormData = z.infer<typeof schema>

interface Props {
  open:           boolean
  dow:            number
  shift:          ShiftRow | null
  practitionerId: string
  onClose:        () => void
}

export default function ShiftDialog({ open, dow, shift, practitionerId, onClose }: Props) {
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset({
        start_time:      shift ? sliceTime(shift.start_time) : '09:00',
        end_time:        shift ? sliceTime(shift.end_time)   : '17:00',
        effective_from:  shift ? shift.effective_from        : todayISO(),
        effective_until: shift?.effective_until              ?? '',
      })
    }
  }, [open, shift, reset])

  async function onSubmit(data: FormData) {
    const result = await upsertShift({
      id:              shift?.id,
      practitioner_id: practitionerId,
      day_of_week:     dow,
      start_time:      data.start_time,
      end_time:        data.end_time,
      effective_from:  data.effective_from,
      effective_until: data.effective_until || null,
    })
    if (result.success) {
      toast.success(shift ? 'Shift updated' : 'Shift added')
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm flex flex-col gap-0 p-0" showCloseButton={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            {shift ? 'Edit' : 'Add'} shift — {DAY_NAMES[dow]}
          </DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" type="button" />} onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start time *</Label>
              <Input type="time" {...register('start_time')} />
              {errors.start_time && (
                <p className="text-xs text-destructive">{errors.start_time.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>End time *</Label>
              <Input type="time" {...register('end_time')} />
              {errors.end_time && (
                <p className="text-xs text-destructive">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Effective from *</Label>
              <Input type="date" {...register('effective_from')} />
              {errors.effective_from && (
                <p className="text-xs text-destructive">{errors.effective_from.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Effective until</Label>
              <Input type="date" {...register('effective_until')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose render={<Button variant="outline" type="button" onClick={onClose} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : shift ? 'Save changes' : 'Add shift'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
