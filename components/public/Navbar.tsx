'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Shop', path: '/shop' },
  { name: 'Contact', path: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

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

        <Link
          href="/booking"
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
          <Link href="/booking" className="text-2xl serif italic text-gold">
            Book Session
          </Link>
        </div>
      )}
    </nav>
  )
}
