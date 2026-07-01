'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import WeekGrid from './WeekGrid'
import TimeOffPanel from './TimeOffPanel'
import OverridePanel from './OverridePanel'
import type { ShiftRow, ShiftOverrideRow, TimeOffRow } from '@/lib/database.types'

type Practitioner = { id: string; full_name: string; role: string }

const TABS = [
  { id: 'schedule',  label: 'Weekly Schedule' },
  { id: 'timeoff',   label: 'Time Off' },
  { id: 'overrides', label: 'Date Overrides' },
] as const
type TabId = (typeof TABS)[number]['id']

interface Props {
  practitioners: Practitioner[]
  selectedPid:   string | null
  shifts:        ShiftRow[]
  timeOff:       TimeOffRow[]
  overrides:     ShiftOverrideRow[]
}

export default function PractitionerShifts({
  practitioners,
  selectedPid,
  shifts,
  timeOff,
  overrides,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [tab, setTab] = useState<TabId>('schedule')

  function handleSelect(pid: string | null) {
    if (!pid) return
    setTab('schedule')
    router.push(`${pathname}?pid=${pid}`)
  }

  return (
    <div className="space-y-5">
      {/* Practitioner selector — card toolbar */}
      <div className="flex items-center gap-3 bg-card border border-border px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
          Practitioner
        </span>
        <Select value={selectedPid ?? ''} onValueChange={handleSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a practitioner…">
              {practitioners.find(p => p.id === selectedPid)?.full_name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {practitioners.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPid ? (
        <div className="border border-dashed border-[#2D2926]/15 bg-muted/20 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Select a practitioner above to manage their schedule.
          </p>
        </div>
      ) : (
        <>
          {/* Pill-style tab switcher */}
          <div className="flex gap-1 bg-muted/50 p-1 w-fit">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer',
                  tab === t.id
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'schedule' && (
            <WeekGrid practitionerId={selectedPid} shifts={shifts} />
          )}
          {tab === 'timeoff' && (
            <TimeOffPanel practitionerId={selectedPid} timeOff={timeOff} />
          )}
          {tab === 'overrides' && (
            <OverridePanel practitionerId={selectedPid} overrides={overrides} />
          )}
        </>
      )}
    </div>
  )
}
