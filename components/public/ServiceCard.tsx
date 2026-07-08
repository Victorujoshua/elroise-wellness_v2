import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Yoga01Icon,
  MagicWand01Icon,
  ArrowRight01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import type { Service } from '@/lib/data/services'

export default function ServiceCard({ service }: { service: Service }) {
  const isPilates = service.category === 'pilates' || service.id.includes('pilates')
  const CategoryIcon = isPilates ? Yoga01Icon : MagicWand01Icon
  const accent = isPilates ? '#636B2F' : '#636B2F'

  return (
    <div className="group relative bg-white overflow-hidden transition-all duration-300 border border-[#E5E0D8]/50 hover:border-[#636B2F]/50 hover:shadow-sm flex flex-col h-full cursor-pointer">
      {/* Category accent bar */}
      <div className="h-px w-full" style={{ backgroundColor: accent }} />

      <div className="p-5 flex-grow flex flex-col gap-3">
        {/* Header row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={CategoryIcon} size={12} color={accent} strokeWidth={1.5} />
            <span className="text-[8px] uppercase tracking-[0.3em] font-bold" style={{ color: accent }}>
              {isPilates ? 'Pilates' : 'Laser'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} size={11} color="#9CA3AF" strokeWidth={1.5} />
            <span className="text-[8px] tracking-widest text-gray-400 uppercase font-medium">
              {service.duration}
            </span>
          </div>
        </div>

        {/* Name */}
        <h3 className="text-base font-sora text-[#2D2926] leading-snug">{service.name}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-sora text-[#2D2926]">₦{service.price}</span>
          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">/ session</span>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-[12px] leading-relaxed font-light flex-grow">
          {service.description}
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link
          href={`/services/${service.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#2D2926] text-[9px] uppercase tracking-[0.3em] font-bold text-white hover:bg-[#636B2F] transition-all duration-300 group/btn"
        >
          <span>Book Now</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={12}
            color="currentColor"
            strokeWidth={2}
            className="transform group-hover/btn:translate-x-0.5 transition-transform duration-200"
          />
        </Link>
      </div>
    </div>
  )
}
