import { cn } from '@/lib/utils'

type CardPadding = 'sm' | 'md' | 'lg'
type CardBg      = 'white' | 'off-white' | 'green-primary' | 'green-secondary'

const PADDING: Record<CardPadding, string> = {
  sm: 'p-5',
  md: 'p-8',
  lg: 'p-12',
}

const BG: Record<CardBg, string> = {
  'white':           'bg-white',
  'off-white':       'bg-bg',
  'green-primary':   'bg-[#636B2F] text-white',
  'green-secondary': 'bg-[#98A869] text-charcoal',
}

export function Card({
  padding = 'md',
  background = 'white',
  className,
  children,
}: {
  padding?: CardPadding
  background?: CardBg
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-2xl shadow-sm border border-charcoal/8', PADDING[padding], BG[background], className)}>
      {children}
    </div>
  )
}
