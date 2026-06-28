import Image from 'next/image'
import type { Metadata } from 'next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Diamond01Icon, Yoga01Icon, Leaf01Icon } from '@hugeicons/core-free-icons'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Everything flows. At Elroisè Wellness Center, we believe that life is a continuous movement, and our bodies are the vessels through which this energy travels.',
}

export default function AboutPage() {
  return (
    <div className="bg-[#F9F6F2] pt-32 min-h-screen">
      <section className="py-20 px-6 max-w-7xl mx-auto">
        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <div className="fade-in">
            <p className="text-[#636B2F] text-xs uppercase tracking-widest mb-4">Our Essence</p>
            <h1 className="text-5xl md:text-7xl font-sora mb-10 leading-tight">Omnia Flunnt</h1>
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
          <div className="relative h-[600px] overflow-hidden">
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
          <div className="p-12 bg-white border border-[#E5E0D8] group hover:border-[#636B2F]/40 transition-colors duration-300">
            <div className="w-12 h-12 border border-[#E5E0D8] flex items-center justify-center mb-8 group-hover:border-[#636B2F]/40 transition-colors duration-300">
              <HugeiconsIcon icon={Diamond01Icon} size={22} color="#636B2F" strokeWidth={1.5} />
            </div>
            <h3 className="font-sora text-2xl mb-6 text-[#636B2F]">The Space</h3>
            <p className="text-sm font-light text-gray-500 leading-relaxed">
              Designed with sand-colored palettes and stone textures, every corner of Elroisè is
              intentional. We provide silence for your eyes so your mind can follow.
            </p>
          </div>
          <div className="p-12 bg-[#2D2926] text-white">
            <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-8">
              <HugeiconsIcon icon={Yoga01Icon} size={22} color="#636B2F" strokeWidth={1.5} />
            </div>
            <h3 className="font-sora text-2xl mb-6 text-[#636B2F]">The Flow</h3>
            <p className="text-sm font-light text-gray-400 leading-relaxed">
              Our movement philosophy is somatic. We focus on internal alignment and fluid power,
              ensuring every session feels organic rather than rigid.
            </p>
          </div>
          <div className="p-12 bg-white border border-[#E5E0D8] group hover:border-[#636B2F]/40 transition-colors duration-300">
            <div className="w-12 h-12 border border-[#E5E0D8] flex items-center justify-center mb-8 group-hover:border-[#636B2F]/40 transition-colors duration-300">
              <HugeiconsIcon icon={Leaf01Icon} size={22} color="#636B2F" strokeWidth={1.5} />
            </div>
            <h3 className="font-sora text-2xl mb-6 text-[#636B2F]">The Senses</h3>
            <p className="text-sm font-light text-gray-500 leading-relaxed">
              From the scent of aged sandalwood to the texture of premium linens, we engage every
              sense to facilitate a complete return to self.
            </p>
          </div>
        </div>

        {/* Quote */}
        <div className="text-center py-20 bg-[#F3EFEA]/30 mb-32">
          <h2 className="text-3xl md:text-5xl font-sora mb-8">
            &ldquo;Movement is gentle. <br />
            <span className="text-[#636B2F]">Strength is refined.&rdquo;</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto font-light">
            Join us in the quiet. Join us in the flow.
          </p>
        </div>
      </section>
    </div>
  )
}
