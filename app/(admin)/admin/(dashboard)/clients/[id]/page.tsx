import { notFound } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import ClientDetail from '@/components/admin/clients/ClientDetail'
import type { ClientDetailProps } from '@/components/admin/clients/ClientDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const db = getSupabaseServiceClient()

  // All queries in parallel
  const [clientRes, apptRes, creditsRes, ordersRes] = await Promise.all([
    db.from('clients').select('*').eq('id', id).single(),
    db
      .from('appointments')
      .select(`
        id, appointment_date, start_time, end_time, status, source, pricing_tier,
        services!inner(name),
        users!appointments_practitioner_id_fkey(full_name),
        payments(status, amount_kobo)
      `)
      .eq('client_id', id)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false }),
    db
      .from('client_credits')
      .select('id, sessions_purchased, sessions_used, expires_at, created_at, services!inner(name)')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('shop_orders')
      .select('id, total_kobo, status, created_at, items')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (clientRes.error || !clientRes.data) notFound()
  const client = clientRes.data

  // Compute lifetime stats from fetched appointments
  const appts = apptRes.data ?? []
  const lifetime_bookings = appts.filter(a => a.status !== 'cancelled').length
  const lifetime_spend_kobo = appts.reduce((sum, a) => {
    const pmts = a.payments as unknown as { status: string; amount_kobo: number }[] | null
    return sum + (pmts?.filter(p => p.status === 'success').reduce((s, p) => s + p.amount_kobo, 0) ?? 0)
  }, 0)

  const appointments: ClientDetailProps['appointments'] = appts.map(a => {
    const svc  = a.services as unknown as { name: string }
    const usr  = a.users    as unknown as { full_name: string } | null
    const pmts = a.payments as unknown as { status: string; amount_kobo: number }[] | null
    const pmt  = pmts?.[0] ?? null
    return {
      id:               a.id,
      appointment_date: a.appointment_date,
      start_time:       a.start_time,
      end_time:         a.end_time,
      status:           a.status,
      service_name:     svc.name,
      practitioner_name: usr?.full_name ?? '—',
      payment_status:   pmt?.status ?? null,
      amount_kobo:      pmt?.amount_kobo ?? null,
    }
  })

  const credits: ClientDetailProps['credits'] = (creditsRes.data ?? []).map(c => {
    const svc = c.services as unknown as { name: string }
    return {
      id:                 c.id,
      service_name:       svc.name,
      sessions_purchased: c.sessions_purchased,
      sessions_used:      c.sessions_used,
      expires_at:         c.expires_at,
      created_at:         c.created_at,
    }
  })

  const orders: ClientDetailProps['orders'] = (ordersRes.data ?? []).map(o => ({
    id:         o.id,
    total_kobo: o.total_kobo,
    status:     o.status,
    created_at: o.created_at,
    items:      o.items,
  }))

  const props: ClientDetailProps = {
    client: {
      id:                  client.id,
      full_name:           client.full_name,
      email:               client.email,
      phone:               client.phone,
      notes:               client.notes,
      created_at:          client.created_at,
      lifetime_bookings,
      lifetime_spend_kobo,
    },
    appointments,
    credits,
    orders,
  }

  return (
    <div className="p-6">
      <ClientDetail {...props} />
    </div>
  )
}
