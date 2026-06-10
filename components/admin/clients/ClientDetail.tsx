'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Check, X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { updateClient } from '@/app/(admin)/admin/(dashboard)/clients/actions'

// ── exported prop types ───────────────────────────────────────────────────────

export type ClientAppt = {
  id:               string
  appointment_date: string
  start_time:       string
  end_time:         string
  status:           string
  service_name:     string
  practitioner_name: string
  payment_status:   string | null
  amount_kobo:      number | null
}

export type ClientCredit = {
  id:                 string
  service_name:       string
  sessions_purchased: number
  sessions_used:      number
  expires_at:         string | null
  created_at:         string
}

export type ClientOrder = {
  id:         string
  total_kobo: number
  status:     string
  created_at: string
  items:      unknown
}

export type ClientDetailProps = {
  client: {
    id:                  string
    full_name:           string
    email:               string
    phone:               string
    notes:               string | null
    created_at:          string
    lifetime_bookings:   number
    lifetime_spend_kobo: number
  }
  appointments: ClientAppt[]
  credits:      ClientCredit[]
  orders:       ClientOrder[]
}

// ── status styling ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-sky-100 text-sky-700',
  cancelled: 'bg-muted text-muted-foreground',
  no_show:   'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed',
  cancelled: 'Cancelled', no_show: 'No Show',
}
const PAY_BADGE: Record<string, string> = {
  success:  'bg-emerald-100 text-emerald-700',
  refunded: 'bg-purple-100 text-purple-700',
  pending:  'bg-amber-100 text-amber-700',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// ── edit form ─────────────────────────────────────────────────────────────────

const editSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone:     z.string().min(7, 'Phone number is too short'),
  notes:     z.string().optional(),
})
type EditData = z.infer<typeof editSchema>

// ── tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'appointments' | 'credits' | 'orders'

// ── component ─────────────────────────────────────────────────────────────────

