import { getSupabaseServiceClient } from '@/lib/supabase/server'
import PractitionerShifts from '@/components/admin/shifts/PractitionerShifts'
import type { ShiftRow, ShiftOverrideRow, TimeOffRow } from '@/lib/database.types'

interface Props {
  searchParams: Promise<{ pid?: string }>
}

export default async function ShiftsPage({ searchParams }: Props) {
  const { pid } = await searchParams
  const db = getSupabaseServiceClient()

  const { data: practitioners } = await db
    .from('users')
    .select('id, full_name, role')
    .in('role', ['practitioner', 'owner'])
    .eq('is_active', true)
    .order('full_name')

  let shifts:    ShiftRow[]         = []
  let timeOff:   TimeOffRow[]       = []
  let overrides: ShiftOverrideRow[] = []

  if (pid) {
    const [shiftsRes, timeOffRes, overridesRes] = await Promise.all([
      db.from('shifts')
        .select('*')
        .eq('practitioner_id', pid)
        .order('day_of_week')
        .order('effective_from'),
      db.from('time_off')
        .select('*')
        .eq('practitioner_id', pid)
        .order('start_date', { ascending: false }),
      db.from('shift_overrides')
        .select('*')
        .eq('practitioner_id', pid)
        .order('override_date', { ascending: false }),
    ])
    shifts    = shiftsRes.data    ?? []
    timeOff   = timeOffRes.data   ?? []
    overrides = overridesRes.data ?? []
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Shifts</h2>
        <p className="text-sm text-muted-foreground">
          Manage recurring schedules, time off, and date-specific overrides.
        </p>
      </div>
      <PractitionerShifts
        practitioners={practitioners ?? []}
        selectedPid={pid ?? null}
        shifts={shifts}
        timeOff={timeOff}
        overrides={overrides}
      />
    </div>
  )
}
