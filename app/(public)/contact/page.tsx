import type { Metadata } from 'next'
import { MapPin, Clock, Phone, Mail } from 'lucide-react'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Visit Elroisè Wellness Center at Lekki Phase 1, Lagos. Get in touch to book a session or enquire about our services.',
}

function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function ContactPage() {
  return (
    <div className="bg-bg pt-32 min-h-screen">
      <section className="py-20 px-6 max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* Info */}
          <div className="fade-in">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-bold">Connect</p>
            <h1 className="text-5xl md:text-7xl serif mb-10 leading-tight italic">
              Visit the <br />Sanctuary.
            </h1>

            <div className="space-y-12 mt-16">
              <div className="flex items-start space-x-8">
                <MapPin className="text-gold mt-1 shrink-0" size={24} />
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Location
                  </h4>
                  <p className="text-lg font-light text-charcoal">
                    8 Itumo Ogbonna Road, Lekki Phase 1, Lagos
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-8">
                <Clock className="text-gold mt-1 shrink-0" size={24} />
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Hours
                  </h4>
                  <p className="text-lg font-light text-charcoal">Mon — Sat: 08:00 — 19:00</p>
                  <p className="text-lg font-light text-charcoal">Sun: By Appointment Only</p>
                </div>
              </div>

              <div className="flex items-start space-x-8">
                <Phone className="text-gold mt-1 shrink-0" size={24} />
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Inquiries
                  </h4>
                  <a
                    href="tel:08067014037"
                    className="text-lg font-light text-charcoal hover:text-gold transition-colors block"
                  >
                    08067014037
                  </a>
                  <a
                    href="mailto:elroisewellnesscenter@gmail.com"
                    className="text-lg font-light text-charcoal hover:text-gold transition-colors block"
                  >
                    elroisewellnesscenter@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-16 flex space-x-6">
              <a
                href="#"
                aria-label="Instagram"
                className="w-12 h-12 rounded-full border border-sand flex items-center justify-center text-charcoal hover:bg-gold hover:border-gold hover:text-white transition-all"
              >
                <InstagramIcon />
              </a>
              <a
                href="mailto:elroisewellnesscenter@gmail.com"
                aria-label="Email"
                className="w-12 h-12 rounded-full border border-sand flex items-center justify-center text-charcoal hover:bg-gold hover:border-gold hover:text-white transition-all"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white p-12 rounded-3xl shadow-2xl">
            <ContactForm />
          </div>

        </div>

        {/* Map */}
        <div className="mt-32 h-[500px] rounded-3xl overflow-hidden shadow-2xl grayscale contrast-125 opacity-70 hover:grayscale-0 transition-all duration-1000">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.724734509121!2d3.473531674483863!3d6.435835924255555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf45300f86289%3A0xc07f7f89d31d92d1!2sLekki%20Phase%201%2C%20Lagos!5e0!3m2!1sen!2sng!4v1715000000000!5m2!1sen!2sng"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="Elroisè Wellness Center Location"
          />
        </div>

      </section>
    </div>
  )
}
