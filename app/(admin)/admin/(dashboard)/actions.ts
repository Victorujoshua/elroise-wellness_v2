'use server'

import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createAuthClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function getAppointmentDensity(
  year: number,
  month: number,
): Promise<Record<string, number>> {
  return unstable_cache(
    async () => {
      const db      = getSupabaseServiceClient()
      const start   = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const end     = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const { data } = await db
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .neq('status', 'cancelled')

      const density: Record<string, number> = {}
      for (const row of data ?? []) {
        density[row.appointment_date] = (density[row.appointment_date] ?? 0) + 1
      }
      return density
    },
    [`appointment-density-${year}-${month}`],
    { revalidate: 60 },
  )()
}
