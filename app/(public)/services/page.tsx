import type { Metadata } from 'next'
import Link from 'next/link'
import ServiceCard from '@/components/public/ServiceCard'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Service } from '@/lib/data/services'
import type { ServiceRow } from '@/lib/database.types'
import { HugeiconsIcon } from '@hugeicons/react'
import { Yoga01Icon, MagicWand01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

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
    <div className="bg-[#F9F6F2] min-h-screen">

      {/* Header */}
      <section className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-px bg-[#636B2F]" />
          <p className="text-[8px] uppercase tracking-[0.5em] text-[#636B2F] font-semibold">
            Our Offerings
          </p>
        </div>
        <h1 className="text-4xl md:text-5xl font-sora mb-3 text-[#2D2926]/90 leading-tight">
          Rituals, curated<br />for you.
        </h1>
        <p className="text-sm text-gray-400 font-light leading-relaxed max-w-md">
          Every service at Elroisè is designed with precision, care, and a deep respect for your body and time.
        </p>
      </section>

      {/* Laser */}
      <section className="px-6 pb-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-7 pb-4 border-b border-[#E5E0D8]">
          <div className="w-8 h-8 bg-[#FDF8F0] border border-[#E5E0D8] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={MagicWand01Icon} size={16} color="#636B2F" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-sora text-[#2D2926]/80 leading-none">Laser Hair Reduction</h2>
            <p className="text-[9px] text-[#636B2F] uppercase tracking-widest font-medium mt-1">Gold-Standard Technology</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {laserServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Pilates */}
      <section className="px-6 pb-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-7 pb-4 border-b border-[#E5E0D8]">
          <div className="w-8 h-8 bg-[#F3F5EE] border border-[#E5E0D8] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={Yoga01Icon} size={16} color="#636B2F" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-sora text-[#2D2926]/80 leading-none">Pilates Studio</h2>
            <p className="text-[9px] text-[#636B2F] uppercase tracking-widest font-medium mt-1">Reformer & Private Sessions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pilatesServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="bg-white p-10 border border-[#E5E0D8] text-center">
          <p className="text-[#636B2F] text-[8px] uppercase tracking-widest mb-3 font-bold">Begin Here</p>
          <h2 className="text-2xl font-sora mb-3 text-[#2D2926]">Not sure where to begin?</h2>
          <p className="text-gray-400 text-sm font-light mb-6 max-w-sm mx-auto leading-relaxed">
            Our team is happy to help you choose the right ritual for your goals.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#2D2926] text-white px-8 py-3 text-[8px] uppercase tracking-[0.4em] font-bold hover:bg-[#636B2F] transition-all duration-300 rounded-sm"
          >
            Get in Touch
            <HugeiconsIcon icon={ArrowRight01Icon} size={11} color="currentColor" strokeWidth={2} />
          </Link>
        </div>
      </section>

    </div>
  )
}
