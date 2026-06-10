import type { PractitionerSlots } from '@/lib/availability'
import type { BookingService } from '../BookingFlow'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2)
  return (
    <div className="w-10 h-10 rounded-full bg-charcoal/8 flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-charcoal/50 uppercase tracking-wide">{initials}</span>
    </div>
  )
}

export default function Step3Slot({
  service,
  date,
  availability,
  onSelect,
  onBack,
}: {
  service: BookingService
  date: string
  availability: PractitionerSlots[]
  onSelect: (practitioner: { id: string; name: string }, slot: string) => void
  onBack: () => void
}) {
  const hasSlots = availability.some(p => p.slots.length > 0)

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">Step 3 of 5</p>
        <h1 className="text-3xl md:text-4xl font-light text-charcoal mb-1">
          Choose a <span className="serif italic text-gold">time</span>
        </h1>
        <p className="text-sm text-charcoal/50 font-light">
          {service.name} · {formatDate(date)}
        </p>
      </div>

      {!hasSlots ? (
        <div className="bg-white rounded-2xl border border-charcoal/8 p-12 text-center">
          <p className="text-sm text-charcoal/50 font-light mb-6">
            No availability on this date.
          </p>
          <button
            onClick={onBack}
            className="text-[9px] uppercase tracking-widest text-gold font-semibold hover:text-charcoal transition-colors"
          >
            ← Choose another date
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {availability.map(p =>
            p.slots.length === 0 ? null : (
              <div key={p.practitioner_id} className="bg-white rounded-2xl border border-charcoal/8 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Avatar name={p.practitioner_name} />
                  <div>
                    <p className="text-sm font-light text-charcoal">{p.practitioner_name}</p>
                    <p className="text-[9px] uppercase tracking-widest text-charcoal/40 font-medium mt-0.5">
                      {p.slots.length} slot{p.slots.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() =>
                        onSelect({ id: p.practitioner_id, name: p.practitioner_name }, slot)
                      }
                      className="px-4 py-2 border border-charcoal/15 rounded-lg text-sm font-light text-charcoal hover:border-gold hover:text-gold hover:bg-gold/5 transition-all duration-200"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-10 text-[9px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors font-semibold"
      >
        ← Back
      </button>
    </div>
  )
}
