import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Section } from '@/components/public/ui/Section'
import ProductSlider from '@/components/public/ProductSlider'
import HeroSlider from '@/components/public/HeroSlider'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Yoga01Icon,
  MagicWand01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  UserGroupIcon,
  Diamond01Icon,
  Shield01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'

export const metadata: Metadata = {
  title: "Lagos' Premier Pilates & Laser Hair Removal Studio",
  description:
    'Premium Reformer Pilates and Laser Hair Reduction in Lekki, Lagos. Book your session today.',
}

export default function HomePage() {
  return (
    <div className="bg-[#F9F6F2] pt-[72px]">

      {/* ── 1. Announcement bar ─────────────────────────────────── */}
      <div className="bg-[#636B2F] py-2.5 px-6 text-center">
        <p className="font-sora text-[10px] uppercase tracking-[0.2em] text-white">
          Now booking sessions in Lekki —{' '}
          <Link href="/book" className="underline underline-offset-2 hover:no-underline">
            Book online
          </Link>
        </p>
      </div>

      {/* ── 2. Hero — auto-sliding image carousel */}
      <HeroSlider />

      {/* ── 2b. Services highlight ───────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E0D8] bg-white">

        {/* Pilates */}
        <Link href="/services" className="group px-8 md:px-12 lg:px-16 py-14 md:py-16 block cursor-pointer hover:bg-[#F9F6F2] transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-[#F3F5EE] flex items-center justify-center">
              <HugeiconsIcon icon={Yoga01Icon} size={16} color="#636B2F" strokeWidth={1.5} />
            </div>
            <p className="font-sora text-[10px] uppercase tracking-[0.25em] text-[#636B2F] font-medium">
              Studio
            </p>
          </div>
          <h2 className="font-sora text-3xl md:text-4xl font-light text-[#2D2926] leading-tight mb-4">
            Reformer Pilates
          </h2>
          <p className="text-sm text-[#2D2926]/60 leading-relaxed mb-8 max-w-sm">
            Build long, lean muscle and core stability in our private reformer studio. Movement as ritual — precise, intentional, transformative.
          </p>
          <span className="inline-flex items-center gap-2 font-sora text-[11px] uppercase tracking-[0.2em] font-medium text-[#2D2926] group-hover:text-[#636B2F] transition-colors duration-200">
            Explore Pilates
            <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="currentColor" strokeWidth={2} className="transform group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </Link>

        {/* Laser */}
        <Link href="/services" className="group px-8 md:px-12 lg:px-16 py-14 md:py-16 block cursor-pointer hover:bg-[#F9F6F2] transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-[#FDF8F0] flex items-center justify-center">
              <HugeiconsIcon icon={MagicWand01Icon} size={16} color="#636B2F" strokeWidth={1.5} />
            </div>
            <p className="font-sora text-[10px] uppercase tracking-[0.25em] text-[#636B2F] font-medium">
              Clinic
            </p>
          </div>
          <h2 className="font-sora text-3xl md:text-4xl font-light text-[#2D2926] leading-tight mb-4">
            Laser Hair Removal
          </h2>
          <p className="text-sm text-[#2D2926]/60 leading-relaxed mb-8 max-w-sm">
            Gold-standard laser technology for permanent hair reduction. Safe for all skin types, delivered with clinical precision in a private setting.
          </p>
          <span className="inline-flex items-center gap-2 font-sora text-[11px] uppercase tracking-[0.2em] font-medium text-[#2D2926] group-hover:text-[#636B2F] transition-colors duration-200">
            Explore Laser
            <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="currentColor" strokeWidth={2} className="transform group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </Link>

      </section>

      {/* ── 2c. Trust signals bar ─────────────────────────────────── */}
      <section className="bg-[#2D2926] py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: UserGroupIcon, label: '500+', sub: 'Clients Served', color: '#636B2F' },
            { icon: CheckmarkBadge01Icon, label: 'Expert', sub: 'Certified Practitioners', color: '#636B2F' },
            { icon: Diamond01Icon, label: 'Gold', sub: 'Standard Technology', color: '#636B2F' },
            { icon: Shield01Icon, label: 'Private', sub: 'Treatment Rooms', color: '#636B2F' },
          ].map(({ icon, label, sub, color }) => (
            <div key={label + sub} className="flex items-center gap-4">
              <HugeiconsIcon icon={icon} size={22} color={color} strokeWidth={1.5} className="shrink-0" />
              <div>
                <p className="font-sora text-sm font-semibold text-white">{label}</p>
                <p className="font-sora text-[10px] text-white/50 uppercase tracking-widest">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Intro ──────────────────────────────────────────────── */}
      <section className="relative px-6 md:px-16 lg:px-24 py-14 md:py-20 overflow-hidden">
        <Image
          src="/back.webp"
          alt="Wellness sanctuary"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-sora text-[48px] font-light text-white leading-[1.08] mb-6">
            Wellness With Intention
          </h2>
          <p className="text-sm md:text-base text-white/70 leading-relaxed mb-10 max-w-md">
            A considered collection of treatments and rituals designed to bring grace, precision,
            and care to your everyday.
          </p>
          <Link
            href="/about"
            className="inline-block bg-white text-[#2D2926] text-[11px] font-medium uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#F9F6F2] transition-colors duration-200"
          >
            About Us
          </Link>
        </div>
      </section>

      {/* ── 5. Best Sellers (hidden) ─────────────────────────────── */}
      {false && <Section background="white" className="py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left — atmospheric image */}
          <div className="aspect-[4/5] lg:aspect-auto lg:h-full bg-[#F9F6F2] border border-[#E5E0D8] flex items-center justify-center">
            <span className="font-sora text-[9px] uppercase tracking-wider text-[#A8A29E]">
              Atmospheric Product Photo
            </span>
          </div>

          {/* Right — text + cards */}
          <div className="flex flex-col">

            <p className="font-sora text-4xl md:text-5xl text-[#2D2926] mb-3 leading-tight">
              Best Sellers
            </p>
            <p className="text-sm md:text-base text-[#2D2926]/70 mb-4">
              Thoughtfully crafted essentials to extend your sanctuary ritual at home.
            </p>
            <Link
              href="/shop"
              className="self-start text-sm font-medium text-[#2D2926] hover:text-[#636B2F] transition-colors duration-200 mb-10"
            >
              Shop All ▸
            </Link>

            <div className="grid grid-cols-3 gap-4">

              <Link href="/shop" className="group block">
                <div className="relative aspect-square bg-[#F9F6F2] border border-[#E5E0D8] flex items-center justify-center overflow-hidden">
                  <span className="font-sora text-[9px] uppercase tracking-wider text-[#A8A29E]">
                    Product Photo
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-[#2D2926] py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
                    <span className="font-sora text-[9px] uppercase tracking-[0.15em] text-white">Add to Cart</span>
                  </div>
                </div>
                <p className="font-sora text-sm text-[#2D2926] mt-3 group-hover:text-[#636B2F] transition-colors duration-300">
                  Recovery Cream
                </p>
                <p className="font-sora text-xs text-[#2D2926]/60 mt-1">₦12,500</p>
              </Link>

              <Link href="/shop" className="group block">
                <div className="relative aspect-square bg-[#F9F6F2] border border-[#E5E0D8] flex items-center justify-center overflow-hidden">
                  <span className="font-sora text-[9px] uppercase tracking-wider text-[#A8A29E]">
                    Product Photo
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-[#2D2926] py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
                    <span className="font-sora text-[9px] uppercase tracking-[0.15em] text-white">Add to Cart</span>
                  </div>
                </div>
                <p className="font-sora text-sm text-[#2D2926] mt-3 group-hover:text-[#636B2F] transition-colors duration-300">
                  Pilates Grip Socks
                </p>
                <p className="font-sora text-xs text-[#2D2926]/60 mt-1">₦7,500</p>
              </Link>

              <Link href="/shop" className="group block">
                <div className="relative aspect-square bg-[#F9F6F2] border border-[#E5E0D8] flex items-center justify-center overflow-hidden">
                  <span className="font-sora text-[9px] uppercase tracking-wider text-[#A8A29E]">
                    Product Photo
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-[#2D2926] py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
                    <span className="font-sora text-[9px] uppercase tracking-[0.15em] text-white">Add to Cart</span>
                  </div>
                </div>
                <p className="font-sora text-sm text-[#2D2926] mt-3 group-hover:text-[#636B2F] transition-colors duration-300">
                  Sanctuary Candle
                </p>
                <p className="font-sora text-xs text-[#2D2926]/60 mt-1">₦8,500</p>
              </Link>

            </div>
          </div>

        </div>
      </Section>}

      {/* ── 9. Services Overview ─────────────────────────────────── */}
      <Section background="white" className="py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — atmospheric image */}
          <div className="aspect-[4/5] bg-[#F9F6F2] border border-[#E5E0D8] flex items-center justify-center">
            <span className="font-sora text-xs uppercase tracking-wider text-[#A8A29E]">
              Services Atmospheric Photo
            </span>
          </div>

          {/* Right — header + service list */}
          <div className="flex flex-col justify-center">

            <p className="font-sora text-4xl md:text-5xl text-[#2D2926] mb-3">
              Our Services
            </p>
            <p className="text-sm md:text-base text-[#2D2926]/70 leading-relaxed mb-4">
              A complete catalog of laser hair reduction and reformer Pilates treatments, available for online booking.
            </p>
            <Link
              href="/services"
              className="self-start inline-flex items-center gap-2 text-sm font-medium text-[#2D2926] hover:text-[#636B2F] transition-colors duration-200 mb-10 group cursor-pointer"
            >
              View All
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={2} className="transform group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>

            <div className="divide-y divide-[#E5E0D8]">
              {([
                { name: 'Reformer Pilates',       duration: '55 MIN', price: '₦20,000', href: '/services', cat: 'pilates' },
                { name: 'Pilates Private Session', duration: '60 MIN', price: '₦35,000', href: '/services', cat: 'pilates' },
                { name: 'Pilates Group Class',     duration: '50 MIN', price: '₦15,000', href: '/services', cat: 'pilates' },
                { name: 'Lower Face Laser',        duration: '30 MIN', price: '₦70,000', href: '/services', cat: 'laser' },
                { name: 'Brazilian Laser',         duration: '45 MIN', price: '₦95,000', href: '/services', cat: 'laser' },
                { name: 'Underarm Laser',          duration: '20 MIN', price: '₦30,000', href: '/services', cat: 'laser' },
              ] as const).map(service => (
                <Link
                  key={service.name}
                  href={service.href}
                  className="flex justify-between items-center py-3 md:py-4 -mx-2 px-2 hover:bg-[#F9F6F2] transition-colors duration-200 rounded group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon
                      icon={service.cat === 'pilates' ? Yoga01Icon : MagicWand01Icon}
                      size={14}
                      color={service.cat === 'pilates' ? '#636B2F' : '#636B2F'}
                      strokeWidth={1.5}
                      className="shrink-0"
                    />
                    <div>
                      <p className="text-base text-[#2D2926] group-hover:text-[#636B2F] transition-colors duration-200">
                        {service.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <HugeiconsIcon icon={Clock01Icon} size={10} color="#9CA3AF" strokeWidth={1.5} />
                        <p className="text-xs text-[#2D2926]/60">{service.duration}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-[#2D2926]">{service.price}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="currentColor" strokeWidth={1.5} className="text-[#2D2926]/40 group-hover:text-[#636B2F] transition-colors duration-200" />
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </Section>

      {/* ── 10. Shop the Sanctuary (hidden) ─────────────────────── */}
      {false && <Section background="white" className="py-20 md:py-24">
        <ProductSlider />
      </Section>}

    </div>
  )
}
