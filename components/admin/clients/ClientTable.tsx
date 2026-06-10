'use client'

import { useRef, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Users, ArrowUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Type returned by get_clients_with_stats RPC
export type ClientWithStats = {
  id:                  string
  full_name:           string
  email:               string
  phone:               string
  notes:               string | null
  created_at:          string
  lifetime_bookings:   number
  lifetime_spend_kobo: number
  last_booking:        string | null
}

interface Props {
  clients:   ClientWithStats[]
  total:     number
  pageCount: number
  q:         string
  page:      number
  sort:      string
  dir:       string
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ClientTable({ clients, total, pageCount, q, page, sort, dir }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const pushParams = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const val = inputRef.current?.value.trim() ?? ''
    pushParams({ q: val, page: null })
  }

  function handleSort(col: string) {
    const newDir = sort === col && dir === 'asc' ? 'desc' : 'asc'
    pushParams({ sort: col, dir: newDir, page: null })
  }

  function SortHeader({ col, label, className }: { col: string; label: string; className?: string }) {
    const active = sort === col
    return (
      <th className={cn('px-4 py-2.5 text-left', className)}>
        <button
          onClick={() => handleSort(col)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          {label}
          <ArrowUpDown className={cn('size-3', active ? 'text-foreground' : 'opacity-40')} />
        </button>
      </th>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold leading-tight">Clients</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} client{total !== 1 ? 's' : ''}
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              defaultValue={q}
              placeholder="Name, email or phone…"
              className="h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm w-64 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">Search</Button>
          {q && (
            <Button type="button" size="sm" variant="ghost"
              onClick={() => pushParams({ q: null, page: null })}>
              <X className="size-3 mr-1" /> Clear
            </Button>
          )}
        </form>
      </div>

      {/* Table */}
      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-charcoal/20 py-16 text-center">
          <Users className="size-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {q ? 'No clients match that search.' : 'No clients yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <SortHeader col="full_name" label="Name" />
                <SortHeader col="email"     label="Email"    className="hidden sm:table-cell" />
                <SortHeader col="phone"     label="Phone"    className="hidden md:table-cell" />
                <SortHeader col="created_at" label="First seen" className="hidden lg:table-cell" />
                <SortHeader col="last_booking" label="Last booking" className="hidden lg:table-cell" />
                <SortHeader col="lifetime_bookings" label="Visits" className="hidden xl:table-cell" />
                <SortHeader col="lifetime_spend_kobo" label="Spend" className="hidden xl:table-cell" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map(client => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/admin/clients/${client.id}`)}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{client.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{client.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{client.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{fmtDate(client.created_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {client.last_booking ? fmtDate(client.last_booking) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                    {client.lifetime_bookings}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {client.lifetime_spend_kobo > 0
                      ? <span className="font-medium">₦{Math.floor(client.lifetime_spend_kobo / 100).toLocaleString()}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pageCount}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" disabled={page <= 1}
              onClick={() => pushParams({ page: String(page - 1) })} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={page >= pageCount}
              onClick={() => pushParams({ page: String(page + 1) })} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
