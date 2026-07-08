'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/lib/cart'
import { trackEvent } from '@/lib/analytics'

const PRICE = 7500

const colorways = [
  {
    id: 'white',
    color: 'White',
    hex: '#F5F5F0',
    border: '#D9D4CC',
    description:
      'Crisp and clean. The perfect studio staple that pairs effortlessly with any Pilates fit.',
    image: '/socks-white.png',
    tag: 'Best Seller',
  },
  {
    id: 'black',
    color: 'Black',
    hex: '#2D2926',
    border: '#2D2926',
    description:
      'Sleek, timeless, effortless. Our most versatile colorway for the modern reformer.',
    image: '/socks-black.png',
    tag: 'Most Popular',
  },
  {
    id: 'khaki',
    color: 'Khaki',
    hex: '#C8B89A',
    border: '#B5A086',
    description:
      'Warm, earthy, refined. A nod to soft luxury and understated elegance on the reformer.',
    image: '/socks-khaki.png',
    tag: 'New Arrival',
  },
] as const

const sizes = ['XS / S', 'M / L', 'XL / XXL'] as const

const features = [
  'Non-slip silicone grip dots for reformer stability',
  'Premium combed cotton blend — breathable & soft',
  'Reinforced toe & heel for durability',
  'Embroidered Elroisè logo detail',
  'One-size-fits-most variants available',
]

const fmt = (n: number) => n.toLocaleString('en-US')

type Colorway = (typeof colorways)[number]

