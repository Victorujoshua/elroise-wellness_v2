import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const BUFFER_HOURS = 2
const BUSINESS_TZ  = 'Africa/Lagos'

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
  startMin:    number,
  endMin:      number,
  durationMin: number,
  intervalMin: number,
): number[] {
  const slots: number[] = []
  let cur = startMin
  while (cur + durationMin <= endMin) {
    slots.push(cur)
    cur += intervalMin
  }
  return slots
}

// Shift times and appointment times are stored as Lagos local time.
// Server runs in UTC, so we must derive "now" in the business timezone
// before comparing against slot minutes or checking whether today is the target date.
function getLagosNow() {
  const now   = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:  BUSINESS_TZ,
    year:      'numeric',
    month:     '2-digit',
    day:       '2-digit',
    hour:      '2-digit',
    minute:    '2-digit',
    hour12:    false,
  }).formatToParts(now)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
  const hour   = parseInt(get('hour'),   10)
  const minute = parseInt(get('minute'), 10)

  return {
    dateString:   `${get('year')}-${get('month')}-${get('day')}`,
    minutesOfDay: hour * 60 + minute,
  }
}

function currentMinutes(): number {
  return getLagosNow().minutesOfDay
}

function todayString(): string {
  return getLagosNow().dateString
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
    .select('id, duration_minutes, buffer_minutes')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (svcErr || !service) return []

  // Slot grid spacing = this service's own duration + turnover buffer.
  // Buffer defaults to 0, so services without one configured keep exact
  // duration-width spacing (not the old fixed 15/30-min grid).
  const slotIntervalMinutes = service.duration_minutes + service.buffer_minutes

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
      .select('practitioner_id, start_time, end_time, services(buffer_minutes)')
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
  const appts     = (apptsRes.data ?? []) as unknown as {
    practitioner_id: string
    start_time:      string
    end_time:        string
    services:        { buffer_minutes: number } | null
  }[]

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

    // Existing bookings for overlap detection. `end` includes the booked
    // service's turnover buffer — the practitioner isn't free again until
    // the buffer elapses, even though the appointment itself ended earlier.
    const bookedBlocks = appts
      .filter(a => a.practitioner_id === pid)
      .map(a => ({
        start: timeToMinutes(a.start_time),
        end:   timeToMinutes(a.end_time) + (a.services?.buffer_minutes ?? 0),
      }))

    // Generate candidates and filter
    const validSlots = generateCandidates(shiftStart, shiftEnd, service.duration_minutes, slotIntervalMinutes)
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

// ── Admin: capacity-aware slots (group bookings) ───────────────────────────
//
// Separate from getAvailableSlots on purpose — that function is shared with
// the public booking flow (book/actions.ts, BookingFlow.tsx) and admin
// reschedule (RescheduleDialog.tsx), and changing its return shape would
// ripple into all of them. This one is for the admin booking sheet only,
// where a group-service slot needs a spots_taken/spots_total display
// instead of a plain available/unavailable boolean.

export type SlotWithCapacity = {
  start_time:  string
  end_time:    string
  spots_taken: number
  spots_total: number
  is_full:     boolean
}

export type PractitionerSlotsWithCapacity = {
  practitioner_id:   string
  practitioner_name: string
  slots:             SlotWithCapacity[]
}

export async function getAvailableSlotsWithCapacity({
  serviceId,
  date,
}: GetAvailableSlotsParams): Promise<PractitionerSlotsWithCapacity[]> {
  if (date < todayString()) return []

  const supabase = createServiceClient()

  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('id, duration_minutes, buffer_minutes, max_concurrent')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (svcErr || !service) return []

  const slotIntervalMinutes = service.duration_minutes + service.buffer_minutes

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

  const [y, mo, d] = date.split('-').map(Number)
  const dayOfWeek = new Date(y, mo - 1, d).getDay()

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

    // Need service_id per booking (to tell "same group" from "different
    // service") alongside its buffer, unlike getAvailableSlots which only
    // needs the buffer.
    supabase
      .from('appointments')
      .select('practitioner_id, service_id, start_time, end_time, services(buffer_minutes)')
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
  const appts     = (apptsRes.data ?? []) as unknown as {
    practitioner_id: string
    service_id:      string
    start_time:      string
    end_time:        string
    services:        { buffer_minutes: number } | null
  }[]

  const isToday = date === todayString()
  const cutoffMinutes = isToday ? currentMinutes() + BUFFER_HOURS * 60 : -1

  const results: PractitionerSlotsWithCapacity[] = []

  for (const practitioner of practitioners) {
    const pid = practitioner.id

    if (timeOff.some(t => t.practitioner_id === pid)) continue

    let shiftStart: number
    let shiftEnd: number

    const override = overrides.find(o => o.practitioner_id === pid)
    if (override) {
      if (override.is_unavailable) continue
      shiftStart = timeToMinutes(override.start_time!)
      shiftEnd   = timeToMinutes(override.end_time!)
    } else {
      const shift = shifts.find(s => s.practitioner_id === pid)
      if (!shift) continue
      shiftStart = timeToMinutes(shift.start_time)
      shiftEnd   = timeToMinutes(shift.end_time)
    }

    const apptsForPid = appts.filter(a => a.practitioner_id === pid)

    const slots: SlotWithCapacity[] = []

    for (const slotStart of generateCandidates(shiftStart, shiftEnd, service.duration_minutes, slotIntervalMinutes)) {
      if (slotStart < cutoffMinutes) continue
      const slotEnd = slotStart + service.duration_minutes

      // A DIFFERENT service occupying (or still in buffer for) this time
      // excludes the candidate entirely, regardless of this service's
      // own concurrency — matches the RPC's PRACTITIONER_BUSY check.
      const blockedByOtherService = apptsForPid.some(a => {
        if (a.service_id === serviceId) return false
        const effectiveEnd = timeToMinutes(a.end_time) + (a.services?.buffer_minutes ?? 0)
        return slotStart < effectiveEnd && slotEnd > timeToMinutes(a.start_time)
      })
      if (blockedByOtherService) continue

      if (service.max_concurrent <= 1) {
        // 1-on-1: any overlap (same or different service) blocks —
        // identical to getAvailableSlots's behavior.
        const blocked = apptsForPid.some(a => {
          const effectiveEnd = timeToMinutes(a.end_time) + (a.services?.buffer_minutes ?? 0)
          return slotStart < effectiveEnd && slotEnd > timeToMinutes(a.start_time)
        })
        if (blocked) continue
        slots.push({
          start_time:  minutesToTime(slotStart),
          end_time:    minutesToTime(slotEnd),
          spots_taken: 0,
          spots_total: 1,
          is_full:     false,
        })
      } else {
        // Group service: count bookings for THIS exact service/slot —
        // matches the RPC's SLOT_FULL check granularity. Shown even when
        // full (grayed out client-side) rather than hidden, so admin can
        // see why it isn't selectable.
        const spotsTaken = apptsForPid.filter(a =>
          a.service_id === serviceId &&
          timeToMinutes(a.start_time) === slotStart &&
          timeToMinutes(a.end_time)   === slotEnd,
        ).length
        slots.push({
          start_time:  minutesToTime(slotStart),
          end_time:    minutesToTime(slotEnd),
          spots_taken: spotsTaken,
          spots_total: service.max_concurrent,
          is_full:     spotsTaken >= service.max_concurrent,
        })
      }
    }

    if (slots.length > 0) {
      results.push({
        practitioner_id:   pid,
        practitioner_name: practitioner.full_name,
        slots,
      })
    }
  }

  return results
}
