'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { type DayButton } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { getAppointmentDensity } from '@/app/(admin)/admin/(dashboard)/actions'
import { cn } from '@/lib/utils'

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function MiniCalendar() {
  const router = useRouter()
  const [month, setMonth] = useState(new Date())
  const [density, setDensity] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    getAppointmentDensity(month.getFullYear(), month.getMonth() + 1)
      .then((data) => { if (!cancelled) setDensity(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [month])

  return (
    <Calendar
      month={month}
      onMonthChange={setMonth}
      className="w-full [--cell-size:--spacing(6)]"
      classNames={{
        caption_label: 'text-[11px] font-medium',
        weekday: 'text-[10px]',
        week: 'mt-1',
      }}
      components={{
        DayButton: (props: React.ComponentProps<typeof DayButton>) => {
          const { day, modifiers } = props
          const dateKey = toDateKey(day.date)
          const count = density[dateKey] ?? 0

          return (
            <button
              onClick={() => router.push(`/admin/calendar?date=${dateKey}`)}
              className={cn(
                'flex flex-col items-center justify-center size-full aspect-square rounded-md transition-colors',
                modifiers.today && !modifiers.selected && 'bg-muted font-semibold',
                modifiers.selected && 'bg-charcoal text-white',
                modifiers.outside && 'opacity-30',
                !modifiers.selected && !modifiers.today && 'hover:bg-muted',
              )}
            >
              <span className="text-[10px] leading-none">{day.date.getDate()}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'mt-0.5 size-1 rounded-full',
                    count >= 8 ? 'bg-gold' : count >= 4 ? 'bg-gold/60' : 'bg-gold/30',
                  )}
                />
              )}
            </button>
          )
        },
      }}
    />
  )
}
