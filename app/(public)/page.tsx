import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import ServiceCard from '@/components/public/ServiceCard'
import { featuredServices } from '@/lib/data/services'

export const metadata: Metadata = {
  title: "Lagos' Premier Pilates & Laser Hair Removal Studio",
  description:
    'Where light meets the art of motion. Premium Reformer Pilates and Laser Hair Reduction in Lekki, Lagos.',
}

export default function HomePage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="relative h-screen overflow-hidden bg-bg flex flex-col">
        <div className="flex flex-1 pt-[72px]">
          {/* Left text */}
          <div className="flex flex-col justify-center px-10 md:px-16 lg:px-20 w-full lg:w-[52%] relative z-10">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-10 h-[1px] bg-gold" />
              <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold">
                Omnia Flunnt — Everything Flows
              </p>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.08] mb-8 text-charcoal font-light fade-in">
              Where <span className="italic serif text-gold">light</span> meets
              <br />the art of <span className="italic serif text-charcoal">motion.</span>
            </h1>
            <div className="w-16 h-[1px] bg-gold/40 mb-8" />
            <p className="text-sm md:text-[15px] text-charcoal/55 mb-12 max-w-sm font-light leading-loose tracking-wide">
              Lagos&apos; premier sanctuary for Laser Hair Reduction and Reformer Pilates. Precision.
              Grace. You.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <Link
                href="/booking"
                className="bg-charcoal text-white px-10 py-4 text-[9px] uppercase tracking-[0.4em] font-bold hover:bg-gold transition-all duration-500 rounded-sm"
              >
                Book a Session
              </Link>
              <Link
                href="/services"
                className="flex items-center space-x-3 text-[9px] uppercase tracking-[0.4em] font-bold text-charcoal/50 hover:text-gold transition-colors duration-300 group"
              >
                <span>Explore Rituals</span>
                <span className="w-6 h-[1px] bg-charcoal/30 group-hover:bg-gold group-hover:w-10 transition-all duration-500 inline-block" />
              </Link>
            </div>
          </div>

          {/* Right image */}
          <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden items-center justify-center p-8">
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/hero.jpeg"
                fill
                className="object-cover scale-105 hover:scale-100 transition-transform duration-[10s]"
                alt="Elroisè Reformer Pilates Studio"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute inset-4 border border-gold/30 rounded-2xl pointer-events-none z-10" />
              <div className="absolute bottom-8 left-8 z-20 bg-white/85 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg">
                <p className="text-[8px] uppercase tracking-[0.4em] text-gold font-semibold mb-0.5">
                  Est. Lagos
                </p>
                <p className="text-xs text-charcoal font-light">Premium Wellness Sanctuary</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-bg/50 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-charcoal/10 bg-white/60 backdrop-blur-sm px-10 md:px-20 py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-10 md:space-x-16">
              <div>
                <p className="text-xl md:text-2xl font-light text-charcoal">5+</p>
                <p className="text-[8px] uppercase tracking-[0.3em] text-charcoal/40 mt-0.5">
                  Years of Excellence
                </p>
              </div>
              <div className="w-[1px] h-7 bg-charcoal/15" />
              <div>
                <p className="text-xl md:text-2xl font-light text-charcoal">2</p>
                <p className="text-[8px] uppercase tracking-[0.3em] text-charcoal/40 mt-0.5">
                  Signature Studios
                </p>
              </div>
              <div className="w-[1px] h-7 bg-charcoal/15" />
              <div>
                <p className="text-xl md:text-2xl font-light text-charcoal">∞</p>
                <p className="text-[8px] uppercase tracking-[0.3em] text-charcoal/40 mt-0.5">
                  Rituals Offered
                </p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center space-y-2">
              <div className="w-[1px] h-8 bg-gradient-to-b from-charcoal/30 to-transparent animate-pulse" />
              <p className="text-[7px] uppercase tracking-[0.5em] text-charcoal/30">Scroll</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <section className="py-24 md:py-40 px-6 max-w-7xl mx-auto">
        {/* Pilates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <div className="order-2 lg:order-1">
            <p className="text-gold text-xs uppercase tracking-widest mb-6 font-bold">
              The Pilates Studio
            </p>
            <h2 className="text-3xl md:text-5xl serif mb-8 leading-tight italic text-charcoal/90">
              Mindful movement, <br />redefined.
            </h2>
            <p className="text-lg text-gray-500 font-light leading-loose mb-12">
              Our Reformer Pilates sessions are designed to build long, lean muscle and core
              stability. In our sanctuary, movement is a ritual of strength and grace.
            </p>
            <Link
              href="/services"
              className="text-[10px] uppercase tracking-[0.3em] font-bold border-b border-gold pb-2 hover:text-gold transition-colors"
            >
              Explore Pilates
            </Link>
          </div>
          <div className="order-1 lg:order-2 relative rounded-2xl overflow-hidden shadow-2xl h-[600px]">
            <Image
              src="/pilates.jpeg"
              fill
              className="object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-1000"
              alt="Pilates Reformer Session"
            />
          </div>
        </div>

        {/* Laser */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[600px]">
            <Image
              src="/laser.jpeg"
              fill
              className="object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-1000"
              alt="Laser Hair Reduction Treatment"
            />
          </div>
          <div>
            <p className="text-gold text-xs uppercase tracking-widest mb-6 font-bold">
              Laser Precision
            </p>
            <h2 className="text-3xl md:text-5xl serif mb-8 leading-tight italic text-charcoal/90">
              Silky smooth, <br />permanently.
            </h2>
            <p className="text-lg text-gray-500 font-light leading-loose mb-12">
              Experience the gold standard in hair reduction. Our advanced laser technology ensures
              comfort and precision for all skin types, revealing your most radiant self.
            </p>
            <Link
              href="/services"
              className="text-[10px] uppercase tracking-[0.3em] font-bold border-b border-gold pb-2 hover:text-gold transition-colors"
            >
              Explore Laser
            </Link>
          </div>
        </div>
      </section>

      {/* Image strip */}
      <section className="flex overflow-hidden h-64 md:h-80 w-full opacity-80">
        {['/strip-1.jpeg', '/strip-2.jpeg', '/strip-3.jpeg', '/strip-4.jpeg'].map((src, i) => (
          <div key={i} className="relative w-1/4 h-full overflow-hidden">
            <Image
              src={src}
              fill
              className="object-cover hover:scale-110 transition-transform duration-[3s]"
              alt="Ritual Texture"
            />
          </div>
        ))}
      </section>

      {/* Rituals section */}
      <section className="py-32 px-6 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20">
            <div className="max-w-xl">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-bold">Rituals</p>
              <h2 className="text-4xl md:text-6xl serif mb-6">
                Nurturing your <br />
                <span className="italic">inner landscape.</span>
              </h2>
            </div>
            <Link
              href="/services"
              className="text-[10px] uppercase tracking-widest font-bold mb-4 border-b border-sand pb-1 hover:border-gold transition-all"
            >
              View All Offerings
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {featuredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-40 overflow-hidden text-center text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=2070&auto=format&fit=crop"
            fill
            className="object-cover brightness-50"
            alt="Final CTA Background"
          />
        </div>
        <div className="relative z-10 px-6 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl serif mb-6">Return to yourself.</h2>
          <p className="text-xl md:text-2xl font-light italic mb-12 opacity-80">
            Begin your wellness flow today.
          </p>
          <Link
            href="/booking"
            className="bg-white text-charcoal px-12 py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gold hover:text-white transition-all duration-500 rounded-sm inline-block shadow-2xl"
          >
            Book Your Session
          </Link>
        </div>
      </section>
    </div>
  )
}
