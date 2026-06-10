'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClientHistoryItem = {
  id:               string
  appointment_date: string
  start_time:       string
  end_time:         string
  status:           string
  pricing_tier:     string
  source:           string
  notes:            string | null
  service_name:     string | null
  practitioner_name: string | null
}

// ── updateClient ──────────────────────────────────────────────────────────────

const updateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone:     z.string().min(7, 'Phone number is too short'),
  notes:     z.string().optional(),
})

export type ClientUpdateData = z.infer<typeof updateSchema>

export async function updateClient(
  id: string,
  data: ClientUpdateData,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()

  const { error } = await db
    .from('clients')
    .update({
      full_name: parsed.data.full_name,
      phone:     parsed.data.phone,
      notes:     parsed.data.notes || null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id:    user.id,
    action:      'update',
    entity_type: 'client',
    entity_id:   id,
    changes:     { full_name: parsed.data.full_name, phone: parsed.data.phone } as unknown as Json,
  })

  revalidatePath('/admin/clients')
  return { success: true }
}

// ── getClientHistory ──────────────────────────────────────────────────────────

export async function getClientHistory(
  clientId: string,
): Promise<{ success: true; items: ClientHistoryItem[] } | { success: false; error: string }> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()

  const { data, error } = await db
    .from('appointments')
    .select(`
      id, appointment_date, start_time, end_time,
      status, pricing_tier, source, notes,
      services ( name ),
      users ( full_name )
    `)
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) return { success: false, error: error.message }

  const items: ClientHistoryItem[] = (data ?? []).map((row: any) => ({
    id:                row.id,
    appointment_date:  row.appointment_date,
    start_time:        row.start_time,
    end_time:          row.end_time,
    status:            row.status,
    pricing_tier:      row.pricing_tier,
    source:            row.source,
    notes:             row.notes,
    service_name:      row.services?.name ?? null,
    practitioner_name: row.users?.full_name ?? null,
  }))

  return { success: true, items }
}
