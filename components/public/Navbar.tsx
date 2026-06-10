'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Shop', path: '/shop' },
  { name: 'Contact', path: '/contact' },
  { name: 'My Bookings', path: '/my-bookings' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  const openCart = useCartStore((s) => s.openCart)
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0))

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${
        scrolled
          ? 'bg-bg/95 backdrop-blur-md py-5 shadow-sm'
          : 'bg-bg/80 backdrop-blur-sm py-5 border-b border-charcoal/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl tracking-[0.3em] font-light text-charcoal hover:opacity-70 transition-opacity"
        >
          ELROISÈ <span className="text-[10px] italic serif">EWC</span>
        </Link>

        <div className="hidden md:flex space-x-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-[10px] uppercase tracking-widest font-medium transition-colors ${
                pathname === link.path ? 'text-gold' : 'text-charcoal hover:text-gold'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Cart icon */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative p-1 text-charcoal hover:text-gold transition-colors"
          >
            <ShoppingBag size={20} />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full text-white text-[8px] flex items-center justify-center font-bold leading-none">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          <Link
            href="/book"
            className="hidden md:block text-[10px] uppercase tracking-widest border border-charcoal px-6 py-3 hover:bg-charcoal hover:text-white transition-colors font-medium"
          >
            Book Session
          </Link>

          <button
            className="md:hidden text-charcoal text-xl"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-bg px-8 py-6 flex flex-col space-y-6 border-t border-sand">
          {navLinks.map(link => (
            <Link
              key={link.path}
              href={link.path}
              className="text-2xl serif italic text-gold"
            >
              {link.name}
            </Link>
          ))}
          <Link href="/book" className="text-2xl serif italic text-gold">
            Book Session
          </Link>
        </div>
      )}
    </nav>
  )
}
