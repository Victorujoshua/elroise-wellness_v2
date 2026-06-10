import { getSupabaseServiceClient } from '@/lib/supabase/server'
import TeamTable from '@/components/admin/team/TeamTable'
import type { MemberWithServices, ServiceOption } from './actions'

export default async function TeamPage() {
  const db = getSupabaseServiceClient()

  const [usersResult, invitesResult, servicesResult, psResult] = await Promise.all([
    db.from('users').select('*').order('full_name'),
    db.from('invitations').select('*').is('accepted_at', null).order('created_at', { ascending: false }),
    db.from('services').select('id, name, category').eq('is_active', true).order('sort_order').order('name'),
    db.from('practitioner_services').select('practitioner_id, service_id'),
  ])

  const users    = usersResult.data ?? []
  const invites  = invitesResult.data ?? []
  const services = (servicesResult.data ?? []) as ServiceOption[]
  const ps       = psResult.data ?? []

  const members: MemberWithServices[] = users.map(u => ({
    ...u,
    service_ids: ps.filter(r => r.practitioner_id === u.id).map(r => r.service_id),
  }))

  return (
    <TeamTable
      members={members}
      pendingInvites={invites}
      services={services}
    />
  )
}
