'use client'

import { useState, useTransition, useEffect } from 'react'
import { ChevronLeft, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createAdminBooking, getAvailabilityWithCapacity } from '@/app/(admin)/admin/(dashboard)/calendar/adminBookingActions'
import { searchClients, type ClientSearchResult } from '@/app/(admin)/admin/(dashboard)/clients/searchAction'
import type { PractitionerSlotsWithCapacity, SlotWithCapacity } from '@/lib/availability'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ServiceOption = {
  id:                    string
  name:                  string
  duration_minutes:      number
  single_price_naira:    number
  package_price_naira:   number | null
  package_session_count: number | null
}

type Step = 'find-client' | 'details' | 'slot' | 'payment' | 'done'
type PayMethod = 'cash' | 'pos' | 'paystack' | 'none'

type State = {
  step:               Step
  existingClientId:   string | null
  serviceId:          string
  date:               string
  name:               string
  email:              string
  phone:              string
  notes:              string
  availability:       PractitionerSlotsWithCapacity[]
  availError:         string | null
  pid:                string
  pName:              string
  slot:               string
  endTime:            string
  tier:               'single' | 'package'
  payMethod:          PayMethod
  bookError:          string | null
  apptId:             string
}

function mkInitial(defaultDate: string, services: ServiceOption[]): State {
  return {
    step:             'find-client',
    existingClientId: null,
    serviceId:        services[0]?.id ?? '',
    date:             defaultDate,
    name: '', email: '', phone: '', notes: '',
    availability: [],
    availError:   null,
    pid: '', pName: '', slot: '', endTime: '',
    tier:      'single',
    payMethod: 'cash',
    bookError: null,
    apptId:    '',
  }
}

const fmt = (n: number) => '₦' + new Intl.NumberFormat('en-NG').format(n)

