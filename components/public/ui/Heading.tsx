import { cn } from '@/lib/utils'

type HeadingSize = 'display' | 'large' | 'medium'

const SIZE: Record<HeadingSize, string> = {
  display: 'text-5xl md:text-6xl lg:text-7xl leading-[1.06]',
  large:   'text-4xl md:text-5xl leading-[1.1]',
  medium:  'text-3xl md:text-4xl leading-[1.15]',
}

export function Heading({
  as: Tag = 'h2',
  size = 'large',
  className,
  children,
}: {
  as?: 'h1' | 'h2' | 'h3'
  size?: HeadingSize
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tag className={cn('font-sora font-light text-charcoal', SIZE[size], className)}>
      {children}
    </Tag>
  )
}
