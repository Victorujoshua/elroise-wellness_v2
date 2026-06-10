'use client'

import { useMemo } from 'react'
import AppointmentCard from './AppointmentCard'
import type { CalendarAppointment, Practitioner } from './CalendarView'

// ── Grid constants ────────────────────────────────────────────────────────────

const GRID_START  = 7 * 60    // 07:00 in minutes
const GRID_END    = 21 * 60   // 21:00 in minutes
const SLOT_MIN    = 30
const SLOT_H      = 64        // px per 30-min slot
const TOTAL_SLOTS = (GRID_END - GRID_START) / SLOT_MIN   // 28
const TOTAL_H     = TOTAL_SLOTS * SLOT_H                  // 1792

// Hour labels: 7, 8, ... 21
const HOUR_LABELS = Array.from(
  { length: (GRID_END - GRID_START) / 60 + 1 },
  (_, i) => GRID_START / 60 + i,
)

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function calcTop(startTime: string): number {
  return ((timeToMin(startTime) - GRID_START) / SLOT_MIN) * SLOT_H
}

function calcHeight(startTime: string, endTime: string): number {
  const mins = timeToMin(endTime) - timeToMin(startTime)
  return Math.max((mins / SLOT_MIN) * SLOT_H, SLOT_H / 2)
}

function fmtHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}${ampm}`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  practitioners: Practitioner[]
  appointments:  CalendarAppointment[]
}

export default function DayGrid({ practitioners, appointments }: Props) {
  const byPractitioner = useMemo(() => {
    const map: Record<string, CalendarAppointment[]> = {}
    for (const appt of appointments) {
      const pid = appt.users?.id ?? '__unknown__'
      map[pid] ??= []
      map[pid].push(appt)
    }
    return map
  }, [appointments])

  if (practitioners.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-charcoal/20 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No active practitioners — add team members first.
        </p>
      </div>
    )
  }

  const colWidth = 192 // px, min-w-48

  return (
    <div
      className="overflow-auto rounded-lg border bg-background"
      style={{ maxHeight: 'calc(100vh - 16rem)' }}
    >
      <div style={{ minWidth: `${56 + practitioners.length * colWidth}px` }}>
        {/* Sticky practitioner header */}
        <div className="sticky top-0 z-20 flex bg-background border-b shadow-sm">
          <div className="w-14 shrink-0" />
          {practitioners.map(p => (
            <div
              key={p.id}
              style={{ width: colWidth }}
              className="shrink-0 border-l px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate"
            >
              {p.full_name}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="flex" style={{ height: TOTAL_H }}>
          {/* Time axis */}
          <div className="w-14 shrink-0 relative select-none">
            {HOUR_LABELS.map(h => (
              <span
                key={h}
                className="absolute right-2 text-[10px] leading-none text-muted-foreground -translate-y-2"
                style={{ top: ((h * 60 - GRID_START) / SLOT_MIN) * SLOT_H }}
              >
                {fmtHour(h)}
              </span>
            ))}
          </div>

          {/* One column per practitioner */}
          {practitioners.map(p => (
            <div
              key={p.id}
              style={{ width: colWidth }}
              className="shrink-0 border-l relative"
            >
              {/* Hour lines (solid) */}
              {HOUR_LABELS.map(h => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-border"
                  style={{ top: ((h * 60 - GRID_START) / SLOT_MIN) * SLOT_H }}
                />
              ))}

              {/* 30-min sub-lines (dashed) */}
              {Array.from({ length: TOTAL_SLOTS }, (_, i) =>
                i % 2 === 1 ? (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-t border-border/30 border-dashed"
                    style={{ top: i * SLOT_H }}
                  />
                ) : null,
              )}

              {/* Appointment cards */}
              {(byPractitioner[p.id] ?? []).map(appt => {
                const top    = calcTop(appt.start_time)
                const height = calcHeight(appt.start_time, appt.end_time)
                if (top < 0 || top >= TOTAL_H) return null
                return (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    top={top}
                    height={height}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
