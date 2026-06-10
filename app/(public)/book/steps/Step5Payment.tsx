'use client'

import { useState, useTransition } from 'react'
import { createAppointment } from '../actions'
import type { BookingService, ClientDetails } from '../BookingFlow'

const fmt = (n: number) => new Intl.NumberFormat('en-NG').format(n)

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-charcoal/6 last:border-0">
      <p className="text-[9px] uppercase tracking-widest text-charcoal/40 font-semibold shrink-0 mr-4">
        {label}
      </p>
      <p className="text-sm font-light text-charcoal text-right">{value}</p>
    </div>
  )
}

export default function Step5Payment({
  service,
  date,
  practitioner,
  slot,
  clientDetails,
  pricingTier,
  onBack,
  onConfirmed,
}: {
  service: BookingService
  date: string
  practitioner: { id: string; name: string }
  slot: string
  clientDetails: ClientDetails
  pricingTier: 'single' | 'package'
  onBack: () => void
  onConfirmed: (appointmentId: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [payError, setPayError] = useState<string | null>(null)

  const amount =
    pricingTier === 'package' && service.package_price_naira != null
      ? service.package_price_naira
      : service.single_price_naira

  const [slotH, slotM] = slot.split(':').map(Number)
  const endMin = slotH * 60 + slotM + service.duration_minutes
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  function handlePay() {
    if (!window.PaystackPop) {
      setPayError('Payment system not ready. Please refresh and try again.')
      return
    }

    setPayError(null)
    const ref = `booking_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: clientDetails.email,
      amount: amount * 100,
      currency: 'NGN',
      ref,
      onSuccess(txn) {
        startTransition(async () => {
          const result = await createAppointment({
            service_id:         service.id,
            service_name:       service.name,
            appointment_date:   date,
            start_time:         slot,
            end_time:           endTime,
            practitioner_id:    practitioner.id,
            pricing_tier:       pricingTier,
            amount_naira:       amount,
            paystack_reference: txn.reference,
            client:             clientDetails,
          })
          if (result.success) {
            onConfirmed(result.appointmentId)
          } else {
            setPayError(result.error)
          }
        })
      },
      onCancel() {},
    })
    handler.openIframe()
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">Step 5 of 5</p>
        <h1 className="text-3xl md:text-4xl font-light text-charcoal mb-1">
          Confirm &amp; <span className="serif italic text-gold">pay</span>
        </h1>
        <p className="text-sm text-charcoal/50 font-light">
          Review your booking before proceeding to payment.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-charcoal/8 p-6 mb-5">
        <Row label="Service" value={service.name} />
        <Row label="Date" value={formatDate(date)} />
        <Row label="Time" value={`${slot} — ${endTime}`} />
        <Row label="Practitioner" value={practitioner.name} />
        <Row
          label="Pricing"
          value={
            pricingTier === 'package' && service.package_session_count
              ? `Package · ${service.package_session_count} sessions`
              : 'Single session'
          }
        />
        <Row label="Name" value={clientDetails.full_name} />
        <Row label="Email" value={clientDetails.email} />
        <Row label="Phone" value={clientDetails.phone} />
        {clientDetails.notes && <Row label="Notes" value={clientDetails.notes} />}
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-charcoal/8 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-charcoal/40 font-semibold">Total</p>
            <p className="text-3xl font-light serif italic text-charcoal mt-0.5">₦{fmt(amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-charcoal/30 font-light">Secured by</p>
            <p className="text-[10px] uppercase tracking-widest text-charcoal/50 font-semibold">Paystack</p>
          </div>
        </div>

        {payError && (
          <p className="text-sm text-red-400 font-light mb-4 text-center">{payError}</p>
        )}

        <button
          onClick={handlePay}
          disabled={isPending}
          className="w-full py-5 bg-gold text-white text-[10px] uppercase tracking-[0.4em] font-bold rounded-lg hover:bg-charcoal transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Processing…' : `Pay ₦${fmt(amount)}`}
        </button>
        <p className="text-[9px] text-charcoal/30 text-center mt-4 font-light">
          Your card is never stored. Secured by Paystack.
        </p>
      </div>

      <button
        onClick={onBack}
        disabled={isPending}
        className="mt-8 text-[9px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors font-semibold disabled:opacity-30"
      >
        ← Back
      </button>
    </div>
  )
}
