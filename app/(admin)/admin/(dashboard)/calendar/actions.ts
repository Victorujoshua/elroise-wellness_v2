'use server'

import { revalidatePath } from 'next/cache'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import type { AppointmentRow, Json } from '@/lib/database.types'

type StatusValue = AppointmentRow['status']
type ActionResult = { success: true } | { success: false; error: string }

export async function updateAppointmentStatus(
  id: string,
  status: StatusValue,
): Promise<ActionResult> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('appointments').update({ status }).eq('id', id)
  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id:    user.id,
    action:      'update_status',
    entity_type: 'appointment',
    entity_id:   id,
    changes:     { status } as unknown as Json,
  })

  revalidatePath('/admin/calendar')
  revalidatePath('/admin/appointments')
  return { success: true }
}
