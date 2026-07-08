import { cn } from '@/lib/utils'

type EyebrowColor = 'green-primary' | 'green-secondary' | 'charcoal' | 'white'

const COLOR: Record<EyebrowColor, string> = {
  'green-primary':   'text-[#636B2F]',
  'green-secondary': 'text-[#98A869]',
  'charcoal':        'text-[#2D2926]',
  'white':           'text-white',
}

export function Eyebrow({
  children,
  color = 'green-primary',
  className,
}: {
  children: React.ReactNode
  color?: EyebrowColor
  className?: string
}) {
  return (
    <p className={cn('font-sora text-[10px] uppercase tracking-[0.3em] font-medium', COLOR[color], className)}>
      {children}
    </p>
  )
}
