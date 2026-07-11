'use server'

import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'

export type ClientSearchResult = {
  id:               string
  full_name:        string
  email:            string
  phone:            string
  last_visit_date:  string | null
}

type RawResult = {
  id:           string
  full_name:    string
  email:        string
  phone:        string
  appointments: { appointment_date: string; status: string }[] | null
}

export async function searchClients(query: string): Promise<ClientSearchResult[]> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return []

  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  // Strip characters that are structural in PostgREST's .or() filter DSL
  // (comma separates conditions, parens group them) — meaningless for a
  // name/email/phone match anyway, so dropping them keeps the filter valid.
  const safe = trimmed.replace(/[,()]/g, '')
  if (safe.length < 2) return []
  const searchTerm = `%${safe}%`

  const db = getSupabaseServiceClient()

  const { data, error } = await db
    .from('clients')
    .select(`
      id,
      full_name,
      email,
      phone,
      appointments!appointments_client_id_fkey (
        appointment_date,
        status
      )
    `)
    .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
    .order('full_name', { ascending: true })
    .limit(10)

  if (error) {
    console.error('[searchClients] error:', error)
    return []
  }

  return ((data ?? []) as unknown as RawResult[]).map(client => {
    const validAppts = (client.appointments ?? []).filter(a => a.status !== 'cancelled')
    const lastVisit = validAppts.length > 0
      ? validAppts.reduce((max, a) => a.appointment_date > max ? a.appointment_date : max, validAppts[0].appointment_date)
      : null

    return {
      id:              client.id,
      full_name:       client.full_name,
      email:           client.email,
      phone:           client.phone,
      last_visit_date: lastVisit,
    }
  })
}
