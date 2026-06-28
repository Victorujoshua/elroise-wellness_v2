'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PRODUCTS = [
  { name: 'Recovery Cream',    price: '₦12,500' },
  { name: 'Pilates Grip Socks', price: '₦7,500'  },
  { name: 'Sanctuary Candle',  price: '₦8,500'  },
  { name: 'Body Oil',          price: '₦14,500' },
]

const GAP     = 24 // px — gap-6
const VISIBLE = 3  // cards shown at once

export default function ProductSlider() {
  const [index, setIndex]         = useState(0)
  const [cardWidth, setCardWidth] = useState(0)
  const containerRef              = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const w = containerRef.current.offsetWidth
      setCardWidth((w - GAP * (VISIBLE - 1)) / VISIBLE)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const max    = PRODUCTS.length - VISIBLE
  const offset = -(index * (cardWidth + GAP))

  return (
    <div>
      {/* Header + nav arrows */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-sora text-4xl md:text-5xl text-[#2D2926] mb-3 leading-tight">
            Shop the Sanctuary
          </p>
          <p className="text-sm md:text-base text-[#2D2926]/70 mb-4">
            Thoughtfully curated products to extend your Elroisè ritual at home.
          </p>
          <Link
            href="/shop"
            className="text-sm font-medium text-[#2D2926] hover:text-[#636B2F] transition-colors duration-200"
          >
            Shop All ▸
          </Link>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous products"
            className="w-10 h-10 border border-[#2D2926] flex items-center justify-center text-[#2D2926] transition-colors duration-200 hover:bg-[#2D2926] hover:text-white disabled:opacity-25 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIndex(i => Math.min(max, i + 1))}
            disabled={index === max}
            aria-label="Next products"
            className="w-10 h-10 border border-[#2D2926] flex items-center justify-center text-[#2D2926] transition-colors duration-200 hover:bg-[#2D2926] hover:text-white disabled:opacity-25 disabled:pointer-events-none"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Slider track */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex"
          style={{
            gap: `${GAP}px`,
            transform: `translateX(${offset}px)`,
            transition: 'transform 0.5s ease-in-out',
          }}
        >
          {PRODUCTS.map((product) => (
            <Link
              key={product.name}
              href="/shop"
              className="group block shrink-0"
              style={{
                width: cardWidth > 0
                  ? `${cardWidth}px`
                  : `calc((100% - ${GAP * (VISIBLE - 1)}px) / ${VISIBLE})`,
              }}
            >
              <div className="relative aspect-square bg-[#F9F6F2] border border-[#E5E0D8] flex items-center justify-center overflow-hidden">
                <span className="font-sora text-[9px] uppercase tracking-wider text-[#A8A29E]">
                  Product Photo
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-[#2D2926] py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
                  <span className="font-sora text-[9px] uppercase tracking-[0.15em] text-white">Add to Cart</span>
                </div>
              </div>
              <p className="font-sora text-sm text-[#2D2926] mt-3 group-hover:text-[#636B2F] transition-colors duration-300">
                {product.name}
              </p>
              <p className="font-sora text-xs text-[#2D2926]/60 mt-1">{product.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
