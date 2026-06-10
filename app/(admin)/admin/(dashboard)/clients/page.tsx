import { getSupabaseServiceClient } from '@/lib/supabase/server'
import ClientTable from '@/components/admin/clients/ClientTable'
import type { ClientWithStats } from '@/components/admin/clients/ClientTable'

const PAGE_SIZE = 50

const ALLOWED_SORTS = [
  'full_name', 'email', 'phone', 'created_at',
  'last_booking', 'lifetime_bookings', 'lifetime_spend_kobo',
] as const

interface Props {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; dir?: string }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const sp   = await searchParams
  const q    = sp.q?.trim() ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const sort = ALLOWED_SORTS.includes(sp.sort as typeof ALLOWED_SORTS[number])
    ? sp.sort!
    : 'created_at'
  const dir  = sp.dir === 'asc' ? 'asc' : 'desc'

  const db = getSupabaseServiceClient()

  const { data: rows } = await db.rpc('get_clients_with_stats', {
    p_q:      q,
    p_sort:   sort,
    p_dir:    dir,
    p_limit:  PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  })

  const total     = Number(rows?.[0]?.row_count ?? 0)
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const clients   = (rows ?? []) as ClientWithStats[]

  return (
    <div className="p-6">
      <ClientTable
        clients={clients}
        total={total}
        pageCount={pageCount}
        q={q}
        page={page}
        sort={sort}
        dir={dir}
      />
    </div>
  )
}
