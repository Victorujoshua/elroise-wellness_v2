'use client'

import { useMemo, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import AppointmentCard from './AppointmentCard'
import type { CalendarAppointment, Practitioner } from './CalendarView'

// ── Grid constants ────────────────────────────────────────────────────────────

const GRID_START  = 7 * 60    // 07:00 in minutes
const GRID_END    = 21 * 60   // 21:00 in minutes
const SLOT_MIN    = 30
const SLOT_H      = 64        // px per 30-min slot
const COL_W       = 220       // px per practitioner column
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

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function calcTop(startTime: string): number {
  return ((timeToMin(startTime) - GRID_START) / SLOT_MIN) * SLOT_H
}

function calcHeight(startTime: string, endTime: string): number {
  const mins = timeToMin(endTime) - timeToMin(startTime)
  return Math.max((mins / SLOT_MIN) * SLOT_H, SLOT_H / 2)
}

function fmtHour(h: number): { label: string; ampm: string } {
  return {
    label: String(h % 12 || 12),
    ampm:  h >= 12 ? 'PM' : 'AM',
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  practitioners: Practitioner[]
  appointments:  CalendarAppointment[]
}

export default function DayGrid({ practitioners, appointments }: Props) {
  const [nowMin, setNowMin] = useState<number>(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setNowMin(d.getHours() * 60 + d.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const nowTop = nowMin >= GRID_START && nowMin <= GRID_END
    ? ((nowMin - GRID_START) / SLOT_MIN) * SLOT_H
    : null

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
      <div className="border border-dashed border-[#2D2926]/20 py-16 text-center bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No active practitioners — add team members first.
        </p>
      </div>
    )
  }

  return (
    <div
      className="overflow-auto border border-border bg-card"
      style={{ maxHeight: 'calc(100vh - 10.5rem)' }}
    >
      <div style={{ minWidth: `${64 + practitioners.length * COL_W}px` }}>
        {/* Sticky practitioner header */}
        <div className="sticky top-0 z-20 flex bg-card/95 backdrop-blur-sm border-b">
          <div className="w-16 shrink-0" />
          {practitioners.map(p => (
            <div
              key={p.id}
              style={{ width: COL_W }}
              className="shrink-0 border-l px-3 py-3 flex items-center gap-3"
            >
              <div className="size-8 rounded-full bg-[#C5A059]/12 border border-[#C5A059]/30 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#C5A059]">{getInitials(p.full_name)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground/80 truncate leading-tight">
                  {p.full_name}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 leading-tight mt-0.5">
                  Practitioner
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="flex" style={{ height: TOTAL_H }}>
          {/* Time axis */}
          <div className="w-16 shrink-0 relative select-none border-r border-border/40">
            {HOUR_LABELS.map(h => {
              const { label, ampm } = fmtHour(h)
              const isCurrent = nowTop !== null && Math.floor(nowMin / 60) === h
              return (
                <div
                  key={h}
                  className="absolute right-0 pr-2.5 flex flex-col items-end"
                  style={{ top: ((h * 60 - GRID_START) / SLOT_MIN) * SLOT_H - 12 }}
                >
                  <span className={cn(
                    'text-[12px] font-semibold leading-none tabular-nums',
                    isCurrent ? 'text-rose-500' : 'text-foreground/40',
                  )}>
                    {label}
                  </span>
                  <span className={cn(
                    'text-[8px] leading-none uppercase tracking-wide mt-0.5',
                    isCurrent ? 'text-rose-400' : 'text-muted-foreground/35',
                  )}>
                    {ampm}
                  </span>
                </div>
              )
            })}
          </div>

          {/* One column per practitioner */}
          {practitioners.map(p => (
            <div
              key={p.id}
              style={{ width: COL_W }}
              className="shrink-0 border-l relative"
            >
              {/* Alternating hour shading */}
              {HOUR_LABELS.slice(0, -1).map((h, i) =>
                i % 2 === 1 ? (
                  <div
                    key={`shade-${h}`}
                    className="absolute inset-x-0 bg-muted/20 pointer-events-none"
                    style={{
                      top:    ((h * 60 - GRID_START) / SLOT_MIN) * SLOT_H,
                      height: SLOT_H * 2,
                    }}
                  />
                ) : null,
              )}

              {/* Hour lines (solid) */}
              {HOUR_LABELS.map(h => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-border/60"
                  style={{ top: ((h * 60 - GRID_START) / SLOT_MIN) * SLOT_H }}
                />
              ))}

              {/* 30-min sub-lines (dashed) */}
              {Array.from({ length: TOTAL_SLOTS }, (_, i) =>
                i % 2 === 1 ? (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-t border-border/20 border-dashed"
                    style={{ top: i * SLOT_H }}
                  />
                ) : null,
              )}

              {/* Current time indicator */}
              {nowTop !== null && (
                <div
                  className="absolute inset-x-0 z-10 pointer-events-none flex items-center"
                  style={{ top: nowTop }}
                >
                  <div className="size-2.5 rounded-full bg-rose-500 -ml-1.5 shrink-0 ring-2 ring-rose-200" />
                  <div className="flex-1 h-[2px] bg-rose-500/70" />
                </div>
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
