'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import ServiceDialog from './ServiceDialog'
import { toggleServiceActive } from '@/app/(admin)/admin/(dashboard)/services/actions'
import type {
  ServiceWithPractitioners,
  PractitionerOption,
} from '@/app/(admin)/admin/(dashboard)/services/actions'

const fmt = (n: number) =>
  '₦' + new Intl.NumberFormat('en-NG').format(n)

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    pilates: 'bg-teal-100 text-teal-700',
    laser: 'bg-amber-100 text-amber-700',
    other: 'bg-gray-100 text-gray-600',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
        styles[category] ?? styles.other,
      )}
    >
      {category}
    </span>
  )
}

interface Props {
  services: ServiceWithPractitioners[]
  practitioners: PractitionerOption[]
}

export default function ServiceTable({ services, practitioners }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pilates' | 'laser' | 'other'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithPractitioners | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filtered = services
    .filter(s =>
      search === '' || s.name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter(s => categoryFilter === 'all' || s.category === categoryFilter)
    .filter(s =>
      statusFilter === 'all' ||
      (statusFilter === 'active' ? s.is_active : !s.is_active),
    )

  function openAdd() {
    setEditingService(null)
    setDialogOpen(true)
  }

  function openEdit(service: ServiceWithPractitioners) {
    setEditingService(service)
    setDialogOpen(true)
  }

  function handleToggle(service: ServiceWithPractitioners) {
    setTogglingId(service.id)
    startTransition(async () => {
      const result = await toggleServiceActive(service.id, !service.is_active)
      setTogglingId(null)
      if (result.success) {
        toast.success(service.is_active ? 'Service deactivated' : 'Service activated')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 flex-1 min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
        <div className="flex gap-2 shrink-0">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="all">All categories</option>
            <option value="pilates">Pilates</option>
            <option value="laser">Laser</option>
            <option value="other">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="size-3.5" />
            Add new
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Category
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Duration
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Single price
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Package
                </th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Practitioners
                </th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Active
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {services.length === 0
                      ? 'No services yet. Add one to get started.'
                      : 'No services match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(service => (
                  <tr
                    key={service.id}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      !service.is_active && 'opacity-60',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{service.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={service.category} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {service.duration_minutes} min
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {fmt(service.single_price_naira)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {service.package_price_naira != null ? (
                        <span>
                          {fmt(service.package_price_naira)}
                          <span className="text-muted-foreground">
                            {' '}/ {service.package_session_count} sessions
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
                        {service.practitioner_ids.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() => handleToggle(service)}
                        disabled={togglingId === service.id}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(service)}
                        aria-label={`Edit ${service.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        service={editingService}
        practitioners={practitioners}
      />
    </>
  )
}
