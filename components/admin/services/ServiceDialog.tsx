'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { serviceSchema, slugify } from './serviceSchema'
import type { ServiceFormData } from './serviceSchema'
import { saveService } from '@/app/(admin)/admin/(dashboard)/services/actions'
import type { ServiceWithPractitioners, PractitionerOption } from '@/app/(admin)/admin/(dashboard)/services/actions'

function getDefaults(service: ServiceWithPractitioners | null): ServiceFormData {
  if (!service) {
    return {
      name: '',
      slug: '',
      category: 'pilates',
      description: '',
      duration_minutes: 60,
      single_price_naira: 0,
      has_package: false,
      package_price_naira: null,
      package_session_count: null,
      color_hex: '#636B2F',
      is_active: true,
      sort_order: 0,
      practitioner_ids: [],
    }
  }
  return {
    name: service.name,
    slug: service.slug,
    category: service.category,
    description: service.description ?? '',
    duration_minutes: service.duration_minutes,
    single_price_naira: service.single_price_naira,
    has_package: service.package_price_naira != null,
    package_price_naira: service.package_price_naira,
    package_session_count: service.package_session_count,
    color_hex: service.color_hex ?? '#636B2F',
    is_active: service.is_active,
    sort_order: service.sort_order,
    practitioner_ids: service.practitioner_ids,
  }
}

interface Props {
  open: boolean
  onClose: () => void
  service: ServiceWithPractitioners | null
  practitioners: PractitionerOption[]
}

export default function ServiceDialog({ open, onClose, service, practitioners }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: getDefaults(service),
  })

  // Reset form when service changes (dialog re-opens with different service)
  useEffect(() => {
    reset(getDefaults(service))
    setSlugTouched(false)
    setServerError(null)
  }, [service, reset])

  // Auto-generate slug from name when creating
  const nameValue = watch('name')
  useEffect(() => {
    if (!service && !slugTouched) {
      setValue('slug', slugify(nameValue), { shouldValidate: false })
    }
  }, [nameValue, service, slugTouched, setValue])

  const hasPackage = watch('has_package')

  function onSubmit(data: ServiceFormData) {
    // Extra guard for package fields
    if (data.has_package) {
      if (data.package_price_naira == null) {
        setError('package_price_naira', { message: 'Required' })
        return
      }
      if (!data.package_session_count || data.package_session_count < 2) {
        setError('package_session_count', { message: 'At least 2 sessions' })
        return
      }
    }

    setServerError(null)
    startTransition(async () => {
      const result = await saveService(service?.id ?? null, data)
      if (result.success) {
        toast.success(service ? 'Service updated' : 'Service created')
        onClose()
        router.refresh()
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent
        className="sm:max-w-2xl flex flex-col gap-0 p-0 max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            {service ? 'Edit service' : 'Add service'}
          </DialogTitle>
          <DialogClose
            render={<Button variant="ghost" size="icon-sm" type="button" />}
            onClick={onClose}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Scrollable form body */}
        <form
          id="service-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
        >
          {/* Row 1: Name + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Name *</Label>
              <Input id="svc-name" {...register('name')} placeholder="e.g. Full Body Laser" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-slug">Slug *</Label>
              <Input
                id="svc-slug"
                {...register('slug', {
                  onChange: () => setSlugTouched(true),
                })}
                placeholder="full-body-laser"
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Category + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={val => field.onChange(val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pilates">Pilates</SelectItem>
                      <SelectItem value="laser">Laser</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">Duration (minutes) *</Label>
              <Input
                id="svc-duration"
                type="number"
                min={1}
                {...register('duration_minutes', { valueAsNumber: true })}
              />
              {errors.duration_minutes && (
                <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          {/* Row 3: Single Price + Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Single price (₦) *</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                {...register('single_price_naira', { valueAsNumber: true })}
              />
              {errors.single_price_naira && (
                <p className="text-xs text-destructive">{errors.single_price_naira.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-sort">Sort order</Label>
              <Input
                id="svc-sort"
                type="number"
                min={0}
                {...register('sort_order', { valueAsNumber: true })}
              />
              {errors.sort_order && (
                <p className="text-xs text-destructive">{errors.sort_order.message}</p>
              )}
            </div>
          </div>

          {/* Row 4: Colour + Is Active */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-color">Colour</Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="color_hex"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="svc-color"
                      type="color"
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      className="size-8 rounded border border-input cursor-pointer p-0.5"
                    />
                  )}
                />
                <Input
                  {...register('color_hex')}
                  placeholder="#636B2F"
                  className="font-mono text-xs"
                />
              </div>
              {errors.color_hex && (
                <p className="text-xs text-destructive">{errors.color_hex.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Active</Label>
              <div className="flex items-center gap-2.5 h-8">
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
                  {watch('is_active') ? 'Visible on site' : 'Hidden from site'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">Description</Label>
            <Textarea
              id="svc-desc"
              rows={3}
              {...register('description')}
              placeholder="Short description for the public services page…"
            />
          </div>

          {/* Package toggle */}
          <div className="border border-border p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Controller
                name="has_package"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={checked => {
                      field.onChange(checked)
                      if (!checked) {
                        setValue('package_price_naira', null)
                        setValue('package_session_count', null)
                      }
                    }}
                  />
                )}
              />
              <div>
                <p className="text-sm font-medium">Package pricing</p>
                <p className="text-xs text-muted-foreground">
                  Allow clients to buy a bundle of sessions at a discounted rate
                </p>
              </div>
            </div>

            {hasPackage && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="svc-pkg-price">Package price (₦) *</Label>
                  <Controller
                    name="package_price_naira"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="svc-pkg-price"
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={e =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    )}
                  />
                  {errors.package_price_naira && (
                    <p className="text-xs text-destructive">
                      {errors.package_price_naira.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="svc-pkg-sessions">Sessions in package *</Label>
                  <Controller
                    name="package_session_count"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="svc-pkg-sessions"
                        type="number"
                        min={2}
                        value={field.value ?? ''}
                        onChange={e =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    )}
                  />
                  {errors.package_session_count && (
                    <p className="text-xs text-destructive">
                      {errors.package_session_count.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Practitioners */}
          <div className="space-y-1.5">
            <Label>Practitioners</Label>
            <Controller
              name="practitioner_ids"
              control={control}
              render={({ field }) => (
                <div
                  className={cn(
                    'rounded-lg border border-input p-3 space-y-2',
                    practitioners.length > 4 && 'max-h-36 overflow-y-auto',
                  )}
                >
                  {practitioners.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No practitioners added yet. Add team members via the Team page.
                    </p>
                  ) : (
                    practitioners.map(p => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 rounded accent-charcoal"
                          checked={field.value.includes(p.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              field.onChange([...field.value, p.id])
                            } else {
                              field.onChange(field.value.filter((id: string) => id !== p.id))
                            }
                          }}
                        />
                        <span className="text-sm group-hover:text-foreground transition-colors">
                          {p.full_name}
                          <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                            ({p.role})
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t">
          <div className="flex-1">
            {serverError && (
              <p className="text-xs text-destructive">{serverError}</p>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose
              render={<Button variant="outline" type="button" onClick={onClose} />}
            >
              Cancel
            </DialogClose>
            <Button type="submit" form="service-form" disabled={isPending}>
              {isPending ? 'Saving…' : service ? 'Save changes' : 'Create service'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
