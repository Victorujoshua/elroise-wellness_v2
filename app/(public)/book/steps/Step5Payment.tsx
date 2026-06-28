'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createAppointment } from '../actions'
import type { BookingService, ClientDetails } from '../BookingFlow'
import { trackEvent } from '@/lib/analytics'

const fmt = (n: number) => new Intl.NumberFormat('en-NG').format(n)

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-[#2D2926]/6 last:border-0">
      <p className="text-[9px] uppercase tracking-widest text-[#2D2926]/40 font-semibold shrink-0 mr-4">
        {label}
      </p>
      <p className="text-sm font-light text-[#2D2926] text-right">{value}</p>
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
  const [paystackReady, setPaystackReady] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (window.PaystackPop) { setPaystackReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => setPaystackReady(true)
    formRef.current?.appendChild(script)
  }, [])

  const amount =
    pricingTier === 'package' && service.package_price_naira != null
      ? service.package_price_naira
      : service.single_price_naira

  const [slotH, slotM] = slot.split(':').map(Number)
  const endMin = slotH * 60 + slotM + service.duration_minutes
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  function handlePay() {
    console.log('[STEP5] handlePay called')

    if (!window.PaystackPop) {
      setPayError('Payment system not ready. Please refresh and try again.')
      return
    }

    setPayError(null)
    const ref = `booking_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    trackEvent('booking_payment_initiated', {
      service_name: service.name,
      amount_ngn: amount,
      pricing_tier: pricingTier,
    })

    // Guard against double-invoke if both callback (v1) and onSuccess (v2) fire
    let called = false
    function handleSuccess(txn: { reference: string }) {
      if (called) return
      called = true
      console.log('[STEP5] handleSuccess called with:', txn)
      console.log('[STEP5] About to call startTransition')
      startTransition(async () => {
        console.log('[STEP5] Inside transition, about to call createAppointment')
        console.log('[STEP5] Calling createAppointment with:', {
          service_id:         service.id,
          appointment_date:   date,
          start_time:         slot,
          paystack_reference: txn.reference,
          client:             clientDetails,
        })
        try {
          const result = await createAppointment({
            service_id:         service.id,
            service_name:       service.name,
            practitioner_name:  practitioner.name,
            appointment_date:   date,
            start_time:         slot,
            end_time:           endTime,
            practitioner_id:    practitioner.id,
            pricing_tier:       pricingTier,
            amount_naira:       amount,
            paystack_reference: txn.reference,
            client:             clientDetails,
          })
          console.log('[STEP5] createAppointment returned:', result)
          if (result.success) {
            trackEvent('booking_payment_completed', {
              service_name: service.name,
              amount_ngn: amount,
              pricing_tier: pricingTier,
              appointment_id: result.appointmentId,
            })
            onConfirmed(result.appointmentId)
          } else {
            setPayError(result.error)
          }
        } catch (err) {
          console.error('[STEP5] === EXCEPTION in createAppointment call ===', err)
          setPayError('An unexpected error occurred. Please contact us if you were charged.')
        }
      })
    }

    console.log('[STEP5] About to call PaystackPop.setup', { ref, amount })
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: clientDetails.email,
      amount: amount * 100,
      currency: 'NGN',
      ref,
      callback(response) {                 // v1 inline.js success prop
        console.log('[STEP5] callback FIRED', response)
        handleSuccess(response)
      },
      onSuccess(response) {                // v2 forward-compat
        console.log('[STEP5] onSuccess FIRED', response)
        handleSuccess(response)
      },
      onClose() {                          // v1 inline.js close prop
        console.log('[STEP5] onClose fired')
      },
      onCancel() {                         // v2 forward-compat
        console.log('[STEP5] onCancel fired')
      },
    })
    console.log('[STEP5] PaystackPop.setup returned handler:', handler)
    console.log('[STEP5] Opening Paystack iframe')
    handler.openIframe()
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] uppercase tracking-[0.5em] text-[#636B2F] font-semibold mb-3">Step 5 of 5</p>
        <h1 className="text-3xl md:text-4xl font-light text-[#2D2926] mb-1">
          Confirm &amp; <span className="font-sora text-[#636B2F]">pay</span>
        </h1>
        <p className="text-sm text-[#2D2926]/50 font-light">
          Review your booking before proceeding to payment.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-[#2D2926]/8 p-6 mb-5">
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
      <form ref={formRef} onSubmit={e => { e.preventDefault(); handlePay() }}>
        <div className="bg-white border border-[#2D2926]/8 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#2D2926]/40 font-semibold">Total</p>
              <p className="text-3xl font-light font-sora text-[#2D2926] mt-0.5">₦{fmt(amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-[#2D2926]/30 font-light">Secured by</p>
              <p className="text-[10px] uppercase tracking-widest text-[#2D2926]/50 font-semibold">Paystack</p>
            </div>
          </div>

          {payError && (
            <p className="text-sm text-red-400 font-light mb-4 text-center">{payError}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !paystackReady}
            className="w-full py-5 bg-[#636B2F] text-white text-[10px] uppercase tracking-[0.4em] font-bold rounded-lg hover:bg-[#2D2926] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!paystackReady ? 'Loading payment…' : isPending ? 'Processing…' : `Pay ₦${fmt(amount)}`}
          </button>
          <p className="text-[9px] text-[#2D2926]/30 text-center mt-4 font-light">
            Your card is never stored. Secured by Paystack.
          </p>
        </div>
      </form>

      <button
        onClick={onBack}
        disabled={isPending}
        className="mt-8 text-[9px] uppercase tracking-widest text-[#2D2926]/40 hover:text-[#2D2926] transition-colors font-semibold disabled:opacity-30"
      >
        ← Back
      </button>
    </div>
  )
}