export default function ClientDetail({ client: initial, appointments, credits, orders }: ClientDetailProps) {
  const router = useRouter()
  const [client, setClient]       = useState(initial)
  const [editing, setEditing]     = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('appointments')
  const [, startTransition]       = useTransition()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: client.full_name, phone: client.phone, notes: client.notes ?? '' },
  })

  function cancelEdit() {
    reset({ full_name: client.full_name, phone: client.phone, notes: client.notes ?? '' })
    setEditing(false)
  }

  function onSubmit(data: EditData) {
    startTransition(async () => {
      const res = await updateClient(client.id, data)
      if (!res.success) { toast.error(res.error); return }
      toast.success('Client updated')
      setClient(c => ({ ...c, ...data, notes: data.notes || null }))
      setEditing(false)
    })
  }

  const activeCredits    = credits.filter(c => c.sessions_used < c.sessions_purchased)
  const exhaustedCredits = credits.filter(c => c.sessions_used >= c.sessions_purchased)

  const tabCls = (t: Tab) => cn(
    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
    activeTab === t
      ? 'border-primary text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* ── Back + header ── */}
      <div className="flex flex-col gap-1">
        <Link
          href="/admin/clients"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-3" /> All clients
        </Link>
        <h2 className="text-lg font-semibold">{client.full_name}</h2>
        <p className="text-sm text-muted-foreground">{client.email}</p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Member since', value: fmtDate(client.created_at) },
          { label: 'Total visits',  value: String(client.lifetime_bookings) },
          { label: 'Lifetime spend', value: client.lifetime_spend_kobo > 0 ? `₦${Math.floor(client.lifetime_spend_kobo / 100).toLocaleString()}` : '—' },
          { label: 'Credits', value: activeCredits.length > 0 ? `${activeCredits.reduce((s, c) => s + (c.sessions_purchased - c.sessions_used), 0)} remaining` : 'None' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-semibold mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Client info card ── */}
      <div className="rounded-lg border bg-background">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client info</h3>
          {!editing && (
            <Button variant="ghost" size="sm" className="h-7 text-xs"
              onClick={() => setEditing(true)}>
              <Pencil className="size-3 mr-1" /> Edit
            </Button>
          )}
        </div>
        <div className="px-4 py-4">
          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-w-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Name</label>
                <input {...register('full_name')}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.full_name && <p className="text-xs text-destructive mt-0.5">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Phone</label>
                <input {...register('phone')}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.phone && <p className="text-xs text-destructive mt-0.5">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                <textarea {...register('notes')} rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Check className="size-3 mr-1" />}
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={isSubmitting} onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-1.5 text-sm">
              {[
                ['Email', client.email],
                ['Phone', client.phone],
                ['Notes', client.notes ?? null],
              ].filter(([, v]) => v !== null).map(([k, v]) => (
                <div key={String(k)} className="flex gap-3">
                  <dt className="w-14 shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="text-foreground whitespace-pre-wrap break-all">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* ── Tabbed history ── */}
      <div className="rounded-lg border bg-background">
        <div className="border-b flex">
          <button className={tabCls('appointments')} onClick={() => setActiveTab('appointments')}>
            Appointments <span className="ml-1 text-xs text-muted-foreground">({appointments.length})</span>
          </button>
          <button className={tabCls('credits')} onClick={() => setActiveTab('credits')}>
            Credits <span className="ml-1 text-xs text-muted-foreground">({credits.length})</span>
          </button>
          <button className={tabCls('orders')} onClick={() => setActiveTab('orders')}>
            Orders <span className="ml-1 text-xs text-muted-foreground">({orders.length})</span>
          </button>
        </div>

        <div className="p-4">

          {/* Appointments tab */}
          {activeTab === 'appointments' && (
            appointments.length === 0
              ? <p className="text-sm text-muted-foreground py-4 text-center">No appointments yet.</p>
              : <div className="space-y-2">
                  {appointments.map(a => (
                    <Link
                      key={a.id}
                      href={`/admin/appointments/${a.id}`}
                      className={cn(
                        'block rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/20 transition-colors',
                        a.status === 'cancelled' && 'opacity-50',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{a.service_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmtDate(a.appointment_date)} · {fmtTime(a.start_time)}–{fmtTime(a.end_time)} · with {a.practitioner_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {a.payment_status && (
                            <span className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                              PAY_BADGE[a.payment_status] ?? 'bg-muted text-muted-foreground',
                            )}>
                              {a.payment_status}
                            </span>
                          )}
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            STATUS_BADGE[a.status] ?? STATUS_BADGE.pending,
                          )}>
                            {STATUS_LABEL[a.status] ?? a.status}
                          </span>
                        </div>
                      </div>
                      {a.amount_kobo && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ₦{Math.floor(a.amount_kobo / 100).toLocaleString()}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
          )}

          {/* Credits tab */}
          {activeTab === 'credits' && (
            credits.length === 0
              ? <p className="text-sm text-muted-foreground py-4 text-center">No package credits.</p>
              : <div className="space-y-4">
                  {activeCredits.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Active</h4>
                      <div className="space-y-2">
                        {activeCredits.map(c => (
                          <CreditCard key={c.id} credit={c} />
                        ))}
                      </div>
                    </div>
                  )}
                  {exhaustedCredits.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Exhausted</h4>
                      <div className="space-y-2 opacity-60">
                        {exhaustedCredits.map(c => (
                          <CreditCard key={c.id} credit={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
          )}

          {/* Orders tab */}
          {activeTab === 'orders' && (
            orders.length === 0
              ? <p className="text-sm text-muted-foreground py-4 text-center">No shop orders.</p>
              : <div className="space-y-2">
                  {orders.map(o => (
                    <div key={o.id} className="rounded-lg border px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">₦{Math.floor(o.total_kobo / 100).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(o.created_at)}</p>
                        </div>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          o.status === 'paid'       ? 'bg-emerald-100 text-emerald-700' :
                          o.status === 'shipped'    ? 'bg-sky-100 text-sky-700' :
                          o.status === 'delivered'  ? 'bg-sky-100 text-sky-700' :
                                                      'bg-muted text-muted-foreground',
                        )}>
                          {o.status}
                        </span>
                      </div>
                      <OrderItems items={o.items} />
                    </div>
                  ))}
                </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function CreditCard({ credit }: { credit: ClientCredit }) {
  const remaining = credit.sessions_purchased - credit.sessions_used
  const pct       = (credit.sessions_used / credit.sessions_purchased) * 100
  return (
    <div className="rounded-lg border px-3 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{credit.service_name}</p>
        <p className="text-xs text-muted-foreground">
          {remaining}/{credit.sessions_purchased} remaining
        </p>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      {credit.expires_at && (
        <p className="text-xs text-muted-foreground mt-1">
          Expires {new Date(credit.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

function OrderItems({ items }: { items: unknown }) {
  if (!items || !Array.isArray(items) || items.length === 0) return null
  return (
    <ul className="mt-1.5 space-y-0.5">
      {(items as { name?: string; quantity?: number; price_naira?: number }[]).map((item, i) => (
        <li key={i} className="text-xs text-muted-foreground flex justify-between">
          <span>{item.name ?? 'Item'}{item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
          {item.price_naira && <span>₦{item.price_naira.toLocaleString()}</span>}
        </li>
      ))}
    </ul>
  )
}
