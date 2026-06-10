import type { Metadata } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import BookingFlow, { type BookingService } from './BookingFlow'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Book a Session',
  description:
    'Book your Pilates or Laser Hair Reduction session at Elroisè Wellness Center, Lagos.',
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>
}) {
  const { service: slug } = await searchParams

  const supabase = getSupabaseServerClient()
  const { data: rows } = await supabase
    .from('services')
    .select(
      'id, slug, name, category, duration_minutes, single_price_naira, package_price_naira, package_session_count',
    )
    .eq('is_active', true)
    .order('sort_order')

  const services: BookingService[] = (rows ?? []).map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    duration_minutes: r.duration_minutes,
    single_price_naira: r.single_price_naira,
    package_price_naira: r.package_price_naira,
    package_session_count: r.package_session_count,
  }))

  const initialService = slug ? (services.find(s => s.slug === slug) ?? null) : null

  return (
    <div className="bg-bg min-h-screen pt-[72px]">
      <BookingFlow services={services} initialService={initialService} />
    </div>
  )
}
