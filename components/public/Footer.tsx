import Link from 'next/link'

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
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
            <p className="font-sora font-light text-sm text-white/70 leading-relaxed mb-8 italic">
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
            <div className="space-y-4 font-sora text-sm font-light text-white/70 leading-relaxed">
              <p>
                8 Itumo Ogbonna Road,<br />
                Lekki Phase 1, Lagos<br />
                Nigeria
              </p>
              <p>08067014037</p>
              <p className="break-all">Elroisèwellnesscenter@gmail.com</p>
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
