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

export default function Footer() {
  return (
    <footer className="bg-white pt-24 pb-12 px-6 border-t border-sand">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="text-2xl tracking-[0.3em] font-light text-charcoal mb-8 block"
            >
              ELROISÈ <span className="text-xs italic serif">EWC</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed font-light mb-8 italic">
              Omnia flunnt. A luxury wellness sanctuary in the heart of Lekki.
            </p>
            <div className="flex space-x-6 text-gray-400">
              <a href="#" className="hover:text-gold transition-colors" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="#" className="hover:text-gold transition-colors" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="#" className="hover:text-gold transition-colors" aria-label="Twitter">
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* Sanctuary */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-8 font-semibold">
              Sanctuary
            </h4>
            <ul className="space-y-4 text-xs uppercase tracking-widest font-medium">
              <li>
                <Link href="/about" className="hover:text-gold transition-colors">
                  Experience
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-gold transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-gold transition-colors">
                  Book Session
                </Link>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-8 font-semibold">
              Location
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              8 Itumo Ogbonna Road,<br />
              Lekki Phase 1, Lagos<br />
              Nigeria
            </p>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-8 font-semibold">
              Connect
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed font-light mb-2">
              08067014037
            </p>
            <p className="text-sm text-gray-500 font-light truncate">
              Elroisèwellnesscenter@gmail.com
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-12 border-t border-sand flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-[10px] uppercase tracking-widest text-gray-300">
          <p>© 2025 Elroisè Wellness Center. All Rights Reserved.</p>
          <div className="flex space-x-8">
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gold transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-gold transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
