'use server'

import { redirect } from 'next/navigation'
import { createAuthClient } from '@/lib/supabase/server'

export async function signIn(email: string, password: string) {
  const supabase = await createAuthClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  redirect('/admin/calendar')
}
