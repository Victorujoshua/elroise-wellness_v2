#!/usr/bin/env node
/**
 * Availability engine integration test.
 *
 * Inserts isolated test fixtures, runs 7 cases, cleans up — safe to re-run.
 *
 * Run (bash):
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/test-availability.ts
 *
 * Run (PowerShell):
 *   Get-Content .env.local | ForEach-Object { $k,$v = $_ -split '=',2; [System.Environment]::SetEnvironmentVariable($k,$v) }
 *   npx tsx scripts/test-availability.ts
 */

import { createClient } from '@supabase/supabase-js'
import { getAvailableSlots } from '../lib/availability'
import type { Database } from '../lib/database.types'

// ─── env check ────────────────────────────────────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── assertion helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function ok(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`    ✓ ${label}`)
    passed++
  } else {
    console.error(`    ✗ ${label}${detail ? '  ← ' + detail : ''}`)
    failed++
  }
}

// ─── date helpers ──────────────────────────────────────────────────────────────

function nextWeekday(dow: 1 | 2 | 3 | 4 | 5): string {
  const d = new Date()
  const diff = ((dow - d.getDay() + 7) % 7) || 7 // always future, never today
  d.setDate(d.getDate() + diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── test fixtures ─────────────────────────────────────────────────────────────

// All test records use this service + client ID so cleanup is targeted.
const SVC_ID    = 'aaaaaaaa-test-0000-0000-000000000001'
const CLIENT_ID = 'aaaaaaaa-test-0000-0002-000000000001'
const DURATION  = 55
const TEST_DATE = nextWeekday(1) // next Monday

let p1Id = ''
let p2Id = ''
let shiftIds: string[] = []

async function setup() {
  console.log('\n▶  Setup')
  console.log(`   Test date : ${TEST_DATE}`)

  // Service
  const { error: svcErr } = await db.from('services').upsert({
    id: SVC_ID,
    name: '__Test (availability engine)',
    slug: '__test-availability-engine',
    category: 'pilates',
    duration_minutes: DURATION,
    single_price_naira: 1000,
    sort_order: 9999,
    is_active: true,
  })
  if (svcErr) throw new Error(`Service: ${svcErr.message}`)

  // Practitioners via auth admin (required for users.id FK)
  const [r1, r2] = await Promise.all([
    db.auth.admin.createUser({ email: '__test-avail-p1@elroise.test', email_confirm: true }),
    db.auth.admin.createUser({ email: '__test-avail-p2@elroise.test', email_confirm: true }),
  ])
  if (r1.error) throw new Error(`Auth P1: ${r1.error.message}`)
  if (r2.error) throw new Error(`Auth P2: ${r2.error.message}`)
  p1Id = r1.data.user.id
  p2Id = r2.data.user.id

  console.log(`   P1        : ${p1Id.slice(0, 8)}…`)
  console.log(`   P2        : ${p2Id.slice(0, 8)}…`)

  await db.from('users').upsert([
    { id: p1Id, full_name: 'Test P1', role: 'practitioner', is_active: true },
    { id: p2Id, full_name: 'Test P2', role: 'practitioner', is_active: true },
  ])

  await db.from('practitioner_services').upsert([
    { practitioner_id: p1Id, service_id: SVC_ID },
    { practitioner_id: p2Id, service_id: SVC_ID },
  ])

  // Mon–Fri 08:00–18:00 for both practitioners
  const { data: inserted, error: shiftErr } = await db
    .from('shifts')
    .insert(
      [p1Id, p2Id].flatMap(pid =>
        ([1, 2, 3, 4, 5] as const).map(day => ({
          practitioner_id: pid,
          day_of_week: day,
          start_time: '08:00',
          end_time: '18:00',
        })),
      ),
    )
    .select('id')
  if (shiftErr) throw new Error(`Shifts: ${shiftErr.message}`)
  shiftIds = (inserted ?? []).map(s => s.id)

  await db.from('clients').upsert({
    id: CLIENT_ID,
    full_name: '__Test Client',
    email: '__test-avail-client@elroise.test',
    phone: '+234 000 000 0000',
  })
}

async function cleanup() {
  console.log('\n▶  Cleanup')
  await db.from('appointments').delete().eq('client_id', CLIENT_ID)
  await db.from('time_off').delete().in('practitioner_id', [p1Id, p2Id])
  await db.from('shift_overrides').delete().in('practitioner_id', [p1Id, p2Id])
  if (shiftIds.length) await db.from('shifts').delete().in('id', shiftIds)
  await db.from('practitioner_services').delete().eq('service_id', SVC_ID)
  await db.from('clients').delete().eq('id', CLIENT_ID)
  await db.from('users').delete().in('id', [p1Id, p2Id])
  await Promise.all([
    db.auth.admin.deleteUser(p1Id),
    db.auth.admin.deleteUser(p2Id),
  ])
  await db.from('services').delete().eq('id', SVC_ID)
  console.log('   Done.')
}

// ─── helpers ───────────────────────────────────────────────────────────────────

async function bookAppt(pid: string, start: string, end: string) {
  await db.from('appointments').insert({
    client_id: CLIENT_ID,
    service_id: SVC_ID,
    practitioner_id: pid,
    appointment_date: TEST_DATE,
    start_time: start,
    end_time: end,
    status: 'confirmed',
  })
}

async function clearAppts() {
  await db.from('appointments').delete().eq('client_id', CLIENT_ID)
}

// ─── test cases ────────────────────────────────────────────────────────────────

async function case1() {
  // 08:00–18:00, 55-min sessions, 30-min grid:
  // 08:00 08:30 09:00 09:30 10:00 10:30 11:00 11:30 12:00 12:30
  // 13:00 13:30 14:00 14:30 15:00 15:30 16:00 16:30 17:00  → 19 slots
  console.log('\n── CASE 1: No bookings — full shift window ───────────────────')
  const res = await getAvailableSlots({ serviceId: SVC_ID, date: TEST_DATE })
  ok('two practitioners returned', res.length === 2, `got ${res.length}`)
  const p1 = res.find(r => r.practitioner_id === p1Id)
  ok('P1 present', !!p1)
  ok('P1 has 19 slots', p1?.slots.length === 19, `got ${p1?.slots.length}`)
  ok('first slot 08:00', p1?.slots[0] === '08:00')
  ok('last slot 17:00', p1?.slots.at(-1) === '17:00')
}

async function case2() {
  // Appt 10:00–10:55 blocks:
  //   09:30 slot (09:30–10:25 overlaps 10:00–10:55)
  //   10:00 slot (exact match)
  //   10:30 slot (10:30–11:25 overlaps 10:00–10:55)
  //   11:00 slot is clear (starts after appt end)
  console.log('\n── CASE 2: Booking at 10:00 blocks overlapping slots ─────────')
  await bookAppt(p1Id, '10:00', '10:55')
  const res = await getAvailableSlots({ serviceId: SVC_ID, date: TEST_DATE })
  const p1 = res.find(r => r.practitioner_id === p1Id)
  const p2 = res.find(r => r.practitioner_id === p2Id)
  ok('09:30 blocked for P1', !p1?.slots.includes('09:30'))
  ok('10:00 blocked for P1', !p1?.slots.includes('10:00'))
  ok('10:30 blocked for P1', !p1?.slots.includes('10:30'))
  ok('11:00 clear for P1',    p1?.slots.includes('11:00') === true)
  ok('P2 unaffected (19)',    p2?.slots.length === 19, `got ${p2?.slots.length}`)
  await clearAppts()
}

async function case3() {
  console.log('\n── CASE 3: P1 on time_off — excluded entirely ───────────────')
  await db.from('time_off').insert({
    practitioner_id: p1Id,
    start_date: TEST_DATE,
    end_date: TEST_DATE,
  })
  const res = await getAvailableSlots({ serviceId: SVC_ID, date: TEST_DATE })
  ok('P1 absent', !res.find(r => r.practitioner_id === p1Id))
  ok('P2 present', !!res.find(r => r.practitioner_id === p2Id))
  await db.from('time_off').delete().eq('practitioner_id', p1Id)
}

async function case4() {
  console.log('\n── CASE 4: P2 override is_unavailable=true — excluded ───────')
  await db.from('shift_overrides').insert({
    practitioner_id: p2Id,
    override_date: TEST_DATE,
    is_unavailable: true,
  })
  const res = await getAvailableSlots({ serviceId: SVC_ID, date: TEST_DATE })
  ok('P2 absent', !res.find(r => r.practitioner_id === p2Id))
  ok('P1 present', !!res.find(r => r.practitioner_id === p1Id))
  await db.from('shift_overrides').delete().eq('practitioner_id', p2Id)
}

async function case5() {
  // Override window 10:00–14:00:
  // valid slots: 10:00 10:30 11:00 11:30 12:00 12:30 13:00  → 7 slots
  // (13:00 + 55 = 13:55 <= 14:00 ✓ | 13:30 + 55 = 14:25 > 14:00 ✗)
  console.log('\n── CASE 5: P2 override window 10:00–14:00 ───────────────────')
  await db.from('shift_overrides').insert({
    practitioner_id: p2Id,
    override_date: TEST_DATE,
    start_time: '10:00',
    end_time: '14:00',
    is_unavailable: false,
  })
  const res = await getAvailableSlots({ serviceId: SVC_ID, date: TEST_DATE })
  const p2 = res.find(r => r.practitioner_id === p2Id)
  ok('P2 has 7 slots', p2?.slots.length === 7, `got ${p2?.slots.length}`)
  ok('P2 first slot 10:00', p2?.slots[0] === '10:00')
  ok('P2 last slot 13:00', p2?.slots.at(-1) === '13:00')
  ok('08:00 not in P2', !p2?.slots.includes('08:00'))
  ok('13:30 not in P2', !p2?.slots.includes('13:30'))
  await db.from('shift_overrides').delete().eq('practitioner_id', p2Id)
}

async function case6() {
  console.log('\n── CASE 6: Past date → empty ────────────────────────────────')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const past = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  const res = await getAvailableSlots({ serviceId: SVC_ID, date: past })
  ok('returns []', res.length === 0, `got ${res.length}`)
}

async function case7() {
  console.log('\n── CASE 7: Today — 2-hour buffer enforced ───────────────────')
  const dow = new Date().getDay()
  if (dow === 0 || dow === 6) {
    console.log('   ⚠  Weekend — no weekday shifts, skipping')
    return
  }
  const today = todayStr()
  const res = await getAvailableSlots({ serviceId: SVC_ID, date: today })
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const cutoff = nowMin + 120
  let bufferViolation = false
  for (const p of res) {
    for (const slot of p.slots) {
      const [h, m] = slot.split(':').map(Number)
      if (h * 60 + m < cutoff) { bufferViolation = true; break }
    }
  }
  ok('no slot within 2h of now', !bufferViolation)
  if (res.every(p => p.slots.length === 0) || res.length === 0) {
    console.log('   ℹ  No slots today (likely after business hours) — buffer logic intact')
  }
}

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nElroisè — Availability Engine Test')
  console.log('====================================')

  await setup()

  try {
    await case1()
    await case2()
    await case3()
    await case4()
    await case5()
    await case6()
    await case7()
  } finally {
    await cleanup()
  }

  const total = passed + failed
  console.log(`\n${'═'.repeat(38)}`)
  console.log(`  ${passed}/${total} passed${failed > 0 ? `   (${failed} FAILED)` : ''}`)
  console.log('═'.repeat(38) + '\n')
  if (failed > 0) process.exit(1)
}

main().catch(err => {
  console.error('\nFatal error:', err)
  process.exit(1)
})
