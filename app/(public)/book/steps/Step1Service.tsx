import type { BookingService } from '../BookingFlow'

const fmt = (n: number) => new Intl.NumberFormat('en-NG').format(n)

function ServiceCard({
  service,
  onSelect,
}: {
  service: BookingService
  onSelect: () => void
}) {
  const isLaser = service.category === 'laser'
  return (
    <button
      onClick={onSelect}
      className="text-left w-full bg-white border border-charcoal/8 rounded-2xl p-6 hover:border-gold hover:shadow-lg transition-all duration-300 group flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[8px] uppercase tracking-[0.5em] font-bold mb-2 ${isLaser ? 'text-gold' : 'text-emerald-600'}`}>
            {isLaser ? 'Laser Hair Reduction' : 'Pilates Studio'}
          </p>
          <h3 className="text-lg font-light text-charcoal group-hover:text-gold transition-colors duration-200">
            {service.name}
          </h3>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-charcoal/40 font-medium shrink-0 mt-1">
          {service.duration_minutes} min
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-light serif italic text-charcoal">
          ₦{fmt(service.single_price_naira)}
        </span>
        <span className="text-[9px] text-charcoal/40 uppercase tracking-widest">/ session</span>
      </div>

    </button>
  )
}

export default function Step1Service({
  services,
  onSelect,
}: {
  services: BookingService[]
  onSelect: (service: BookingService) => void
}) {
  const laser = services.filter(s => s.category === 'laser')
  const pilates = services.filter(s => s.category === 'pilates')
  const other = services.filter(s => s.category === 'other')

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">Step 1 of 5</p>
        <h1 className="text-3xl md:text-4xl font-light text-charcoal mb-2">
          Choose a <span className="serif italic text-gold">service</span>
        </h1>
        <p className="text-sm text-charcoal/50 font-light">
          Select the treatment you'd like to book.
        </p>
      </div>

      {services.length === 0 && (
        <p className="text-sm text-charcoal/40 font-light text-center py-20">
          Services unavailable — please try again shortly.
        </p>
      )}

      {laser.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[9px] uppercase tracking-[0.4em] text-charcoal/40 font-semibold mb-4">
            Laser Hair Reduction
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {laser.map(s => (
              <ServiceCard key={s.id} service={s} onSelect={() => onSelect(s)} />
            ))}
          </div>
        </div>
      )}

      {pilates.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[9px] uppercase tracking-[0.4em] text-charcoal/40 font-semibold mb-4">
            Pilates Studio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pilates.map(s => (
              <ServiceCard key={s.id} service={s} onSelect={() => onSelect(s)} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h2 className="text-[9px] uppercase tracking-[0.4em] text-charcoal/40 font-semibold mb-4">
            Other Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {other.map(s => (
              <ServiceCard key={s.id} service={s} onSelect={() => onSelect(s)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
