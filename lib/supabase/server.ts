import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import type { Database } from '@/lib/database.types'

export const getSupabaseServerClient = cache(() =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
)
