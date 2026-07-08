'use client'

import { useReducer, useTransition } from 'react'
import Link from 'next/link'
import type { PractitionerSlots } from '@/lib/availability'
import { getAvailability } from './actions'
import { trackEvent } from '@/lib/analytics'
import Step1Service from './steps/Step1Service'
import Step2Date from './steps/Step2Date'
import Step3Slot from './steps/Step3Slot'
import Step4Details from './steps/Step4Details'
import Step5Payment from './steps/Step5Payment'

export type BookingService = {
  id: string
  slug: string
  name: string
  category: 'pilates' | 'laser' | 'other'
  duration_minutes: number
  single_price_naira: number
  package_price_naira: number | null
  package_session_count: number | null
}

export type ClientDetails = {
  full_name: string
  email: string
  phone: string
  notes: string
}

type BookingState = {
  step: 1 | 2 | 3 | 4 | 5
  service: BookingService | null
  date: string | null
  availabilityLoading: boolean
  availabilityError: string | null
  availability: PractitionerSlots[]
  practitioner: { id: string; name: string } | null
  slot: string | null
  clientDetails: ClientDetails | null
  pricingTier: 'single' | 'package'
  confirmed: boolean
  appointmentId: string | null
}

type BookingAction =
  | { type: 'SELECT_SERVICE'; service: BookingService }
  | { type: 'SELECT_DATE'; date: string }
  | { type: 'AVAILABILITY_OK'; data: PractitionerSlots[] }
  | { type: 'AVAILABILITY_ERROR'; error: string }
  | { type: 'SELECT_SLOT'; practitioner: { id: string; name: string }; slot: string }
  | { type: 'SUBMIT_DETAILS'; details: ClientDetails; pricingTier: 'single' | 'package' }
  | { type: 'BACK' }
  | { type: 'CONFIRMED'; appointmentId: string }

function getInitialState(initialService: BookingService | null): BookingState {
  return {
    step: initialService ? 2 : 1,
    service: initialService,
    date: null,
    availabilityLoading: false,
    availabilityError: null,
    availability: [],
    practitioner: null,
    slot: null,
    clientDetails: null,
    pricingTier: 'single',
    confirmed: false,
    appointmentId: null,
  }
}

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SELECT_SERVICE':
      return {
        ...state, step: 2, service: action.service,
        date: null, availability: [], practitioner: null, slot: null,
      }
    case 'SELECT_DATE':
      return {
        ...state, date: action.date,
        availabilityLoading: true, availabilityError: null,
        availability: [], practitioner: null, slot: null,
      }
    case 'AVAILABILITY_OK':
      return { ...state, step: 3, availabilityLoading: false, availability: action.data }
    case 'AVAILABILITY_ERROR':
      return { ...state, availabilityLoading: false, availabilityError: action.error }
    case 'SELECT_SLOT':
      return { ...state, step: 4, practitioner: action.practitioner, slot: action.slot }
    case 'SUBMIT_DETAILS':
      return { ...state, step: 5, clientDetails: action.details, pricingTier: action.pricingTier }
    case 'BACK':
      switch (state.step) {
        case 2: return { ...state, step: 1 }
        case 3: return { ...state, step: 2, availability: [], availabilityLoading: false, availabilityError: null }
        case 4: return { ...state, step: 3, practitioner: null, slot: null }
        case 5: return { ...state, step: 4 }
        default: return state
      }
    case 'CONFIRMED':
      return { ...state, confirmed: true, appointmentId: action.appointmentId }
    default:
      return state
  }
}

