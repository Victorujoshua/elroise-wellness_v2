'use server'

import { revalidatePath } from 'next/cache'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import { serviceSchema } from '@/components/admin/services/serviceSchema'
import type { ServiceFormData } from '@/components/admin/services/serviceSchema'
import type { Json, ServiceRow, UserRow } from '@/lib/database.types'

export type ServiceWithPractitioners = ServiceRow & { practitioner_ids: string[] }
export type PractitionerOption = Pick<UserRow, 'id' | 'full_name' | 'role'>
export async function saveService(
  id: string | null,
  data: ServiceFormData,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const parsed = serviceSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Validation failed' }

  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const db = getSupabaseServiceClient()
  const d = parsed.data

  const serviceData = {
    name: d.name,
    slug: d.slug,
    category: d.category,
    description: d.description || null,
    duration_minutes: d.duration_minutes,
    buffer_minutes: d.buffer_minutes,
    max_concurrent: d.max_concurrent,
    single_price_naira: d.single_price_naira,
    package_price_naira: d.has_package ? (d.package_price_naira ?? null) : null,
    package_session_count: d.has_package ? (d.package_session_count ?? null) : null,
    color_hex: d.color_hex,
    is_active: d.is_active,
    sort_order: d.sort_order,
    class_start_times: d.class_start_times,
  }

  let serviceId: string

  if (id) {
    const { error } = await db.from('services').update(serviceData).eq('id', id)
    if (error) return { success: false, error: error.message }
    serviceId = id
  } else {
    const { data: row, error } = await db
      .from('services')
      .insert(serviceData)
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    serviceId = row.id
  }

  // Replace practitioner_services atomically
  await db.from('practitioner_services').delete().eq('service_id', serviceId)
  if (d.practitioner_ids.length > 0) {
    await db.from('practitioner_services').insert(
      d.practitioner_ids.map(pid => ({ practitioner_id: pid, service_id: serviceId })),
    )
  }

  await db.from('audit_log').insert({
    actor_id: user.id,
    action: id ? 'update' : 'create',
    entity_type: 'service',
    entity_id: serviceId,
    changes: serviceData as unknown as Json,
  })

  revalidatePath('/admin/services')
  revalidatePath('/services')

  return { success: true, id: serviceId }
}

export async function toggleServiceActive(
  id: string,
  newActive: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('services').update({ is_active: newActive }).eq('id', id)
  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id: user.id,
    action: newActive ? 'activate' : 'deactivate',
    entity_type: 'service',
    entity_id: id,
    changes: { is_active: newActive } as unknown as Json,
  })

  revalidatePath('/admin/services')
  revalidatePath('/services')

  return { success: true }
}

export async function deleteService(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const db = getSupabaseServiceClient()

  // Block deletion if appointments reference this service
  const { count } = await db
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', id)
  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: `This service has ${count} appointment${count === 1 ? '' : 's'} and cannot be deleted. Deactivate it instead.`,
    }
  }

  // Remove practitioner links first to avoid FK violation
  await db.from('practitioner_services').delete().eq('service_id', id)

  const { error } = await db.from('services').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id: user.id,
    action: 'delete',
    entity_type: 'service',
    entity_id: id,
    changes: {} as unknown as Json,
  })

  revalidatePath('/admin/services')
  revalidatePath('/services')

  return { success: true }
}

export async function reorderServices(
  updates: { id: string; sort_order: number }[],
): Promise<{ success: true } | { success: false; error: string }> {
  const db = getSupabaseServiceClient()
  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      db.from('services').update({ sort_order }).eq('id', id),
    ),
  )
  const failed = results.find(r => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }

  revalidatePath('/admin/services')
  revalidatePath('/services')

  return { success: true }
}
