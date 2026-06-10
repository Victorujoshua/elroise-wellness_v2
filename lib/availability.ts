import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const SLOT_INTERVAL_MINUTES = 30
const BUFFER_HOURS = 2

export type Slot = string // 'HH:MM'

export type PractitionerSlots = {
  practitioner_id: string
  practitioner_name: string
  slots: Slot[]
}

export type GetAvailableSlotsParams = {
  serviceId: string
  date: string // 'YYYY-MM-DD'
}

// Service role client — required because practitioner_services and
// appointments have no anon SELECT policy.
function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generateCandidates(
  startMin: number,
  endMin: number,
  durationMin: number,
): number[] {
  const slots: number[] = []
  let cur = startMin
  while (cur + durationMin <= endMin) {
    slots.push(cur)
    cur += SLOT_INTERVAL_MINUTES
  }
  return slots
}

function currentMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getAvailableSlots({
  serviceId,
  date,
}: GetAvailableSlotsParams): Promise<PractitionerSlots[]> {
  // Past-date guard
  if (date < todayString()) return []

  const supabase = createServiceClient()

  // ── 1. Service ────────────────────────────────────────────────
  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('id, duration_minutes')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (svcErr || !service) return []

  // ── 2. Eligible practitioners ─────────────────────────────────
  const { data: links } = await supabase
    .from('practitioner_services')
    .select('practitioner_id')
    .eq('service_id', serviceId)

  const practitionerIds = (links ?? []).map(l => l.practitioner_id)
  if (practitionerIds.length === 0) return []

  const { data: practitioners } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', practitionerIds)
    .eq('is_active', true)
    .eq('role', 'practitioner')

  if (!practitioners || practitioners.length === 0) return []

  // ── 3. Day of week (local parse — avoids UTC midnight shift) ──
  const [y, mo, d] = date.split('-').map(Number)
  const dayOfWeek = new Date(y, mo - 1, d).getDay()

  // ── 4. Batch fetch availability data ─────────────────────────
  const [shiftsRes, overridesRes, timeOffRes, apptsRes] = await Promise.all([
    supabase
      .from('shifts')
      .select('practitioner_id, start_time, end_time')
      .in('practitioner_id', practitionerIds)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .lte('effective_from', date)
      .or(`effective_until.is.null,effective_until.gte.${date}`),

    supabase
      .from('shift_overrides')
      .select('practitioner_id, start_time, end_time, is_unavailable')
      .in('practitioner_id', practitionerIds)
      .eq('override_date', date),

    supabase
      .from('time_off')
      .select('practitioner_id')
      .in('practitioner_id', practitionerIds)
      .lte('start_date', date)
      .gte('end_date', date),

    supabase
      .from('appointments')
      .select('practitioner_id, start_time, end_time')
      .in('practitioner_id', practitionerIds)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed']),
  ])

  if (shiftsRes.error) throw new Error(shiftsRes.error.message)
  if (overridesRes.error) throw new Error(overridesRes.error.message)
  if (timeOffRes.error) throw new Error(timeOffRes.error.message)
  if (apptsRes.error) throw new Error(apptsRes.error.message)

  const shifts    = shiftsRes.data    ?? []
  const overrides = overridesRes.data ?? []
  const timeOff   = timeOffRes.data   ?? []
  const appts     = apptsRes.data     ?? []

  const isToday = date === todayString()
  // Earliest minute a slot may start (today only)
  const cutoffMinutes = isToday ? currentMinutes() + BUFFER_HOURS * 60 : -1

  // ── 5. Per-practitioner slot calculation ──────────────────────
  const results: PractitionerSlots[] = []

  for (const practitioner of practitioners) {
    const pid = practitioner.id

    // Skip if on time off
    if (timeOff.some(t => t.practitioner_id === pid)) continue

    // Determine working window for this date
    let shiftStart: number
    let shiftEnd: number

    const override = overrides.find(o => o.practitioner_id === pid)
    if (override) {
      if (override.is_unavailable) continue
      // Override completely replaces the recurring shift
      // DB constraint guarantees start_time/end_time are non-null when is_unavailable=false
      shiftStart = timeToMinutes(override.start_time!)
      shiftEnd   = timeToMinutes(override.end_time!)
    } else {
      const shift = shifts.find(s => s.practitioner_id === pid)
      if (!shift) continue // No shift for this day
      shiftStart = timeToMinutes(shift.start_time)
      shiftEnd   = timeToMinutes(shift.end_time)
    }

    // Existing bookings for overlap detection
    const bookedBlocks = appts
      .filter(a => a.practitioner_id === pid)
      .map(a => ({
        start: timeToMinutes(a.start_time),
        end:   timeToMinutes(a.end_time),
      }))

    // Generate candidates and filter
    const validSlots = generateCandidates(shiftStart, shiftEnd, service.duration_minutes)
      .filter(slotStart => {
        // 2-hour same-day buffer
        if (slotStart < cutoffMinutes) return false
        // Overlap with existing appointment
        const slotEnd = slotStart + service.duration_minutes
        return !bookedBlocks.some(b => slotStart < b.end && slotEnd > b.start)
      })
      .map(minutesToTime)

    if (validSlots.length > 0) {
      results.push({
        practitioner_id:   pid,
        practitioner_name: practitioner.full_name,
        slots:             validSlots,
      })
    }
  }

  return results
}
