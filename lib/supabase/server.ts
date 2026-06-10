import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export const getSupabaseServerClient = cache(() =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
)

export const getSupabaseServiceClient = cache(() =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
)

export async function createAuthClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component context — cookies are read-only
          }
        },
      },
    }
  )
}
