'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import { sendTransactional } from '@/lib/loops'
import type { Json, ServiceRow, UserRow } from '@/lib/database.types'

export type MemberWithServices = UserRow & { service_ids: string[] }
export type ServiceOption = Pick<ServiceRow, 'id' | 'name' | 'category'>

// ── Schemas ──────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  full_name: z.string().min(2, 'Required'),
  email:     z.string().email('Invalid email'),
  role:      z.enum(['owner', 'staff', 'practitioner']),
})
export type InviteFormData = z.infer<typeof inviteSchema>

const editMemberSchema = z.object({
  full_name:   z.string().min(2, 'Required'),
  role:        z.enum(['owner', 'staff', 'practitioner']),
  is_active:   z.boolean(),
  service_ids: z.array(z.string()),
})
export type EditMemberFormData = z.infer<typeof editMemberSchema>

type ActionResult = { success: true } | { success: false; error: string }

// ── inviteTeamMember ─────────────────────────────────────────────────────────

export async function inviteTeamMember(data: InviteFormData): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data.' }

  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()

  const { data: existing } = await db
    .from('invitations')
    .select('id')
    .eq('email', parsed.data.email)
    .is('accepted_at', null)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'A pending invitation already exists for this email.' }
  }

  const { data: invite, error: inviteErr } = await db
    .from('invitations')
    .insert({
      email:      parsed.data.email,
      full_name:  parsed.data.full_name,
      role:       parsed.data.role,
      invited_by: user.id,
    })
    .select('id, token')
    .single()

  if (inviteErr || !invite) {
    console.error('[team] Invite insert failed:', inviteErr)
    return { success: false, error: 'Failed to create invitation.' }
  }

  // Send Loops email — non-blocking
  const templateId = process.env.LOOPS_TEAM_INVITATION_TEMPLATE_ID
  if (templateId) {
    const { data: inviter } = await db
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      await sendTransactional({
        templateId,
        email: parsed.data.email,
        dataVariables: {
          recipientName: parsed.data.full_name,
          inviterName:   inviter?.full_name ?? 'The Elroisè team',
          role:          parsed.data.role,
          acceptLink:    `${appUrl}/admin/accept-invite/${invite.token}`,
          expiresIn:     '7 days',
        },
      })
    } catch (err) {
      console.warn('[team] Invite email failed (non-fatal):', err)
    }
  }

  await db.from('audit_log').insert({
    actor_id:    user.id,
    action:      'invite',
    entity_type: 'invitation',
    entity_id:   invite.id,
    changes:     { email: parsed.data.email, role: parsed.data.role } as unknown as Json,
  })

  revalidatePath('/admin/team')
  return { success: true }
}

// ── editTeamMember ───────────────────────────────────────────────────────────

export async function editTeamMember(
  id: string,
  data: EditMemberFormData,
): Promise<ActionResult> {
  const parsed = editMemberSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid data.' }

  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const d = parsed.data

  const { error: updateErr } = await db
    .from('users')
    .update({ full_name: d.full_name, role: d.role, is_active: d.is_active })
    .eq('id', id)

  if (updateErr) return { success: false, error: updateErr.message }

  // Replace practitioner_services atomically
  await db.from('practitioner_services').delete().eq('practitioner_id', id)
  if (d.service_ids.length > 0) {
    await db.from('practitioner_services').insert(
      d.service_ids.map(sid => ({ practitioner_id: id, service_id: sid })),
    )
  }

  await db.from('audit_log').insert({
    actor_id:    user.id,
    action:      'update',
    entity_type: 'user',
    entity_id:   id,
    changes:     { role: d.role, is_active: d.is_active } as unknown as Json,
  })

  revalidatePath('/admin/team')
  return { success: true }
}

// ── toggleMemberActive ───────────────────────────────────────────────────────

export async function toggleMemberActive(
  id: string,
  newActive: boolean,
): Promise<ActionResult> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('users').update({ is_active: newActive }).eq('id', id)
  if (error) return { success: false, error: error.message }

  await db.from('audit_log').insert({
    actor_id:    user.id,
    action:      newActive ? 'activate' : 'deactivate',
    entity_type: 'user',
    entity_id:   id,
    changes:     { is_active: newActive } as unknown as Json,
  })

  revalidatePath('/admin/team')
  return { success: true }
}

// ── toggleMemberNotifyEmail ───────────────────────────────────────────────────

export async function toggleMemberNotifyEmail(
  id: string,
  notify: boolean,
): Promise<ActionResult> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db.from('users').update({ notify_email: notify }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}

// ── revokeInvite ─────────────────────────────────────────────────────────────

export async function revokeInvite(id: string): Promise<ActionResult> {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const db = getSupabaseServiceClient()
  const { error } = await db
    .from('invitations')
    .delete()
    .eq('id', id)
    .is('accepted_at', null)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}
