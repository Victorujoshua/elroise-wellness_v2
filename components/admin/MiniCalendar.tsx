'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAppointmentDensity } from '@/app/(admin)/admin/(dashboard)/actions'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildCells(year: number, month: number): { date: Date; outside: boolean }[] {
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const cells: { date: Date; outside: boolean }[] = []

  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), outside: true })

  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), outside: false })

  let t = 1
  while (cells.length % 7 !== 0)
    cells.push({ date: new Date(year, month + 1, t++), outside: true })

  return cells
}

export default function MiniCalendar() {
  const router = useRouter()
  const [month, setMonth]       = useState(new Date())
  const [selected, setSelected] = useState(() => toDateKey(new Date()))
  const [density, setDensity]   = useState<Record<string, number>>({})

  const year     = month.getFullYear()
  const monthIdx = month.getMonth()

  useEffect(() => {
    let cancelled = false
    getAppointmentDensity(year, monthIdx + 1)
      .then(data => { if (!cancelled) setDensity(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [year, monthIdx])

  const today = toDateKey(new Date())
  const cells = buildCells(year, monthIdx)
  const label = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-3 text-muted-foreground" />
        </button>
        <span className="text-[11px] font-medium text-foreground">{label}</span>
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="size-3 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {/* Weekday headers */}
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className="flex items-center justify-center h-6 text-[9px] font-medium text-muted-foreground tracking-wider"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map(({ date, outside }) => {
          const key        = toDateKey(date)
          const isSelected = key === selected
          const isToday    = key === today
          const count      = outside ? 0 : (density[key] ?? 0)

          return (
            <button
              key={key}
              onClick={() => {
                setSelected(key)
                router.push(`/admin/calendar?date=${key}`)
              }}
              className={cn(
                'w-full aspect-square flex items-center justify-center',
                'rounded-full text-[10px] font-light transition-colors',
                // Outside days — faded, no fill
                outside && 'text-foreground/30',
                // Density fills (in-month, not selected)
                !outside && !isSelected && count >= 1 && count <= 3 && 'bg-charcoal/15',
                !outside && !isSelected && count >= 4              && 'bg-charcoal/40',
                // Today ring when not selected
                isToday && !isSelected && 'ring-1 ring-charcoal/30',
                // Selected — highest priority
                isSelected && 'bg-charcoal text-white',
                // Hover for non-selected in-month days
                !isSelected && !outside && 'hover:bg-muted',
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
