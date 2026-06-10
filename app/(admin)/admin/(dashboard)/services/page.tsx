import { getSupabaseServiceClient } from '@/lib/supabase/server'
import ServiceTable from '@/components/admin/services/ServiceTable'

export default async function ServicesPage() {
  const db = getSupabaseServiceClient()

  const [servicesResult, practitionersResult, psResult] = await Promise.all([
    db.from('services').select('*').order('sort_order').order('name'),
    db
      .from('users')
      .select('id, full_name, role')
      .in('role', ['practitioner', 'owner'])
      .eq('is_active', true)
      .order('full_name'),
    db.from('practitioner_services').select('practitioner_id, service_id'),
  ])

  const services = servicesResult.data ?? []
  const practitioners = practitionersResult.data ?? []
  const ps = psResult.data ?? []

  const servicesWithPractitioners = services.map(s => ({
    ...s,
    practitioner_ids: ps.filter(r => r.service_id === s.id).map(r => r.practitioner_id),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <ServiceTable services={servicesWithPractitioners} practitioners={practitioners} />
    </div>
  )
}
