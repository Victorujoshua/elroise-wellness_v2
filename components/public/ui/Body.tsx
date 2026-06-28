import { cn } from '@/lib/utils'

type BodySize = 'lg' | 'md' | 'sm'

const SIZE: Record<BodySize, string> = {
  lg: 'text-lg leading-relaxed',
  md: 'text-base leading-relaxed',
  sm: 'text-sm leading-relaxed',
}

export function Body({
  size = 'md',
  muted = false,
  className,
  children,
}: {
  size?: BodySize
  muted?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <p className={cn('font-sora font-light', SIZE[size], muted ? 'text-[#2D2926]/50' : 'text-[#2D2926]/70', className)}>
      {children}
    </p>
  )
}
