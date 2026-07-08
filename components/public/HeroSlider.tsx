'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'

const SLIDES = [
  { src: '/hero1.png', alt: 'Pilates session at Elroisè Wellness Center' },
  { src: '/hero2.png', alt: 'Reformer Pilates class at Elroisè Wellness Studio' },
  { src: '/hero3.png', alt: 'Group Pilates session at Elroisè Wellness Center' },
]

const INTERVAL_MS = 5000

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative w-full h-[80vh] min-h-[500px] overflow-hidden">

      {/* Slides — cross-fade via opacity */}
      {SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
          priority={i === 0}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Floating content card — stays fixed while images slide behind it */}
      <div className="absolute left-4 bottom-4 md:left-8 md:bottom-8 bg-white p-6 md:p-8 max-w-md shadow-sm z-10">
        <p className="text-xs uppercase tracking-wider text-[#2D2926] font-medium mb-3">
          New
        </p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-[#2D2926] leading-tight mb-3">
          Book a session
        </h1>
        <p className="text-sm text-[#2D2926] leading-relaxed mb-5">
          Lagos&apos; premier sanctuary for laser hair reduction and reformer Pilates.
        </p>
        <Link
          href="/book"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2D2926] hover:text-[#636B2F] transition-colors duration-200 group cursor-pointer"
        >
          Book now
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={14}
            color="currentColor"
            strokeWidth={2}
            className="transform group-hover:translate-x-0.5 transition-transform duration-200"
          />
        </Link>
      </div>

      {/* Dot / pill indicators — bottom-right */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex items-center gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === current ? 'bg-white w-5' : 'bg-white/50 w-1.5 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

    </section>
  )
}
