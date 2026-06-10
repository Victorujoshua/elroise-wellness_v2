import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, Sparkles, ArrowRight, ChevronLeft } from 'lucide-react'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import ServiceViewTracker from './ServiceViewTracker'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from('services')
      .select('slug')
      .eq('is_active', true)
    return (data ?? []).map(r => ({ slug: r.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabaseServerClient()
  const { data: service } = await supabase
    .from('services')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!service) return { title: 'Service Not Found' }

  return {
    title: service.name,
    description:
      service.description ??
      `Book ${service.name} at Elroisè Wellness Center in Lekki, Lagos.`,
    openGraph: {
      images: [{ url: '/hero.jpeg', width: 1200, height: 630, alt: service.name }],
    },
  }
}

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = getSupabaseServerClient()

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!service) notFound()

  // Practitioners — returns empty until migration 0004 adds the anon-read policy on users
  const { data: links } = await supabase
    .from('practitioner_services')
    .select('practitioner_id')
    .eq('service_id', service.id)

  let practitioners: { id: string; full_name: string }[] = []
  if (links && links.length > 0) {
    const ids = links.map(l => l.practitioner_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', ids)
      .eq('is_active', true)
    practitioners = users ?? []
  }

  const isPilates = service.category === 'pilates'
  const categoryLabel = isPilates ? 'Pilates Ritual' : 'Laser Ritual'

  return (
    <div className="bg-bg min-h-screen">
      <ServiceViewTracker
        serviceName={service.name}
        serviceCategory={service.category}
        serviceSlug={service.slug}
      />
      <div className="max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* Back */}
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-charcoal/40 hover:text-gold transition-colors mb-16"
        >
          <ChevronLeft size={14} />
          All Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16 items-start">

          {/* Left — service info */}
          <div>
            {/* Eyebrow row */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-gold">
                <Sparkles size={14} />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {categoryLabel}
                </span>
              </div>
              <div className="w-[1px] h-4 bg-charcoal/15" />
              <div className="flex items-center gap-2 text-charcoal/40">
                <Clock size={14} />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {service.duration_minutes} min
                </span>
              </div>
            </div>

            {/* Name */}
            <h1 className="text-5xl md:text-6xl serif italic mb-10 text-charcoal/90 leading-tight">
              {service.name}
            </h1>

            <div className="w-16 h-[1px] bg-gold/40 mb-10" />

            {/* Description */}
            <p className="text-lg text-gray-500 font-light leading-loose max-w-xl">
              {service.description}
            </p>

            {/* Practitioners — hidden when empty */}
            {practitioners.length > 0 && (
              <div className="mt-16 pt-16 border-t border-sand">
                <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40 mb-8">
                  Your Practitioners
                </p>
                <div className="flex flex-wrap gap-4">
                  {practitioners.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-white rounded-xl px-5 py-3 border border-sand"
                    >
                      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                        <span className="text-gold text-[11px] font-bold">
                          {p.full_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-charcoal">{p.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky pricing card */}
          <div className="lg:sticky lg:top-32">
            <div className="bg-white rounded-3xl border border-sand p-8 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40 mb-8">
                Pricing
              </p>

              {/* Single */}
              <div className="pb-6 border-b border-sand mb-6">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">
                  Single Session
                </span>
                <span className="text-4xl serif italic text-charcoal">
                  ₦{fmt(service.single_price_naira)}
                </span>
              </div>

              {/* Package */}
              {service.package_price_naira != null && service.package_session_count != null && (
                <div className="pb-8 border-b border-sand mb-8">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">
                    {service.package_session_count}-Session Package
                  </span>
                  <span className="text-4xl serif italic text-charcoal">
                    ₦{fmt(service.package_price_naira)}
                  </span>
                  <p className="text-[11px] text-gray-400 font-light mt-2">
                    ₦{fmt(Math.round(service.package_price_naira / service.package_session_count))} per session
                  </p>
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/book?service=${service.slug}`}
                className="flex items-center justify-center w-full p-5 bg-charcoal rounded-2xl text-[11px] uppercase tracking-[0.25em] font-bold text-white hover:bg-gold transition-all duration-500 group shadow-lg"
              >
                <span>Book Now</span>
                <ArrowRight
                  size={16}
                  className="ml-3 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
