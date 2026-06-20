import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:   'bg-[#636B2F] text-white hover:bg-[#98A869]',
  secondary: 'border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white',
  ghost:     'text-charcoal hover:text-[#636B2F] underline-offset-4 hover:underline',
}

const SIZE: Record<Size, string> = {
  sm: 'px-5 py-2.5 text-[10px] tracking-[0.2em]',
  md: 'px-8 py-3.5 text-[11px] tracking-[0.2em]',
  lg: 'px-10 py-5 text-[11px] tracking-[0.25em]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  children,
  className,
  disabled = false,
}: {
  variant?: Variant
  size?: Size
  href?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  const cls = cn(
    'inline-block font-sora uppercase font-medium transition-all duration-300',
    VARIANT[variant],
    SIZE[size],
    disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
    className,
  )

  if (href && !disabled) {
    return <Link href={href} className={cls}>{children}</Link>
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}
