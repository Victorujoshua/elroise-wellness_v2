'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { BookingService, ClientDetails } from '../BookingFlow'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const fmt = (n: number) => new Intl.NumberFormat('en-NG').format(n)

const inputClass =
  'w-full border border-charcoal/15 rounded-lg px-4 py-3 text-sm font-light text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-gold transition-colors bg-white'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-[0.4em] text-charcoal/50 font-semibold mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-400 mt-1.5 font-light">{error}</p>}
    </div>
  )
}

export default function Step4Details({
  service,
  initialTier,
  initialDetails,
  onSubmit,
  onBack,
}: {
  service: BookingService
  initialTier: 'single' | 'package'
  initialDetails: ClientDetails | null
  onSubmit: (details: ClientDetails, pricingTier: 'single' | 'package') => void
  onBack: () => void
}) {
  const tier = initialTier
  const amount = service.single_price_naira

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialDetails
      ? {
          full_name: initialDetails.full_name,
          email: initialDetails.email,
          phone: initialDetails.phone,
          notes: initialDetails.notes,
        }
      : undefined,
  })

  function onValid(values: FormValues) {
    onSubmit(
      {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        notes: values.notes ?? '',
      },
      tier,
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">Step 4 of 5</p>
        <h1 className="text-3xl md:text-4xl font-light text-charcoal mb-1">
          Your <span className="serif italic text-gold">details</span>
        </h1>
        <p className="text-sm text-charcoal/50 font-light">
          We'll use this to confirm your booking.
        </p>
      </div>

      <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">

        {/* Contact fields */}
        <div className="bg-white rounded-2xl border border-charcoal/8 p-6 space-y-5">
          <Field label="Full Name" error={errors.full_name?.message}>
            <input
              {...register('full_name')}
              placeholder="Your full name"
              className={inputClass}
            />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="your@email.com"
              className={inputClass}
            />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+234 000 000 0000"
              className={inputClass}
            />
          </Field>
          <Field label="Notes (optional)">
            <textarea
              {...register('notes')}
              placeholder="Any notes for your practitioner…"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        {/* Total + CTA */}
        <div className="bg-white rounded-2xl border border-charcoal/8 p-6 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-charcoal/40 font-semibold">Total</p>
            <p className="text-2xl font-light serif italic text-charcoal mt-0.5">₦{fmt(amount)}</p>
          </div>
          <button
            type="submit"
            className="bg-charcoal text-white px-8 py-4 text-[9px] uppercase tracking-[0.4em] font-bold hover:bg-gold transition-all duration-500 rounded-lg"
          >
            Continue →
          </button>
        </div>
      </form>

      <button
        onClick={onBack}
        className="mt-6 text-[9px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors font-semibold"
      >
        ← Back
      </button>
    </div>
  )
}
