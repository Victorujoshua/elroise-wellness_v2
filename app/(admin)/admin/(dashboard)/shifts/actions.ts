'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'

type ActionResult = { success: true } | { success: false; error: string }

// ── Schemas ──────────────────────────────────────────────────────────────────

const shiftSchema = z.object({
  id:              z.string().uuid().optional(),
  practitioner_id: z.string().uuid(),
  day_of_week:     z.number().int().min(0).max(6),
  start_time:      z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  end_time:        z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  effective_from:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  effective_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
}).refine(d => d.start_time < d.end_time, {
  message: 'End time must be after start',
  path: ['end_time'],
})

const timeOffSchema = z.object({
  practitioner_id: z.string().uuid(),
  start_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:          z.string().max(200).optional(),
}).refine(d => d.start_date <= d.end_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
})

const overrideSchema = z.object({
  id:              z.string().uuid().optional(),
  practitioner_id: z.string().uuid(),
  override_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_unavailable:  z.boolean(),
  start_time:      z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  end_time:        z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  reason:          z.string().max(200).optional(),
}).refine(d => d.is_unavailable || (!!d.start_time && !!d.end_time), {
  message: 'Start and end times are required',
  path: ['start_time'],
}).refine(d => {
  if (!d.is_unavailable && d.start_time && d.end_time) return d.start_time < d.end_time
  return true
}, {
  message: 'End time must be after start',
  path: ['end_time'],
})

export type ShiftFormData    = z.infer<typeof shiftSchema>
export type TimeOffFormData  = z.infer<typeof timeOffSchema>
export type OverrideFormData = z.infer<typeof overrideSchema>

async function getActor() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  return user
}

// ── upsertShift ─────────────────────────────────────────────────────────────

export async function upsertShift(data: ShiftFormData): Promise<ActionResult> {
  const parsed = shiftSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const actor = await getActor()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const d  = parsed.data

  if (d.id) {
    const { error } = await db.from('shifts').update({
      day_of_week:     d.day_of_week,
      start_time:      d.start_time,
      end_time:        d.end_time,
      effective_from:  d.effective_from,
      effective_until: d.effective_until ?? null,
    }).eq('id', d.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await db.from('shifts').insert({
      practitioner_id: d.practitioner_id,
      day_of_week:     d.day_of_week,
      start_time:      d.start_time,
      end_time:        d.end_time,
      effective_from:  d.effective_from,
      effective_until: d.effective_until ?? null,
    })
    if (error) return { success: false, error: error.message }
  }

  await db.from('audit_log').insert({
    actor_id:    actor.id,
    action:      d.id ? 'update' : 'create',
    entity_type: 'shift',
    changes:     { practitioner_id: d.practitioner_id, day_of_week: d.day_of_week } as unknown as Json,
  })

  revalidatePath('/admin/shifts')
  return { success: true }
}

// ── toggleShift ──────────────────────────────────────────────────────────────

export async function toggleShift(id: string, is_active: boolean): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('shifts').update({ is_active }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/shifts')
  return { success: true }
}

// ── deleteShift ──────────────────────────────────────────────────────────────

export async function deleteShift(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('shifts').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id:    actor.id,
    action:      'delete',
    entity_type: 'shift',
    entity_id:   id,
    changes:     null,
  })

  revalidatePath('/admin/shifts')
  return { success: true }
}

// ── addTimeOff ───────────────────────────────────────────────────────────────

export async function addTimeOff(data: TimeOffFormData): Promise<ActionResult> {
  const parsed = timeOffSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const actor = await getActor()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('time_off').insert({
    practitioner_id: parsed.data.practitioner_id,
    start_date:      parsed.data.start_date,
    end_date:        parsed.data.end_date,
    reason:          parsed.data.reason || null,
  })
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/shifts')
  return { success: true }
}

// ── deleteTimeOff ────────────────────────────────────────────────────────────

export async function deleteTimeOff(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('time_off').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/shifts')
  return { success: true }
}

// ── upsertOverride ───────────────────────────────────────────────────────────

export async function upsertOverride(data: OverrideFormData): Promise<ActionResult> {
  const parsed = overrideSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const actor = await getActor()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const d  = parsed.data

  const payload = {
    override_date:  d.override_date,
    is_unavailable: d.is_unavailable,
    start_time:     d.is_unavailable ? null : (d.start_time ?? null),
    end_time:       d.is_unavailable ? null : (d.end_time   ?? null),
    reason:         d.reason || null,
  }

  if (d.id) {
    const { error } = await db.from('shift_overrides').update(payload).eq('id', d.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await db.from('shift_overrides').insert({
      practitioner_id: d.practitioner_id,
      ...payload,
    })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/admin/shifts')
  return { success: true }
}

// ── deleteOverride ───────────────────────────────────────────────────────────

export async function deleteOverride(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('shift_overrides').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/shifts')
  return { success: true }
}
