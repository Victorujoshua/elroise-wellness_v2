'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { editTeamMember } from '@/app/(admin)/admin/(dashboard)/team/actions'
import type { MemberWithServices, ServiceOption } from '@/app/(admin)/admin/(dashboard)/team/actions'

const schema = z.object({
  full_name:   z.string().min(2, 'Required'),
  role:        z.enum(['owner', 'staff', 'practitioner']),
  is_active:   z.boolean(),
  service_ids: z.array(z.string()),
})
type FormData = z.infer<typeof schema>

function getDefaults(member: MemberWithServices): FormData {
  return {
    full_name:   member.full_name,
    role:        member.role,
    is_active:   member.is_active,
    service_ids: member.service_ids,
  }
}

interface Props {
  open: boolean
  onClose: () => void
  member: MemberWithServices | null
  services: ServiceOption[]
}

export default function EditMemberDialog({ open, onClose, member, services }: Props) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register, control, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: member ? getDefaults(member) : { full_name: '', role: 'practitioner', is_active: true, service_ids: [] },
  })

  useEffect(() => {
    if (member) reset(getDefaults(member))
    setServerError(null)
  }, [member, reset])

  const roleValue    = watch('role')
  const isActiveValue = watch('is_active')
  const showServices = roleValue === 'practitioner' || roleValue === 'owner'

  function onSubmit(data: FormData) {
    if (!member) return
    setServerError(null)
    startTransition(async () => {
      const result = await editTeamMember(member.id, data)
      if (result.success) {
        toast.success('Member updated')
        onClose()
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent
        className="sm:max-w-lg flex flex-col gap-0 p-0 max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">Edit member</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" type="button" />} onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Body */}
        <form
          id="edit-member-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="em-name">Full name *</Label>
            <Input id="em-name" {...register('full_name')} />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={val => field.onChange(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practitioner">Practitioner</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Access</Label>
              <div className="flex items-center gap-2.5 h-9">
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={checked => field.onChange(checked)}
                    />
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {isActiveValue ? 'Can log in' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {showServices && (
            <div className="space-y-1.5">
              <Label>Services offered</Label>
              <Controller
                name="service_ids"
                control={control}
                render={({ field }) => (
                  <div className={cn(
                    'rounded-lg border border-input p-3 space-y-2',
                    services.length > 5 && 'max-h-40 overflow-y-auto',
                  )}>
                    {services.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No active services yet.
                      </p>
                    ) : (
                      services.map(s => (
                        <label key={s.id} className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="size-3.5 rounded accent-charcoal"
                            checked={field.value.includes(s.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                field.onChange([...field.value, s.id])
                              } else {
                                field.onChange(field.value.filter((id: string) => id !== s.id))
                              }
                            }}
                          />
                          <span className="text-sm group-hover:text-foreground transition-colors">
                            {s.name}
                            <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                              ({s.category})
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t">
          <div className="flex-1">
            {serverError && <p className="text-xs text-destructive">{serverError}</p>}
          </div>
          <div className="flex gap-2">
            <DialogClose render={<Button variant="outline" type="button" onClick={onClose} />}>
              Cancel
            </DialogClose>
            <Button type="submit" form="edit-member-form" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
