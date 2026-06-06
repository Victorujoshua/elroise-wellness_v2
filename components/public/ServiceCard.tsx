'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { Service } from '@/lib/data/services'

export default function ServiceCard({ service }: { service: Service }) {
  const [tab, setTab] = useState<'single' | 'package'>('single')

  const isPilates = service.category === 'pilates' || service.id.includes('pilates')

  const displayPrice =
    tab === 'single'
      ? service.price
      : service.packages
      ? service.packages[0].price
      : service.packagePrice

  const packageLabel = service.packages
    ? service.packages[0].name
    : isPilates
    ? '10 Session Bundle'
    : '5 Session Package'

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
          <div className="flex bg-sand/10 p-1 rounded-xl mb-4">
            <button
              onClick={() => setTab('single')}
              className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${
                tab === 'single' ? 'bg-white text-gold shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setTab('package')}
              className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${
                tab === 'package' ? 'bg-white text-gold shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {service.packages ? 'Bundles' : 'Package'}
            </button>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl serif italic text-charcoal">₦{displayPrice}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
              {tab === 'single' ? '/ session' : `/ ${packageLabel.toLowerCase()}`}
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
