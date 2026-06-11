import { getSupabaseServiceClient } from '@/lib/supabase/server'
import AppointmentTable from '@/components/admin/appointments/AppointmentTable'
import type { AppointmentListItem, FilterOption } from '@/components/admin/appointments/AppointmentTable'
import type { AppointmentRow } from '@/lib/database.types'

const PAGE_SIZE = 25

interface Props {
  searchParams: Promise<{
    q?: string; page?: string; sort?: string; dir?: string
    status?: string; service_id?: string; practitioner_id?: string
    payment_status?: string; date_from?: string; date_to?: string
  }>
}

export default async function AppointmentsPage({ searchParams }: Props) {
  const sp     = await searchParams
  const page   = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const dir    = sp.dir === 'asc' ? 'asc' as const : 'desc' as const
  const offset = (page - 1) * PAGE_SIZE

  const db = getSupabaseServiceClient()

  const [servicesRes, practitionersRes] = await Promise.all([
    db.from('services').select('id, name').eq('is_active', true).order('sort_order').order('name'),
    db.from('users').select('id, full_name').in('role', ['practitioner', 'owner']).eq('is_active', true).order('full_name'),
  ])

  const services: FilterOption[]      = (servicesRes.data ?? []).map(s => ({ id: s.id, name: s.name }))
  const practitioners: FilterOption[] = (practitionersRes.data ?? []).map(p => ({ id: p.id, name: p.full_name }))

  const emptyState = (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Appointments</h1>
        <p className="text-sm text-muted-foreground">0 total</p>
      </div>
      <AppointmentTable appointments={[]} total={0} page={1} pageSize={PAGE_SIZE}
        services={services} practitioners={practitioners} />
    </div>
  )

  // text search pre-query
  let clientIds: string[] | null = null
  if (sp.q?.trim()) {
    const term = sp.q.trim()
    const { data: matched } = await db
      .from('clients').select('id')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(500)
    clientIds = (matched ?? []).map(c => c.id)
    if (clientIds.length === 0) return emptyState
  }

  // payment status pre-query
  let paymentApptIds: string[] | null = null
  if (sp.payment_status && sp.payment_status !== 'none') {
    const { data: pmts } = await db
      .from('payments').select('appointment_id').eq('status', sp.payment_status)
    paymentApptIds = (pmts ?? []).map(p => p.appointment_id).filter(Boolean) as string[]
    if (paymentApptIds.length === 0) return emptyState
  }

  // main paginated query
  let query = db
    .from('appointments')
    .select(`
      id, appointment_date, start_time, status,
      clients!inner(full_name, email),
      services!inner(name),
      users!appointments_practitioner_id_fkey(full_name),
      payments(status, amount_kobo)
    `, { count: 'exact' })

  if (sp.status)          query = query.eq('status', sp.status as AppointmentRow['status'])
  if (sp.service_id)      query = query.eq('service_id', sp.service_id)
  if (sp.practitioner_id) query = query.eq('practitioner_id', sp.practitioner_id)
  if (sp.date_from)       query = query.gte('appointment_date', sp.date_from)
  if (sp.date_to)         query = query.lte('appointment_date', sp.date_to)
  if (clientIds)          query = query.in('client_id', clientIds)
  if (paymentApptIds)     query = query.in('id', paymentApptIds)

  query = query
    .order('appointment_date', { ascending: dir === 'asc' })
    .order('start_time', { ascending: dir === 'asc' })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data: raw, count } = await query
  const total = count ?? 0

  const appointments: AppointmentListItem[] = (raw ?? []).map(r => {
    const c    = r.clients  as unknown as { full_name: string; email: string }
    const s    = r.services as unknown as { name: string }
    const u    = r.users    as unknown as { full_name: string } | null
    const pmts = r.payments as unknown as { status: string; amount_kobo: number }[] | null
    return {
      id: r.id,
      appointment_date: r.appointment_date,
      start_time: r.start_time,
      status: r.status,
      client:       { full_name: c.full_name, email: c.email },
      service:      { name: s.name },
      practitioner: { full_name: u?.full_name ?? '—' },
      payment:      pmts?.[0] ?? null,
    }
  })

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Appointments</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>
      <AppointmentTable
        appointments={appointments}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        services={services}
        practitioners={practitioners}
      />
    </div>
  )
}
