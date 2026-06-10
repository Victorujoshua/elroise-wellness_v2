'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DayGrid from './DayGrid'
import AddBookingSheet from './AddBookingSheet'
import type { ServiceOption } from './AddBookingSheet'

// ── Shared types ─────────────────────────────────────────────────────────────

export type CalendarAppointment = {
  id:           string
  start_time:   string
  end_time:     string
  status:       'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes:        string | null
  pricing_tier: string
  source:       string
  clients:      { full_name: string; email: string; phone: string } | null
  services:     { name: string; color_hex: string | null } | null
  users:        { id: string; full_name: string } | null
}

export type Practitioner = { id: string; full_name: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const next = new Date(y, mo - 1, d + days)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  date:          string
  practitioners: Practitioner[]
  appointments:  CalendarAppointment[]
  services:      ServiceOption[]
}

export default function CalendarView({ date, practitioners, appointments, services }: Props) {
  const router      = useRouter()
  const isToday     = date === todayISO()
  const [sheetOpen, setSheetOpen] = useState(false)

  function go(days: number) {
    router.push(`/admin/calendar?date=${addDays(date, days)}`)
  }

  const activeCount = appointments.filter(a => a.status !== 'cancelled').length

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Date navigation */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => go(-1)} aria-label="Previous day">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => go(1)} aria-label="Next day">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <h2 className="text-base font-semibold">{formatDate(date)}</h2>

        {!isToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/calendar?date=${todayISO()}`)}
          >
            Today
          </Button>
        )}

        <span className="text-xs text-muted-foreground">
          {activeCount} appointment{activeCount !== 1 ? 's' : ''}
        </span>

        <Button size="sm" className="ml-auto" onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-1" />
          Add booking
        </Button>
      </div>

      {/* Day grid */}
      <DayGrid practitioners={practitioners} appointments={appointments} />

      <AddBookingSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        defaultDate={date}
        services={services}
      />
    </div>
  )
}
