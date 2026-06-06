import type { Metadata } from 'next'
import Link from 'next/link'
import ServiceCard from '@/components/public/ServiceCard'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Service } from '@/lib/data/services'
import type { ServiceRow } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Our full menu of Laser Hair Reduction and Reformer Pilates offerings at Elroisè Wellness Center, Lekki Lagos.',
}

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)

function toService(row: ServiceRow): Service {
  return {
    id: row.slug,
    name: row.name,
    description: row.description ?? '',
    duration: `${row.duration_minutes} MIN`,
    price: fmt(row.single_price_naira),
    packagePrice: row.package_price_naira != null ? fmt(row.package_price_naira) : undefined,
    category: row.category,
  }
}

export default async function ServicesPage() {
  const supabase = getSupabaseServerClient()
  const { data: rows, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw new Error(error.message)

  const laserServices = (rows ?? []).filter(r => r.category === 'laser').map(toService)
  const pilatesServices = (rows ?? []).filter(r => r.category === 'pilates').map(toService)

  return (
    <div className="bg-bg min-h-screen">

      {/* Header */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-10 h-[1px] bg-gold" />
          <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold">
            Our Offerings
          </p>
        </div>
        <h1 className="text-5xl md:text-6xl serif italic mb-6 text-charcoal/90 leading-tight">
          Rituals, curated<br />for you.
        </h1>
        <p className="text-lg text-gray-500 font-light leading-loose max-w-xl">
          Every service at Elroisè is designed with precision, care, and a deep respect for
          your body and time.
        </p>
      </section>

      {/* Laser */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="flex items-baseline gap-5 mb-12 pb-6 border-b border-sand">
          <h2 className="text-3xl serif italic text-charcoal/80">Laser Hair Reduction</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {laserServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Pilates */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="flex items-baseline gap-5 mb-12 pb-6 border-b border-sand">
          <h2 className="text-3xl serif italic text-charcoal/80">Pilates Studio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pilatesServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-16 border border-sand text-center">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-bold">Begin Here</p>
          <h2 className="text-3xl serif italic mb-6 text-charcoal">
            Not sure where to begin?
          </h2>
          <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
            Our team is happy to help you choose the right ritual for your goals.
          </p>
          <Link
            href="/contact"
            className="bg-charcoal text-white px-10 py-4 text-[9px] uppercase tracking-[0.4em] font-bold hover:bg-gold transition-all duration-500 rounded-sm inline-block"
          >
            Get in Touch
          </Link>
        </div>
      </section>

    </div>
  )
}
