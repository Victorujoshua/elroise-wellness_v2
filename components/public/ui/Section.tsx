import { cn } from '@/lib/utils'

type SectionBg = 'white' | 'off-white' | 'green-primary' | 'green-secondary'

const BG: Record<SectionBg, string> = {
  'white':           'bg-white',
  'off-white':       'bg-bg',
  'green-primary':   'bg-[#636B2F]',
  'green-secondary': 'bg-[#98A869]',
}

export function Section({
  as: Tag = 'section',
  background = 'off-white',
  className,
  children,
}: {
  as?: 'section' | 'div' | 'article'
  background?: SectionBg
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tag className={cn('py-16 md:py-24', BG[background], className)}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {children}
      </div>
    </Tag>
  )
}
