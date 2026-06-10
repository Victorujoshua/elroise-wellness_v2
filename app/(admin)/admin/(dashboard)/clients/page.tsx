import { getSupabaseServiceClient } from '@/lib/supabase/server'
import ClientTable from '@/components/admin/clients/ClientTable'
import type { ClientRow } from '@/lib/database.types'

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const { q = '', page: rawPage = '1' } = await searchParams
  const page = Math.max(1, parseInt(rawPage, 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  const db  = getSupabaseServiceClient()
  const term = q.trim()

  let query = db
    .from('clients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (term) {
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    )
  }

  const { data, count } = await query
  const clients  = (data ?? []) as ClientRow[]
  const total    = count ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)

  return (
    <ClientTable
      clients={clients}
      total={total}
      pageCount={pageCount}
      q={term}
      page={page}
    />
  )
}
