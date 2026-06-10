import type { Metadata } from 'next'
import { lookupBookingsByEmail, type BookingRecord } from './actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Bookings',
  description: 'Look up your Elroisè Wellness appointments by email address.',
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50  text-amber-700  border border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-charcoal/5 text-charcoal/50 border border-charcoal/10',
  cancelled: 'bg-red-50    text-red-500    border border-red-100',
  no_show:   'bg-red-50    text-red-500    border border-red-100',
}
const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show:   'No Show',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-[8px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${
        STATUS_STYLES[status] ?? 'bg-charcoal/5 text-charcoal/40'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function BookingCard({ booking, past }: { booking: BookingRecord; past: boolean }) {
  const isLaser = booking.service_category === 'laser'
  return (
    <div
      className={`bg-white rounded-2xl border p-6 transition-opacity ${
        past ? 'border-charcoal/6 opacity-60' : 'border-charcoal/8'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p
            className={`text-[8px] uppercase tracking-[0.4em] font-bold mb-1 ${
              isLaser ? 'text-gold' : 'text-emerald-600'
            }`}
          >
            {isLaser ? 'Laser Hair Reduction' : 'Pilates Studio'}
          </p>
          <h3 className="text-base font-light text-charcoal">{booking.service_name}</h3>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="space-y-1.5 text-sm font-light text-charcoal/55">
        <p>{formatDate(booking.appointment_date)}</p>
        <p>
          {booking.start_time.slice(0, 5)} — {booking.end_time.slice(0, 5)}
          <span className="text-charcoal/30 ml-2 text-xs">· {booking.duration_minutes} min</span>
        </p>
        <p>With {booking.practitioner_name}</p>
      </div>

      {booking.pricing_tier === 'package' && (
        <p className="text-[9px] uppercase tracking-widest text-gold font-semibold mt-3">
          Package booking
        </p>
      )}
    </div>
  )
}

function LookupForm({ defaultEmail }: { defaultEmail: string }) {
  return (
    <form method="GET" action="/my-bookings" className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        name="email"
        required
        defaultValue={defaultEmail}
        placeholder="your@email.com"
        className="flex-1 border border-charcoal/15 rounded-lg px-4 py-3 text-sm font-light text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-gold transition-colors bg-white"
      />
      <button
        type="submit"
        className="px-8 py-3 bg-charcoal text-white text-[9px] uppercase tracking-[0.4em] font-bold rounded-lg hover:bg-gold transition-all duration-500 shrink-0"
      >
        Look up
      </button>
    </form>
  )
}

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email: rawEmail } = await searchParams
  const email = rawEmail?.trim() ?? ''

  let result: Awaited<ReturnType<typeof lookupBookingsByEmail>> | null = null
  if (email) {
    result = await lookupBookingsByEmail(email)
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = result?.success
    ? result.bookings.filter(
        b => b.appointment_date >= today && b.status !== 'cancelled' && b.status !== 'no_show',
      )
    : []
  const past = result?.success
    ? result.bookings.filter(
        b => b.appointment_date < today || b.status === 'cancelled' || b.status === 'no_show',
      )
    : []

  const resolvedEmail = result?.success ? result.email : email

  return (
    <div className="bg-bg min-h-screen pt-[72px]">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">
            Booking Lookup
          </p>
          <h1 className="text-3xl md:text-4xl font-light text-charcoal mb-2">
            My <span className="serif italic text-gold">Bookings</span>
          </h1>
          <p className="text-sm text-charcoal/50 font-light">
            Enter the email address used when you booked.
          </p>
        </div>

        <LookupForm defaultEmail={resolvedEmail} />

        {/* Validation error */}
        {result && !result.success && (
          <p className="mt-5 text-sm text-red-400 font-light">{result.error}</p>
        )}

        {/* No bookings found */}
        {result?.success && result.bookings.length === 0 && (
          <div className="mt-10 bg-white rounded-2xl border border-charcoal/8 p-10 text-center">
            <p className="text-sm text-charcoal/50 font-light mb-2">
              No bookings found for{' '}
              <span className="text-charcoal font-normal">{result.email}</span>
            </p>
            <p className="text-[10px] text-charcoal/30 font-light">
              Double-check the address, or{' '}
              <a href="/book" className="text-gold hover:underline">
                book a session
              </a>
              .
            </p>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mt-10">
            <p className="text-[9px] uppercase tracking-[0.4em] text-charcoal/40 font-semibold mb-4">
              Upcoming · {upcoming.length}
            </p>
            <div className="space-y-4">
              {upcoming.map(b => (
                <BookingCard key={b.id} booking={b} past={false} />
              ))}
            </div>
          </div>
        )}

        {/* Past & cancelled */}
        {past.length > 0 && (
          <div className="mt-10">
            <p className="text-[9px] uppercase tracking-[0.4em] text-charcoal/40 font-semibold mb-4">
              Past & Cancelled · {past.length}
            </p>
            <div className="space-y-4">
              {past.map(b => (
                <BookingCard key={b.id} booking={b} past />
              ))}
            </div>
          </div>
        )}

        {/* Phase 2 note */}
        {result?.success && result.bookings.length > 0 && (
          <p className="mt-12 text-[9px] text-charcoal/30 text-center font-light">
            To cancel or reschedule, please{' '}
            <a href="/contact" className="text-gold hover:underline">
              contact us
            </a>
            .
          </p>
        )}
      </div>
    </div>
  )
}