export default function ShopProduct() {
  const [selectedColor, setSelectedColor] = useState<Colorway>(colorways[0])
  const [selectedSize, setSelectedSize] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const handleAddToCart = () => {
    if (!selectedSize) return
    addItem({
      color: selectedColor.color,
      colorId: selectedColor.id,
      size: selectedSize,
      qty,
      price: PRICE,
    })
    trackEvent('shop_add_to_cart', {
      item_name: 'Elroisè Grip Socks',
      color: selectedColor.color,
      size: selectedSize,
      quantity: qty,
      value: PRICE * qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleColorSelect = (c: Colorway) => {
    setSelectedColor(c)
    setSelectedSize('')
    setQty(1)
  }

  return (
    <div className="bg-[#F9F6F2] pt-[72px] min-h-screen">

      {/* Page header */}
      <section className="py-16 px-8 md:px-20 border-b border-[#2D2926]/8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.5em] text-[#636B2F] font-semibold mb-3">
              The Boutique
            </p>
            <h1 className="text-4xl md:text-6xl font-light text-[#2D2926] leading-tight">
              Elroisè{' '}
              <span className="font-sora text-[#636B2F]">Grip Socks</span>
            </h1>
          </div>
          <button
            onClick={openCart}
            className="hidden md:flex items-center space-x-3 bg-[#2D2926] text-white px-6 py-3 rounded-sm hover:bg-[#636B2F] transition-colors duration-500 text-[10px] uppercase tracking-widest font-semibold"
          >
            <ShoppingBag size={16} />
            <span>View Cart</span>
          </button>
        </div>
      </section>

      {/* Product */}
      <section className="py-16 px-8 md:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Image */}
          <div>
            <div className="relative overflow-hidden aspect-[4/5]">
              <Image
                key={selectedColor.id}
                src={selectedColor.image}
                alt={`Elroisè ${selectedColor.color} grip socks`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-[8px] uppercase tracking-[0.4em] text-[#636B2F] font-bold">
                  {selectedColor.tag}
                </p>
              </div>
            </div>

            {/* Swatches */}
            <div className="flex items-center space-x-4 mt-6">
              {colorways.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleColorSelect(c)}
                  title={c.color}
                  aria-label={c.color}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    selectedColor.id === c.id
                      ? 'scale-110 ring-2 ring-[#636B2F] ring-offset-2'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex, borderColor: c.border }}
                />
              ))}
              <p className="text-xs text-[#2D2926]/50 font-light ml-2">
                {selectedColor.color}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-28">
            <p className="text-[9px] uppercase tracking-[0.5em] text-[#2D2926]/40 mb-3 font-semibold">
              Elroisè Wellness Center
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-[#2D2926] mb-2">
              Pilates Grip Socks —{' '}
              <span className="font-sora text-[#636B2F]">{selectedColor.color}</span>
            </h2>
            <p className="text-2xl font-light text-[#2D2926] mb-8">
              ₦{fmt(PRICE)}
            </p>

            <div className="w-12 h-[1px] bg-[#636B2F]/40 mb-8" />

            <p className="text-sm text-[#2D2926]/60 font-light leading-loose mb-10">
              {selectedColor.description}
            </p>

            <ul className="space-y-3 mb-10">
              {features.map((feat) => (
                <li
                  key={feat}
                  className="flex items-start space-x-3 text-sm text-[#2D2926]/65 font-light"
                >
                  <Check size={14} className="text-[#636B2F] mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            {/* Size */}
            <div className="mb-8">
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#2D2926]/50 font-semibold mb-4">
                Select Size
              </p>
              <div className="flex space-x-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-3 text-[9px] uppercase tracking-widest font-semibold border rounded-sm transition-all duration-300 ${
                      selectedSize === size
                        ? 'bg-[#2D2926] text-white border-[#2D2926]'
                        : 'bg-transparent text-[#2D2926]/60 border-[#2D2926]/20 hover:border-[#636B2F] hover:text-[#636B2F]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-[9px] text-[#636B2F]/70 mt-2 font-light">
                  Please select a size to continue
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-10">
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#2D2926]/50 font-semibold mb-4">
                Quantity
              </p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 border border-[#2D2926]/20 rounded-sm text-[#2D2926] hover:border-[#636B2F] hover:text-[#636B2F] transition-colors text-lg font-light"
                >
                  −
                </button>
                <span className="text-lg font-light text-[#2D2926] w-6 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 border border-[#2D2926]/20 rounded-sm text-[#2D2926] hover:border-[#636B2F] hover:text-[#636B2F] transition-colors text-lg font-light"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className={`w-full py-5 text-[10px] uppercase tracking-[0.4em] font-bold rounded-sm transition-all duration-500 flex items-center justify-center space-x-3 ${
                added
                  ? 'bg-green-600 text-white'
                  : selectedSize
                  ? 'bg-[#2D2926] text-white hover:bg-[#636B2F]'
                  : 'bg-[#2D2926]/20 text-[#2D2926]/40 cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check size={14} />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  <span>Add to Cart — ₦{fmt(PRICE * qty)}</span>
                </>
              )}
            </button>

            <p className="text-[9px] text-[#2D2926]/35 text-center mt-6 tracking-wide font-light">
              Hand wash cold · Do not tumble dry · Lay flat to dry
            </p>
          </div>
        </div>
      </section>

      {/* All colorways */}
      <section className="py-20 px-8 md:px-20 border-t border-[#2D2926]/8 max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-[9px] uppercase tracking-[0.5em] text-[#636B2F] font-semibold mb-3">
            The Collection
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-[#2D2926]">
            All <span className="font-sora">Colorways</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {colorways.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                handleColorSelect(c)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`text-left group border overflow-hidden transition-all duration-500 ${
                selectedColor.id === c.id
                  ? 'border-[#636B2F] shadow-lg'
                  : 'border-[#2D2926]/10 hover:border-[#636B2F]/40'
              }`}
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={c.image}
                  alt={c.color}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#2D2926]/40 font-semibold">
                    {c.tag}
                  </p>
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: c.hex, borderColor: c.border }}
                  />
                </div>
                <h3 className="text-lg font-light text-[#2D2926] mb-1">{c.color}</h3>
                <p className="text-sm text-[#2D2926]/50 font-light">₦{fmt(PRICE)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Size guide + care */}
      <section className="py-20 px-8 md:px-20 bg-white/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">

          {/* Size guide */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.5em] text-[#636B2F] font-semibold mb-4">
              Size Guide
            </p>
            <h3 className="text-2xl font-light text-[#2D2926] mb-8 font-sora">
              Find your fit.
            </h3>
            <table className="w-full text-sm font-light text-[#2D2926]/70">
              <thead>
                <tr className="border-b border-[#2D2926]/10">
                  {['Size', 'Shoe Size (EU)', 'Shoe Size (UK)'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[9px] uppercase tracking-widest py-3 text-[#2D2926]/40 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['XS / S', '35 – 38', '3 – 5'],
                  ['M / L', '39 – 42', '6 – 8'],
                  ['XL / XXL', '43 – 46', '9 – 11'],
                ].map(([size, eu, uk]) => (
                  <tr key={size} className="border-b border-[#2D2926]/8">
                    <td className="py-4 font-semibold text-[#2D2926]">{size}</td>
                    <td className="py-4">{eu}</td>
                    <td className="py-4">{uk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Care */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.5em] text-[#636B2F] font-semibold mb-4">
              Care Instructions
            </p>
            <h3 className="text-2xl font-light text-[#2D2926] mb-8 font-sora">
              Keep them pristine.
            </h3>
            <ul className="space-y-4">
              {[
                ['Hand wash or delicate machine cycle', '30°C / cold water only'],
                ['Do not bleach', 'Preserves the grip dots and colour'],
                ['Do not tumble dry', 'Lay flat on a clean towel'],
                ['Do not iron over grip dots', 'Iron inside-out on low heat only'],
                ['Store flat or rolled', 'Avoid hanging — preserves elasticity'],
              ].map(([instruction, note], i) => (
                <li
                  key={instruction}
                  className="flex items-start space-x-4 pb-4 border-b border-[#2D2926]/8"
                >
                  <span className="text-[9px] uppercase tracking-widest text-[#636B2F] font-bold mt-0.5 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-sm text-[#2D2926] font-light">{instruction}</p>
                    <p className="text-[11px] text-[#2D2926]/40 mt-0.5 font-light">{note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

    </div>
  )
}
