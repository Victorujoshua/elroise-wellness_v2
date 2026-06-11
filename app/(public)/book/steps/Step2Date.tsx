'use client'

import { useState } from 'react'
import type { BookingService } from '../BookingFlow'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function Calendar({
  selectedDate,
  onSelect,
  disabled,
  maxDays = 90,
}: {
  selectedDate: string | null
  onSelect: (date: string) => void
  disabled: boolean
  maxDays?: number
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + maxDays)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const canGoPrev =
    new Date(viewYear, viewMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoNext = new Date(viewYear, viewMonth + 2, 0) <= maxDate

  function prevMonth() {
    if (!canGoPrev) return
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (!canGoNext) return
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startDow = new Date(viewYear, viewMonth, 1).getDay()
  const cells: (number | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-white rounded-2xl border border-charcoal/8 p-6 w-full max-w-sm">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full text-lg text-charcoal hover:bg-sand/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        <p className="text-sm font-light text-charcoal tracking-wide">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          onClick={nextMonth}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-full text-lg text-charcoal hover:bg-sand/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DOW.map(d => (
          <div
            key={d}
            className="text-center text-[9px] uppercase tracking-widest text-charcoal/30 font-semibold py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const d = new Date(viewYear, viewMonth, day)
          d.setHours(0, 0, 0, 0)
          const dateStr = toDateStr(d)
          const isPast = d < today
          const isBeyond = d > maxDate
          const isToday = d.getTime() === today.getTime()
          const isSelected = dateStr === selectedDate
          const isOff = isPast || isBeyond || disabled

          return (
            <button
              key={day}
              onClick={() => !isOff && onSelect(dateStr)}
              disabled={isOff}
              className={`relative h-9 w-full rounded-lg text-sm font-light transition-all duration-200 ${
                isSelected
                  ? 'bg-gold text-white font-medium'
                  : isToday
                  ? 'border border-gold text-charcoal hover:bg-gold/10'
                  : isOff
                  ? 'text-charcoal/20 cursor-not-allowed'
                  : 'text-charcoal hover:bg-sand/60'
              }`}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Step2Date({
  service,
  selectedDate,
  loading,
  error,
  onDateSelect,
  onBack,
}: {
  service: BookingService
  selectedDate: string | null
  loading: boolean
  error: string | null
  onDateSelect: (date: string) => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">Step 2 of 5</p>
        <h1 className="text-3xl md:text-4xl font-light text-charcoal mb-1">
          Pick a <span className="serif italic text-gold">date</span>
        </h1>
        <p className="text-sm text-charcoal/50 font-light">
          Booking{' '}
          <span className="text-charcoal font-normal">{service.name}</span>
          {' '}· {service.duration_minutes} min
        </p>
      </div>

      <Calendar selectedDate={selectedDate} onSelect={onDateSelect} disabled={loading} />

      {loading && (
        <p className="mt-5 text-sm text-charcoal/40 font-light animate-pulse">
          Checking availability…
        </p>
      )}
      {error && !loading && (
        <p className="mt-5 text-sm text-red-400 font-light">{error}</p>
      )}

      <button
        onClick={onBack}
        className="mt-10 text-[9px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors font-semibold"
      >
        ← Back
      </button>
    </div>
  )
}
