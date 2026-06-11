import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createAuthClient, getSupabaseServiceClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'
import TopBar from '@/components/admin/TopBar'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const db = getSupabaseServiceClient()
  const { data: adminUser } = await db
    .from('users')
    .select('id, full_name, role, is_active')
    .eq('id', user.id)
    .single()

  if (!adminUser || !adminUser.is_active) redirect('/admin/login')

  const userInfo = { name: adminUser.full_name, role: adminUser.role }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={userInfo} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar user={userInfo} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
