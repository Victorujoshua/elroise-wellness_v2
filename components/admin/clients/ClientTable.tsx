'use client'

import { useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ClientDrawer from './ClientDrawer'
import type { ClientRow } from '@/lib/database.types'

interface Props {
  clients:   ClientRow[]
  total:     number
  pageCount: number
  q:         string
  page:      number
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ClientTable({ clients, total, pageCount, q, page }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<ClientRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function navigate(params: { q?: string; page?: number }) {
    const sp = new URLSearchParams()
    const nextQ    = params.q    ?? q
    const nextPage = params.page ?? page
    if (nextQ)        sp.set('q',    nextQ)
    if (nextPage > 1) sp.set('page', String(nextPage))
    const qs = sp.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const val = inputRef.current?.value.trim() ?? ''
    navigate({ q: val, page: 1 })
  }

  function openDrawer(client: ClientRow) {
    setSelected(client)
    setDrawerOpen(true)
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    // Keep selected mounted briefly so the sheet close animation plays
    setTimeout(() => setSelected(null), 300)
  }

  function handleClientUpdated(updated: ClientRow) {
    // If the currently-selected client was just edited, update the local reference
    // so the drawer reflects the new values without waiting for RSC revalidation.
    if (selected?.id === updated.id) setSelected(updated)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold leading-tight">Clients</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total} client{total !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Search */}
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
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => navigate({ q: '', page: 1 })}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        {/* Table */}
        {clients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#2D2926]/20 py-16 text-center">
            <Users className="size-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {q ? 'No clients match that search.' : 'No clients yet.'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Member since</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => openDrawer(client)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{client.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{client.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{client.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{fmtDate(client.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => navigate({ page: page - 1 })}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= pageCount}
                onClick={() => navigate({ page: page + 1 })}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ClientDrawer
        client={selected}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onUpdated={handleClientUpdated}
      />
    </>
  )
}
