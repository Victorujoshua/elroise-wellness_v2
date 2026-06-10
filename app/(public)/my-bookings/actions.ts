'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export type BookingRecord = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  pricing_tier: string
  service_name: string
  service_category: string
  duration_minutes: number
  practitioner_name: string
}

type LookupResult =
  | { success: true; bookings: BookingRecord[]; email: string }
  | { success: false; error: string }

export async function lookupBookingsByEmail(email: string): Promise<LookupResult> {
  const parsed = z.string().email().safeParse(email.trim())
  if (!parsed.success) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const db = createServiceClient()

  const { data: client } = await db
    .from('clients')
    .select('id')
    .eq('email', parsed.data)
    .maybeSingle()

  if (!client) {
    return { success: true, bookings: [], email: parsed.data }
  }

  const { data: rows, error } = await db
    .from('appointments')
    .select(`
      id, appointment_date, start_time, end_time, status, pricing_tier,
      services!service_id ( name, duration_minutes, category ),
      users!practitioner_id ( full_name )
    `)
    .eq('client_id', client.id)
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) {
    console.error('[my-bookings] Query error:', error)
    return { success: false, error: 'Unable to load bookings. Please try again.' }
  }

  type RawRow = {
    id: string
    appointment_date: string
    start_time: string
    end_time: string
    status: string
    pricing_tier: string
    services: { name: string; duration_minutes: number; category: string } | null
    users: { full_name: string } | null
  }

  const bookings: BookingRecord[] = ((rows ?? []) as unknown as RawRow[]).map(r => ({
    id: r.id,
    appointment_date: r.appointment_date,
    start_time: r.start_time,
    end_time: r.end_time,
    status: r.status,
    pricing_tier: r.pricing_tier,
    service_name: r.services?.name ?? 'Unknown service',
    service_category: r.services?.category ?? 'other',
    duration_minutes: r.services?.duration_minutes ?? 0,
    practitioner_name: r.users?.full_name ?? 'Elroisè Team',
  }))

  return { success: true, bookings, email: parsed.data }
}
