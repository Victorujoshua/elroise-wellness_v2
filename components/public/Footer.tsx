import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Location01Icon,
  CallIcon,
  Mail01Icon,
  NewTwitterIcon,
  Facebook01Icon,
  InstagramIcon as HugeInstagramIcon,
} from '@hugeicons/core-free-icons'

function InstagramIcon() {
  return (
    <HugeiconsIcon icon={HugeInstagramIcon} size={18} color="currentColor" strokeWidth={1.5} />
  )
}

function FacebookIcon() {
  return (
    <HugeiconsIcon icon={Facebook01Icon} size={18} color="currentColor" strokeWidth={1.5} />
  )
}

function TwitterIcon() {
  return (
    <HugeiconsIcon icon={NewTwitterIcon} size={18} color="currentColor" strokeWidth={1.5} />
  )
}

const QUICK_LINKS = [
  { name: 'Home',        path: '/' },
  { name: 'About',       path: '/about' },
  { name: 'Services',    path: '/services' },
  { name: 'Shop',        path: '/shop' },
  { name: 'Contact',     path: '/contact' },
  { name: 'My Bookings', path: '/my-bookings' },
]

const LEGAL_LINKS = [
  { name: 'Privacy Policy',   path: '/privacy' },
  { name: 'Terms of Service', path: '/terms' },
  { name: 'Refund Policy',    path: '/refund-policy' },
]

export default function Footer() {
  return (
    <footer className="bg-[#2D2926] py-16 md:py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16 md:mb-20">

          {/* Brand */}
          <div>
            <Link
              href="/"
              className="font-sora font-light tracking-[0.2em] text-white text-lg block mb-6 hover:opacity-70 transition-opacity duration-200"
            >
              ELROISÈ
            </Link>
            <p className="font-sora font-light text-sm text-white/70 leading-relaxed mb-8">
              Omnia flunnt. A luxury wellness sanctuary in the heart of Lekki.
            </p>
            <div className="flex gap-5 text-white/50">
              <a href="#" aria-label="Instagram" className="hover:text-white transition-colors duration-200">
                <InstagramIcon />
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-white transition-colors duration-200">
                <FacebookIcon />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-white transition-colors duration-200">
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-sora text-[10px] uppercase tracking-[0.3em] font-semibold text-white mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map(({ name, path }) => (
                <li key={path}>
                  <Link
                    href={path}
                    className="font-sora text-sm font-light text-white/70 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sora text-[10px] uppercase tracking-[0.3em] font-semibold text-white mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map(({ name, path }) => (
                <li key={path}>
                  <Link
                    href={path}
                    className="font-sora text-sm font-light text-white/70 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sora text-[10px] uppercase tracking-[0.3em] font-semibold text-white mb-6">
              Contact
            </h4>
            <div className="space-y-5 font-sora text-sm font-light text-white/70 leading-relaxed">
              <div className="flex items-start gap-3">
                <HugeiconsIcon icon={Location01Icon} size={16} color="currentColor" strokeWidth={1.5} className="shrink-0 mt-0.5 text-[#636B2F]" />
                <p>
                  8 Itumo Ogbonna Road,<br />
                  Lekki Phase 1, Lagos<br />
                  Nigeria
                </p>
              </div>
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={CallIcon} size={16} color="currentColor" strokeWidth={1.5} className="shrink-0 text-[#636B2F]" />
                <a href="tel:09076142845" className="hover:text-white transition-colors duration-200">09076142845</a>
              </div>
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={Mail01Icon} size={16} color="currentColor" strokeWidth={1.5} className="shrink-0 text-[#636B2F]" />
                <p className="break-all">Elroisèwellnesscenter@gmail.com</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sora text-[10px] text-white/50">
            © 2026 Elroisè Wellness Center. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link href="/privacy"       className="font-sora text-[10px] text-white/50 hover:text-white/80 transition-colors duration-200">Privacy</Link>
            <Link href="/terms"         className="font-sora text-[10px] text-white/50 hover:text-white/80 transition-colors duration-200">Terms</Link>
            <Link href="/refund-policy" className="font-sora text-[10px] text-white/50 hover:text-white/80 transition-colors duration-200">Refund Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