// ── Confirmation panel ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function ConfirmationPanel({
  appointmentId,
  service,
  date,
  slot,
  endTime,
  practitioner,
  clientDetails,
  pricingTier,
}: {
  appointmentId: string
  service: BookingService
  date: string
  slot: string
  endTime: string
  practitioner: { id: string; name: string }
  clientDetails: ClientDetails
  pricingTier: 'single' | 'package'
}) {
  const ref = appointmentId.slice(0, 8).toUpperCase()

  return (
    <div className="max-w-xl mx-auto text-center">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#636B2F]/10 mb-8">
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-[#636B2F]">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7.5 12.5l3 3 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <p className="text-[9px] uppercase tracking-[0.5em] text-[#636B2F] font-semibold mb-3">
        Booking confirmed
      </p>
      <h1 className="text-3xl md:text-4xl font-light text-[#2D2926] mb-2">
        See you <span className="font-sora text-[#636B2F]">soon</span>
      </h1>
      <p className="text-sm font-light text-[#2D2926]/50 mb-10">
        A confirmation will be sent to{' '}
        <span className="text-[#2D2926]">{clientDetails.email}</span>
      </p>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-[#2D2926]/8 p-6 text-left mb-8">
        {[
          { label: 'Reference', value: ref, mono: true },
          { label: 'Service',   value: service.name },
          { label: 'Date',      value: formatDate(date) },
          { label: 'Time',      value: `${slot} — ${endTime}` },
          { label: 'With',      value: practitioner.name },
          {
            label: 'Type',
            value:
              pricingTier === 'package' && service.package_session_count
                ? `Package · ${service.package_session_count} sessions`
                : 'Single session',
          },
        ].map(({ label, value, mono }, i, arr) => (
          <div
            key={label}
            className={`flex items-start justify-between py-3 ${i < arr.length - 1 ? 'border-b border-[#2D2926]/6' : ''}`}
          >
            <p className="text-[9px] uppercase tracking-widest text-[#2D2926]/40 font-semibold shrink-0 mr-4">
              {label}
            </p>
            <p className={`text-sm text-[#2D2926] text-right ${mono ? 'font-mono' : 'font-light'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/my-bookings?email=${encodeURIComponent(clientDetails.email)}`}
          className="text-[9px] uppercase tracking-[0.4em] font-bold text-white bg-[#636B2F] px-8 py-4 rounded-lg hover:bg-[#2D2926] transition-all duration-500"
        >
          View my bookings
        </Link>
        <Link
          href="/book"
          className="text-[9px] uppercase tracking-widest font-semibold text-[#2D2926]/40 hover:text-[#2D2926] transition-colors"
        >
          Book another appointment
        </Link>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

const STEP_LABELS = ['Service', 'Date', 'Slot', 'Details', 'Payment']

export default function BookingFlow({
  services,
  initialService,
}: {
  services: BookingService[]
  initialService: BookingService | null
}) {
  const [state, dispatch] = useReducer(reducer, getInitialState(initialService))
  const [, startTransition] = useTransition()

  function handleDateSelect(date: string) {
    dispatch({ type: 'SELECT_DATE', date })
    startTransition(async () => {
      const result = await getAvailability(state.service!.id, date)
      if (result.success) {
        dispatch({ type: 'AVAILABILITY_OK', data: result.data })
      } else {
        dispatch({ type: 'AVAILABILITY_ERROR', error: result.error })
      }
    })
  }

  // Pre-compute endTime so the confirmation panel doesn't need to recalculate
  const endTime = state.slot
    ? (() => {
        const [h, m] = state.slot.split(':').map(Number)
        const endMin = h * 60 + m + (state.service?.duration_minutes ?? 0)
        return `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
      })()
    : ''

  if (
    state.confirmed &&
    state.appointmentId &&
    state.service &&
    state.date &&
    state.slot &&
    state.practitioner &&
    state.clientDetails
  ) {
    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <ConfirmationPanel
            appointmentId={state.appointmentId}
            service={state.service}
            date={state.date}
            slot={state.slot}
            endTime={endTime}
            practitioner={state.practitioner}
            clientDetails={state.clientDetails}
            pricingTier={state.pricingTier}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      {/* Progress bar */}
      <div className="border-b border-[#2D2926]/10 bg-[#F9F6F2]/95 backdrop-blur-sm sticky top-[72px] z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3 | 4 | 5
            const active = n === state.step
            const done = n < state.step
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                    done    ? 'bg-[#636B2F] text-white'
                    : active ? 'bg-[#2D2926] text-white'
                            : 'bg-[#2D2926]/10 text-[#2D2926]/30'
                  }`}>
                    {done ? '✓' : n}
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-semibold hidden sm:block transition-colors ${
                    active ? 'text-[#2D2926]' : done ? 'text-[#636B2F]' : 'text-[#2D2926]/30'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-all duration-300 ${done ? 'bg-[#636B2F]' : 'bg-[#2D2926]/10'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {state.step === 1 && (
          <Step1Service
            services={services}
            onSelect={service => {
              trackEvent('booking_form_started', {
                service_name: service.name,
                service_id: service.id,
              })
              dispatch({ type: 'SELECT_SERVICE', service })
            }}
          />
        )}
        {state.step === 2 && state.service && (
          <Step2Date
            service={state.service}
            selectedDate={state.date}
            loading={state.availabilityLoading}
            error={state.availabilityError}
            onDateSelect={handleDateSelect}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        )}
        {state.step === 3 && state.service && state.date && (
          <Step3Slot
            service={state.service}
            date={state.date}
            availability={state.availability}
            onSelect={(practitioner, slot) =>
              dispatch({ type: 'SELECT_SLOT', practitioner, slot })
            }
            onBack={() => dispatch({ type: 'BACK' })}
          />
        )}
        {state.step === 4 && state.service && (
          <Step4Details
            service={state.service}
            initialTier={state.pricingTier}
            initialDetails={state.clientDetails}
            onSubmit={(details, pricingTier) =>
              dispatch({ type: 'SUBMIT_DETAILS', details, pricingTier })
            }
            onBack={() => dispatch({ type: 'BACK' })}
          />
        )}
        {state.step === 5 &&
          state.service &&
          state.date &&
          state.practitioner &&
          state.slot &&
          state.clientDetails && (
            <Step5Payment
              service={state.service}
              date={state.date}
              practitioner={state.practitioner}
              slot={state.slot}
              clientDetails={state.clientDetails}
              pricingTier={state.pricingTier}
              onBack={() => dispatch({ type: 'BACK' })}
              onConfirmed={appointmentId => dispatch({ type: 'CONFIRMED', appointmentId })}
            />
          )}
      </div>
    </div>
  )
}
