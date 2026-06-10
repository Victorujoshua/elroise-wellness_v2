'use server'

import { getSupabaseServiceClient } from '@/lib/supabase/server'

type AcceptResult = { success: true } | { success: false; error: string }

export async function acceptInvite(
  token: string,
  fullName: string,
  password: string,
): Promise<AcceptResult> {
  if (!token || !fullName.trim() || !password) {
    return { success: false, error: 'Invalid request.' }
  }

  const db = getSupabaseServiceClient()

  // Re-validate token (guards against race on double-submit)
  const { data: invite } = await db
    .from('invitations')
    .select('id, email, role, accepted_at')
    .eq('token', token)
    .maybeSingle()

  if (!invite || invite.accepted_at) {
    return { success: false, error: 'This invitation is invalid or has already been used.' }
  }

  // Create auth user — email pre-confirmed, no confirmation email sent
  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email:         invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim() },
  })

  if (authErr || !authData.user) {
    console.error('[accept-invite] Auth user creation failed:', authErr)
    if (authErr?.message?.includes('already been registered')) {
      return { success: false, error: 'This email is already registered. Try signing in instead.' }
    }
    return { success: false, error: 'Failed to create account. Please try again.' }
  }

  // Insert public.users row
  const { error: userErr } = await db.from('users').insert({
    id:        authData.user.id,
    full_name: fullName.trim(),
    role:      invite.role,
    is_active: true,
  })

  if (userErr) {
    // Compensate — clean up the auth user to avoid orphaned auth records
    await db.auth.admin.deleteUser(authData.user.id)
    console.error('[accept-invite] public.users insert failed:', userErr)
    return { success: false, error: 'Failed to complete account setup. Please try again.' }
  }

  // Mark invitation accepted
  await db
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  return { success: true }
}
