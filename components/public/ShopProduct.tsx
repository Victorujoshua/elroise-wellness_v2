'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/lib/cart'

const PRICE = 7500

const colorways = [
  {
    id: 'white',
    color: 'White',
    hex: '#F5F5F0',
    border: '#D9D4CC',
    description:
      'Crisp and clean. The perfect studio staple that pairs effortlessly with any Pilates fit.',
    image: '/socks-white.webp',
    tag: 'Best Seller',
  },
  {
    id: 'black',
    color: 'Black',
    hex: '#2D2926',
    border: '#2D2926',
    description:
      'Sleek, timeless, effortless. Our most versatile colorway for the modern reformer.',
    image: '/socks-black.webp',
    tag: 'Most Popular',
  },
  {
    id: 'khaki',
    color: 'Khaki',
    hex: '#C8B89A',
    border: '#B5A086',
    description:
      'Warm, earthy, refined. A nod to soft luxury and understated elegance on the reformer.',
    image: '/socks-khaki.webp',
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
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleColorSelect = (c: Colorway) => {
    setSelectedColor(c)
    setSelectedSize('')
    setQty(1)
  }

  return (
    <div className="bg-bg pt-[72px] min-h-screen">

      {/* Page header */}
      <section className="py-16 px-8 md:px-20 border-b border-charcoal/8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">
              The Boutique
            </p>
            <h1 className="text-4xl md:text-6xl font-light text-charcoal leading-tight">
              Elroisè{' '}
              <span className="italic serif text-gold">Grip Socks</span>
            </h1>
          </div>
          <button
            onClick={openCart}
            className="hidden md:flex items-center space-x-3 bg-charcoal text-white px-6 py-3 rounded-sm hover:bg-gold transition-colors duration-500 text-[10px] uppercase tracking-widest font-semibold"
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
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-xl">
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
                <p className="text-[8px] uppercase tracking-[0.4em] text-gold font-bold">
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
                      ? 'scale-110 ring-2 ring-gold ring-offset-2'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex, borderColor: c.border }}
                />
              ))}
              <p className="text-xs text-charcoal/50 font-light ml-2">
                {selectedColor.color}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-28">
            <p className="text-[9px] uppercase tracking-[0.5em] text-charcoal/40 mb-3 font-semibold">
              Elroisè Wellness Center
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-charcoal mb-2">
              Pilates Grip Socks —{' '}
              <span className="italic serif text-gold">{selectedColor.color}</span>
            </h2>
            <p className="text-2xl font-light text-charcoal mb-8">
              ₦{fmt(PRICE)}
            </p>

            <div className="w-12 h-[1px] bg-gold/40 mb-8" />

            <p className="text-sm text-charcoal/60 font-light leading-loose mb-10">
              {selectedColor.description}
            </p>

            <ul className="space-y-3 mb-10">
              {features.map((feat) => (
                <li
                  key={feat}
                  className="flex items-start space-x-3 text-sm text-charcoal/65 font-light"
                >
                  <Check size={14} className="text-gold mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            {/* Size */}
            <div className="mb-8">
              <p className="text-[9px] uppercase tracking-[0.4em] text-charcoal/50 font-semibold mb-4">
                Select Size
              </p>
              <div className="flex space-x-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={`px-5 py-3 text-[9px] uppercase tracking-widest font-semibold border rounded-sm transition-all duration-300 ${
                      selectedSize === size
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-transparent text-charcoal/60 border-charcoal/20 hover:border-gold hover:text-gold'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-[9px] text-gold/70 mt-2 font-light">
                  Please select a size to continue
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-10">
              <p className="text-[9px] uppercase tracking-[0.4em] text-charcoal/50 font-semibold mb-4">
                Quantity
              </p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 border border-charcoal/20 rounded-sm text-charcoal hover:border-gold hover:text-gold transition-colors text-lg font-light"
                >
                  −
                </button>
                <span className="text-lg font-light text-charcoal w-6 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 border border-charcoal/20 rounded-sm text-charcoal hover:border-gold hover:text-gold transition-colors text-lg font-light"
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
                  ? 'bg-charcoal text-white hover:bg-gold'
                  : 'bg-charcoal/20 text-charcoal/40 cursor-not-allowed'
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

            <p className="text-[9px] text-charcoal/35 text-center mt-6 tracking-wide font-light">
              Hand wash cold · Do not tumble dry · Lay flat to dry
            </p>
          </div>
        </div>
      </section>

      {/* All colorways */}
      <section className="py-20 px-8 md:px-20 border-t border-charcoal/8 max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-3">
            The Collection
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-charcoal">
            All <span className="italic serif">Colorways</span>
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
              className={`text-left group border rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl ${
                selectedColor.id === c.id
                  ? 'border-gold shadow-lg'
                  : 'border-charcoal/10 hover:border-gold/40'
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
                  <p className="text-xs uppercase tracking-[0.3em] text-charcoal/40 font-semibold">
                    {c.tag}
                  </p>
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: c.hex, borderColor: c.border }}
                  />
                </div>
                <h3 className="text-lg font-light text-charcoal mb-1">{c.color}</h3>
                <p className="text-sm text-charcoal/50 font-light">₦{fmt(PRICE)}</p>
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
            <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-4">
              Size Guide
            </p>
            <h3 className="text-2xl font-light text-charcoal mb-8 italic serif">
              Find your fit.
            </h3>
            <table className="w-full text-sm font-light text-charcoal/70">
              <thead>
                <tr className="border-b border-charcoal/10">
                  {['Size', 'Shoe Size (EU)', 'Shoe Size (UK)'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[9px] uppercase tracking-widest py-3 text-charcoal/40 font-semibold"
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
                  <tr key={size} className="border-b border-charcoal/8">
                    <td className="py-4 font-semibold text-charcoal">{size}</td>
                    <td className="py-4">{eu}</td>
                    <td className="py-4">{uk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Care */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.5em] text-gold font-semibold mb-4">
              Care Instructions
            </p>
            <h3 className="text-2xl font-light text-charcoal mb-8 italic serif">
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
                  className="flex items-start space-x-4 pb-4 border-b border-charcoal/8"
                >
                  <span className="text-[9px] uppercase tracking-widest text-gold font-bold mt-0.5 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-sm text-charcoal font-light">{instruction}</p>
                    <p className="text-[11px] text-charcoal/40 mt-0.5 font-light">{note}</p>
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