function fmtDate(d: string) {
  const [y, mo, dd] = d.split('-').map(Number)
  return new Date(y, mo - 1, dd).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

const STEP_LABELS: Record<Step, string> = {
  'find-client': 'Step 1 of 4 — Find or add client',
  details:       'Step 2 of 4 — Details',
  slot:          'Step 3 of 4 — Select slot',
  payment:       'Step 4 of 4 — Payment',
  done:          'Booking created',
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  open:        boolean
  onClose:     () => void
  defaultDate: string
  services:    ServiceOption[]
}

export default function AddBookingSheet({ open, onClose, defaultDate, services }: Props) {
  const [state, setState] = useState<State>(() => mkInitial(defaultDate, services))

  useEffect(() => {
    if (open) setState(mkInitial(defaultDate, services))
  }, [open, defaultDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<State>) => setState(s => ({ ...s, ...patch }))

  const selectedService = services.find(s => s.id === state.serviceId)

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }} disablePointerDismissal>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between border-b px-5 py-3.5 shrink-0">
          <div>
            <SheetTitle className="text-base font-semibold">Add booking</SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{STEP_LABELS[state.step]}</p>
          </div>
          <SheetClose render={<Button variant="ghost" size="icon-sm" type="button" onClick={onClose} />}>
            <Plus className="size-4 rotate-45" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        {/* Selected-client chip */}
        {state.existingClientId && !['find-client', 'done'].includes(state.step) && (
          <div className="flex items-center gap-2 border-b bg-[#F9F6F2] px-5 py-2 text-xs shrink-0">
            <span className="text-muted-foreground">Booking for:</span>
            <span className="font-medium">{state.name}</span>
            <button
              type="button"
              onClick={() => set({
                step: 'find-client', existingClientId: null,
                name: '', email: '', phone: '',
              })}
              className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3" />
              deselect
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {state.step === 'find-client' && (
            <FindClientStep set={set} />
          )}
          {state.step === 'details' && (
            <DetailsStep state={state} set={set} services={services} />
          )}
          {state.step === 'slot' && (
            <SlotStep state={state} set={set} service={selectedService} />
          )}
          {state.step === 'payment' && (
            <PaymentStep state={state} set={set} service={selectedService} onClose={onClose} />
          )}
          {state.step === 'done' && (
            <DoneStep apptId={state.apptId} onClose={onClose} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Step 0: Find client ──────────────────────────────────────────────────────

function FindClientStep({ set }: { set: (p: Partial<State>) => void }) {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<ClientSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await searchClients(query)
        setResults(res)
      } catch (err) {
        console.error('[client-search] error:', err)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function handleClientSelected(client: ClientSearchResult) {
    set({
      existingClientId: client.id,
      name:             client.full_name,
      email:            client.email,
      phone:            client.phone,
      step:             'details',
    })
  }

  function handleAddNewClient() {
    set({ existingClientId: null, step: 'details' })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Search existing client</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone"
            className="pl-9"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <p className="text-xs text-muted-foreground">Type at least 2 characters</p>
      </div>

      <div className="min-h-[200px]">
        {isSearching && (
          <div className="text-sm text-muted-foreground">Searching…</div>
        )}

        {!isSearching && query.trim().length >= 2 && results.length === 0 && (
          <div className="text-sm text-muted-foreground">No matching clients found</div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            {results.map(client => (
              <ClientResultCard
                key={client.id}
                client={client}
                onSelect={() => handleClientSelected(client)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleAddNewClient}
        className="w-full py-3 border border-[#2D2926] rounded hover:bg-[#F9F6F2] transition-colors text-sm font-medium"
      >
        Add new client
      </button>
    </div>
  )
}

function ClientResultCard({
  client,
  onSelect,
}: {
  client:   ClientSearchResult
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left p-4 border border-input rounded hover:border-[#636B2F] hover:bg-[#F9F6F2] transition-colors"
    >
      <div className="font-medium text-sm">{client.full_name}</div>
      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
        <span>{client.email}</span>
        <span className="opacity-50">•</span>
        <span>{client.phone || 'No phone'}</span>
      </div>
      {client.last_visit_date && (
        <div className="text-xs text-muted-foreground mt-1">
          Last visit: {fmtDate(client.last_visit_date)}
        </div>
      )}
    </button>
  )
}

// ── Step 1: Details ───────────────────────────────────────────────────────────

function DetailsStep({
  state,
  set,
  services,
}: {
  state:    State
  set:      (p: Partial<State>) => void
  services: ServiceOption[]
}) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!state.serviceId)                       e.service = 'Select a service'
    if (!state.date)                            e.date    = 'Select a date'
    if (state.name.trim().length < 2)           e.name    = 'Name must be at least 2 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) e.email = 'Enter a valid email'
    if (state.phone.trim().length < 7)          e.phone   = 'Enter a valid phone number'
    return e
  }

  function handleCheck() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    startTransition(async () => {
      const res = await getAvailabilityWithCapacity(state.serviceId, state.date)
      if (!res.success) {
        set({ availError: res.error })
        return
      }
      set({ availability: res.data, availError: null, step: 'slot' })
    })
  }

  return (
    <div className="space-y-5">
      {/* Service */}
      <div className="space-y-1.5">
        <Label>Service *</Label>
        <Select value={state.serviceId} onValueChange={val => { if (val) set({ serviceId: val }) }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a service…">
              {services.find(s => s.id === state.serviceId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {services.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.service && <p className="text-xs text-destructive">{errors.service}</p>}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label>Date *</Label>
        <Input
          type="date"
          value={state.date}
          onChange={e => set({ date: e.target.value })}
          min={new Date().toISOString().slice(0, 10)}
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
      </div>

      <div className="border-t pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Client details
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Full name *</Label>
            <Input
              value={state.name}
              onChange={e => set({ name: e.target.value })}
              placeholder="e.g. Amaka Obi"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input
              type="email"
              value={state.email}
              onChange={e => set({ email: e.target.value })}
              placeholder="amaka@example.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Phone *</Label>
            <Input
              type="tel"
              value={state.phone}
              onChange={e => set({ phone: e.target.value })}
              placeholder="+234 800 000 0000"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input
              value={state.notes}
              onChange={e => set({ notes: e.target.value })}
              placeholder="Any notes for the practitioner…"
            />
          </div>
        </div>
      </div>

      {state.availError && (
        <p className="text-xs text-destructive">{state.availError}</p>
      )}

      <Button
        className="w-full"
        onClick={handleCheck}
        disabled={isPending}
      >
        {isPending ? 'Checking…' : 'Check availability →'}
      </Button>

      <button
        onClick={() => set({ step: 'find-client' })}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-3" />
        Back to search
      </button>
    </div>
  )
}

// ── Step 2: Slot ──────────────────────────────────────────────────────────────

function SlotStep({
  state,
  set,
  service,
}: {
  state:   State
  set:     (p: Partial<State>) => void
  service: ServiceOption | undefined
}) {
  function handleSelect(pid: string, pName: string, slot: SlotWithCapacity) {
    if (slot.is_full) return
    set({ step: 'payment', pid, pName, slot: slot.start_time, endTime: slot.end_time })
  }

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{service?.name}</span>
        {' · '}{fmtDate(state.date)}
      </div>

      {state.availability.length === 0 ? (
        <div className="border border-dashed border-[#2D2926]/20 py-10 text-center">
          <p className="text-sm text-muted-foreground">No availability for this date.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Check that practitioners have shifts set up for this day.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {state.availability.map(p => (
            <div key={p.practitioner_id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {p.practitioner_name}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.slots.map(slot => {
                  const isSelected = state.slot === slot.start_time && state.pid === p.practitioner_id
                  const isGroup    = slot.spots_total > 1
                  return (
                    <button
                      key={slot.start_time}
                      type="button"
                      disabled={slot.is_full}
                      onClick={() => handleSelect(p.practitioner_id, p.practitioner_name, slot)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors',
                        slot.is_full
                          ? 'border-input bg-muted text-muted-foreground/50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#2D2926] text-white border-[#2D2926]'
                          : 'border-input hover:border-[#2D2926]/40 hover:bg-muted',
                      )}
                    >
                      <span>{fmtTime(slot.start_time)}</span>
                      {isGroup && (
                        <span
                          className={cn(
                            'text-[10px] font-normal',
                            !slot.is_full && isSelected ? 'text-white/70' : 'text-muted-foreground',
                          )}
                        >
                          {slot.is_full ? '(Full)' : `${slot.spots_taken} of ${slot.spots_total} spots`}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => set({ step: 'details' })}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-3" />
        Back to details
      </button>
    </div>
  )
}

// ── Step 3: Payment ───────────────────────────────────────────────────────────

const PAY_METHODS: { value: PayMethod; label: string }[] = [
  { value: 'cash',     label: 'Cash' },
  { value: 'pos',      label: 'POS' },
  { value: 'paystack', label: 'Paystack' },
  { value: 'none',     label: 'Record later' },
]

function PaymentStep({
  state,
  set,
  service,
  onClose,
}: {
  state:   State
  set:     (p: Partial<State>) => void
  service: ServiceOption | undefined
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const hasPackage = !!(service?.package_price_naira && service?.package_session_count)
  const amount =
    state.tier === 'package' && hasPackage
      ? service!.package_price_naira!
      : (service?.single_price_naira ?? 0)

  async function submitBooking(paystackRef?: string) {
    if (!service) return
    const result = await createAdminBooking({
      service_id:         state.serviceId,
      service_name:       service.name,
      appointment_date:   state.date,
      start_time:         state.slot,
      end_time:           state.endTime,
      practitioner_id:    state.pid,
      pricing_tier:       state.tier,
      payment_method:     state.payMethod,
      paystack_reference: paystackRef,
      amount_naira:       amount,
      existing_client_id: state.existingClientId ?? undefined,
      client: {
        full_name: state.name,
        email:     state.email,
        phone:     state.phone,
        notes:     state.notes || undefined,
      },
    })
    if (result.success) {
      set({ step: 'done', apptId: result.appointmentId, bookError: null })
    } else {
      set({ bookError: result.error })
    }
  }

  function handleConfirm() {
    if (state.payMethod === 'paystack') {
      if (!window.PaystackPop) {
        set({ bookError: 'Payment system not ready. Please refresh.' })
        return
      }
      set({ bookError: null })
      const ref = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      window.PaystackPop.setup({
        key:      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email:    state.email,
        amount:   amount * 100,
        currency: 'NGN',
        ref,
        onSuccess(txn) {
          startTransition(() => submitBooking(txn.reference))
        },
        onCancel() {},
      }).openIframe()
    } else {
      startTransition(() => submitBooking())
    }
  }

  return (
    <div className="space-y-5">
      {/* Booking summary */}
      <div className="border p-4 space-y-2 text-sm bg-muted/30">
        <SummaryRow label="Service"      value={service?.name ?? '—'} />
        <SummaryRow label="Date"         value={fmtDate(state.date)} />
        <SummaryRow label="Time"         value={`${fmtTime(state.slot)} – ${fmtTime(state.endTime)}`} />
        <SummaryRow label="Practitioner" value={state.pName} />
        <SummaryRow label="Client"       value={state.name} />
      </div>

      {/* Pricing tier */}
      {hasPackage && (
        <div className="space-y-1.5">
          <Label>Pricing</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['single', 'package'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set({ tier: t })}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  state.tier === t
                    ? 'border-[#2D2926] bg-[#2D2926]/5 font-medium'
                    : 'border-input hover:border-[#2D2926]/30',
                )}
              >
                <p className="capitalize font-medium">{t}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t === 'package'
                    ? `${service!.package_session_count} sessions · ${fmt(service!.package_price_naira!)}`
                    : `1 session · ${fmt(service!.single_price_naira)}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment method */}
      <div className="space-y-1.5">
        <Label>Payment method</Label>
        <div className="grid grid-cols-2 gap-2">
          {PAY_METHODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set({ payMethod: value })}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm text-left transition-colors',
                state.payMethod === value
                  ? 'border-[#2D2926] bg-[#2D2926]/5 font-medium'
                  : 'border-input hover:border-[#2D2926]/30',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
        <span className="text-base font-semibold">{fmt(amount)}</span>
      </div>

      {state.bookError && (
        <p className="text-xs text-destructive">{state.bookError}</p>
      )}

      <Button
        className="w-full"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending
          ? 'Creating…'
          : state.payMethod === 'paystack'
          ? `Pay ${fmt(amount)}`
          : 'Create booking'}
      </Button>

      <button
        onClick={() => set({ step: 'slot', bookError: null })}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-3" />
        Back to slots
      </button>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

// ── Done ──────────────────────────────────────────────────────────────────────

function DoneStep({ apptId, onClose }: { apptId: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
      <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-100">
        <svg viewBox="0 0 24 24" fill="none" className="size-6 text-emerald-600">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 12.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold">Booking created</p>
        <p className="text-xs text-muted-foreground mt-1">
          Ref: {apptId.slice(0, 8).toUpperCase()}
        </p>
      </div>
      <Button variant="outline" onClick={onClose}>Done</Button>
    </div>
  )
}
