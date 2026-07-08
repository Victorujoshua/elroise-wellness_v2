'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/public/ui/Button'

const NAV_LINKS = [
  { name: 'Home',        path: '/' },
  { name: 'About',       path: '/about' },
  { name: 'Services',    path: '/services' },
  { name: 'Contact',     path: '/contact' },
  { name: 'My Bookings', path: '/my-bookings' },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white border-b border-[#2D2926]/10 shadow-sm py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="font-sora font-light tracking-[0.2em] text-[#2D2926] hover:opacity-70 transition-opacity duration-200 text-lg"
          >
            ELROISÈ
          </Link>

          {/* Center nav — desktop only */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ name, path }) => {
              const active = pathname === path
              return (
                <Link
                  key={path}
                  href={path}
                  className={`font-sora text-[10px] uppercase tracking-wide font-medium transition-colors duration-200 ${
                    active
                      ? 'text-[#636B2F] underline underline-offset-4'
                      : 'text-[#2D2926] hover:text-[#636B2F]'
                  }`}
                >
                  {name}
                </Link>
              )
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">

            {/* Book Session — desktop */}
            <div className="hidden md:block">
              <Button href="/book" variant="primary" size="sm">
                Book Session
              </Button>
            </div>

            {/* Hamburger — mobile */}
            <button
              className="md:hidden p-1 text-[#2D2926] hover:text-[#636B2F] transition-colors duration-200"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-white flex flex-col">

          {/* Menu header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#2D2926]/8">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="font-sora font-light tracking-[0.2em] text-[#2D2926] text-lg"
            >
              ELROISÈ
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="p-1 text-[#2D2926]"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* Nav links */}
          <div className="flex-1 flex flex-col justify-center px-8 gap-7">
            {NAV_LINKS.map(({ name, path }) => {
              const active = pathname === path
              return (
                <Link
                  key={path}
                  href={path}
                  onClick={() => setMenuOpen(false)}
                  className={`font-sora font-light text-3xl tracking-[0.04em] transition-colors duration-200 ${
                    active ? 'text-[#636B2F]' : 'text-[#2D2926] hover:text-[#636B2F]'
                  }`}
                >
                  {name}
                </Link>
              )
            })}
          </div>

          {/* Book Session */}
          <div className="px-8 pb-12 pt-6 border-t border-[#2D2926]/8">
            <Button href="/book" variant="primary" size="lg" className="w-full block text-center">
              Book Session
            </Button>
          </div>

        </div>
      )}
    </>
  )
}
