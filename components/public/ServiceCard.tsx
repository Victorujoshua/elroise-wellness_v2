import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { Service } from '@/lib/data/services'

export default function ServiceCard({ service }: { service: Service }) {
  const isPilates = service.category === 'pilates' || service.id.includes('pilates')

  return (
    <div className="group relative bg-white overflow-hidden rounded-3xl transition-all duration-500 hover:shadow-xl border border-sand/30 flex flex-col h-full">
      <div className="p-8 flex-grow">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl serif italic mb-2">{service.name}</h3>
            <div className="flex items-center space-x-2 text-gold">
              <Sparkles size={14} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                {isPilates ? 'Pilates Ritual' : 'Laser Ritual'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] tracking-widest text-gray-400 uppercase font-bold">
              {service.duration}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl serif italic text-charcoal">₦{service.price}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
              / session
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed mb-8 font-light italic">
          {service.description}
        </p>
      </div>

      <div className="p-8 pt-0 mt-auto">
        <Link
          href={`/services/${service.id}`}
          className="flex items-center justify-center w-full p-5 bg-charcoal rounded-2xl text-[11px] uppercase tracking-[0.25em] font-bold text-white hover:bg-gold transition-all duration-500 group/btn shadow-lg"
        >
          <span>Book Now</span>
          <ArrowRight size={16} className="ml-3 transform group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
