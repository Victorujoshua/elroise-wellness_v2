import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Everything flows. At Elroisè Wellness Center, we believe that life is a continuous movement, and our bodies are the vessels through which this energy travels.',
}

export default function AboutPage() {
  return (
    <div className="bg-bg pt-32 min-h-screen">
      <section className="py-20 px-6 max-w-7xl mx-auto">
        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <div className="fade-in">
            <p className="text-gold text-xs uppercase tracking-widest mb-4">Our Essence</p>
            <h1 className="text-5xl md:text-7xl serif mb-10 leading-tight italic">Omnia Flunnt</h1>
            <p className="text-gray-500 text-lg font-light leading-relaxed mb-8">
              Everything flows. At Elroisè Wellness Center, we believe that life is a continuous
              movement, and our bodies are the vessels through which this energy travels.
            </p>
            <p className="text-gray-500 text-lg font-light leading-relaxed">
              Founded on the principles of soft luxury and sensual minimalism, our sanctuary was built
              to be a deep breath in a loud world. We don&apos;t believe in &quot;fixing&quot; the
              body; we believe in returning to it.
            </p>
          </div>
          <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/about.jpeg"
              fill
              className="object-cover grayscale-[30%]"
              alt="Atmosphere"
            />
          </div>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="p-12 bg-white rounded-2xl shadow-sm border border-sand">
            <h3 className="serif text-2xl mb-6 italic text-gold">The Space</h3>
            <p className="text-sm font-light text-gray-500 leading-relaxed">
              Designed with sand-colored palettes and stone textures, every corner of Elroisè is
              intentional. We provide silence for your eyes so your mind can follow.
            </p>
          </div>
          <div className="p-12 bg-charcoal text-white rounded-2xl shadow-sm">
            <h3 className="serif text-2xl mb-6 italic text-gold">The Flow</h3>
            <p className="text-sm font-light text-gray-400 leading-relaxed">
              Our movement philosophy is somatic. We focus on internal alignment and fluid power,
              ensuring every session feels organic rather than rigid.
            </p>
          </div>
          <div className="p-12 bg-white rounded-2xl shadow-sm border border-sand">
            <h3 className="serif text-2xl mb-6 italic text-gold">The Senses</h3>
            <p className="text-sm font-light text-gray-500 leading-relaxed">
              From the scent of aged sandalwood to the texture of premium linens, we engage every
              sense to facilitate a complete return to self.
            </p>
          </div>
        </div>

        {/* Quote */}
        <div className="text-center py-20 bg-sand/30 rounded-3xl mb-32">
          <h2 className="text-3xl md:text-5xl serif mb-8">
            &ldquo;Movement is gentle. <br />
            <span className="italic text-gold">Strength is refined.&rdquo;</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto italic font-light">
            Join us in the quiet. Join us in the flow.
          </p>
        </div>
      </section>
    </div>
  )
}
