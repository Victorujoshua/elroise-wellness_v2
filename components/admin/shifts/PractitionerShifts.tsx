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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium shrink-0">Practitioner</span>
        <Select value={selectedPid ?? ''} onValueChange={handleSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a practitioner…" />
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
        <div className="rounded-lg border border-dashed border-[#2D2926]/20 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Select a practitioner above to manage their schedule.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                  tab === t.id
                    ? 'border-[#2D2926] text-[#2D2926]'
                    : 'border-transparent text-muted-foreground hover:text-[#2D2926]',
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
