'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/cart'
import { verifyAndCreateShopOrder } from '@/app/(public)/shop/actions'

declare global {
  interface Window {
    PaystackPop: {
      setup(config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        onSuccess(txn: { reference: string }): void
        onCancel(): void
      }): { openIframe(): void }
    }
  }
}

const schema = z.object({
  full_name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:         z.string().email('Please enter a valid email'),
  phone:         z.string().min(7, 'Please enter a valid phone number'),
  address_line1: z.string().min(3, 'Please enter a street address'),
  city:          z.string().min(1, 'Please enter a city'),
  state:         z.string().min(1, 'Please enter a state'),
})

type FormValues = z.infer<typeof schema>

const inputClass =
  'w-full border border-charcoal/15 rounded-lg px-4 py-3 text-sm font-light text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-gold transition-colors bg-white'

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[9px] uppercase tracking-[0.4em] text-charcoal/50 font-semibold mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-400 mt-1.5 font-light">{error}</p>}
    </div>
  )
}

export default function CheckoutModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const items    = useCartStore(s => s.items)
  const clearCart = useCartStore(s => s.clearCart)
  const total    = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const totalKobo = total * 100

  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onValid(values: FormValues) {
    if (!window.PaystackPop) {
      toast.error('Payment system not ready. Please refresh and try again.')
      return
    }

    const ref = `shop_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: values.email,
      amount: totalKobo,
      currency: 'NGN',
      ref,
      onSuccess(txn) {
        startTransition(async () => {
          const result = await verifyAndCreateShopOrder(items, values, txn.reference)
          if (result.success) {
            clearCart()
            onClose()
            toast.success('Order confirmed! Check your email for details.')
          } else {
            toast.error(result.error)
          }
        })
      },
      onCancel() {
        // User closed Paystack popup — no action needed
      },
    })
    handler.openIframe()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-bg w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-charcoal/10 shrink-0">
          <div>
            <h2 className="text-lg font-light text-charcoal">
              Shipping <span className="italic serif text-gold">Details</span>
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-charcoal/40 mt-0.5">
              Total: ₦{total.toLocaleString('en-NG')}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            aria-label="Close checkout"
            className="text-charcoal/40 hover:text-charcoal text-2xl font-light leading-none transition-colors disabled:opacity-30"
          >
            ×
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          <form id="checkout-form" onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="co-full-name" label="Full Name" error={errors.full_name?.message}>
                <input
                  id="co-full-name"
                  {...register('full_name')}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </Field>
              <Field id="co-phone" label="Phone" error={errors.phone?.message}>
                <input
                  id="co-phone"
                  {...register('phone')}
                  type="tel"
                  placeholder="+234 000 000 0000"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field id="co-email" label="Email" error={errors.email?.message}>
              <input
                id="co-email"
                {...register('email')}
                type="email"
                placeholder="your@email.com"
                className={inputClass}
              />
            </Field>

            <Field id="co-address" label="Street Address" error={errors.address_line1?.message}>
              <input
                id="co-address"
                {...register('address_line1')}
                placeholder="15 Ademola Adetokunbo, Victoria Island"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field id="co-city" label="City" error={errors.city?.message}>
                <input
                  id="co-city"
                  {...register('city')}
                  placeholder="Lagos"
                  className={inputClass}
                />
              </Field>
              <Field id="co-state" label="State" error={errors.state?.message}>
                <input
                  id="co-state"
                  {...register('state')}
                  placeholder="Lagos State"
                  className={inputClass}
                />
              </Field>
            </div>
          </form>
        </div>

        {/* Footer CTA */}
        <div className="px-8 py-5 border-t border-charcoal/10 shrink-0">
          <button
            type="submit"
            form="checkout-form"
            disabled={isPending}
            className="w-full py-4 bg-gold text-white text-[10px] uppercase tracking-[0.4em] font-bold rounded-lg hover:bg-charcoal transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Processing…' : `Pay ₦${total.toLocaleString('en-NG')} via Paystack`}
          </button>
          <p className="text-[9px] text-charcoal/30 text-center mt-3 font-light">
            Secured by Paystack · Lagos delivery (V1)
          </p>
        </div>
      </div>
    </div>
  )
}
