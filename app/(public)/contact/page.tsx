import type { Metadata } from 'next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Location01Icon, Clock01Icon, CallIcon, Mail01Icon, InstagramIcon as HugeInstagramIcon } from '@hugeicons/core-free-icons'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Visit Elroisè Wellness Center at Lekki Phase 1, Lagos. Get in touch to book a session or enquire about our services.',
}

function InstagramIcon() {
  return <HugeiconsIcon icon={HugeInstagramIcon} size={20} color="currentColor" strokeWidth={1.5} />
}

export default function ContactPage() {
  return (
    <div className="bg-[#F9F6F2] pt-32 min-h-screen">
      <section className="py-20 px-6 max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* Info */}
          <div className="fade-in">
            <p className="text-[#636B2F] text-xs uppercase tracking-widest mb-4 font-bold">Connect</p>
            <h1 className="text-5xl md:text-7xl font-sora mb-10 leading-tight">
              Visit the <br />Sanctuary.
            </h1>

            <div className="space-y-12 mt-16">
              <div className="flex items-start space-x-8">
                <div className="w-12 h-12 border border-[#E5E0D8] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Location01Icon} size={22} color="#636B2F" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Location
                  </h4>
                  <p className="text-lg font-light text-[#2D2926]">
                    8 Itumo Ogbonna Road, Lekki Phase 1, Lagos
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-8">
                <div className="w-12 h-12 border border-[#E5E0D8] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Clock01Icon} size={22} color="#636B2F" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Hours
                  </h4>
                  <p className="text-lg font-light text-[#2D2926]">Mon — Sat: 08:00 — 19:00</p>
                  <p className="text-lg font-light text-[#2D2926]">Sun: By Appointment Only</p>
                </div>
              </div>

              <div className="flex items-start space-x-8">
                <div className="w-12 h-12 border border-[#E5E0D8] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={CallIcon} size={22} color="#636B2F" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                    Inquiries
                  </h4>
                  <a
                    href="tel:08067014037"
                    className="text-lg font-light text-[#2D2926] hover:text-[#636B2F] transition-colors block"
                  >
                    08067014037
                  </a>
                  <a
                    href="mailto:elroisewellnesscenter@gmail.com"
                    className="text-lg font-light text-[#2D2926] hover:text-[#636B2F] transition-colors block"
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
                className="w-12 h-12 rounded-full border border-[#E5E0D8] flex items-center justify-center text-[#2D2926] hover:bg-[#636B2F] hover:border-[#636B2F] hover:text-white transition-all"
              >
                <InstagramIcon />
              </a>
              <a
                href="mailto:elroisewellnesscenter@gmail.com"
                aria-label="Email"
                className="w-12 h-12 rounded-full border border-[#E5E0D8] flex items-center justify-center text-[#2D2926] hover:bg-[#636B2F] hover:border-[#636B2F] hover:text-white transition-all cursor-pointer"
              >
                <HugeiconsIcon icon={Mail01Icon} size={20} color="currentColor" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white p-12">
            <ContactForm />
          </div>

        </div>

        {/* Map */}
        <div className="mt-32 h-[500px] overflow-hidden grayscale contrast-125 opacity-70 hover:grayscale-0 transition-all duration-1000">
          <iframe
            src="https://maps.google.com/maps?q=8+Itumo+Ogbonna+Road,+Lekki+Phase+1,+Lagos,+Nigeria&output=embed"
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
