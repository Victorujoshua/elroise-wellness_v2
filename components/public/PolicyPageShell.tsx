import type { ReactNode } from 'react'

type Props = {
  eyebrow: string
  title: ReactNode
  date: string
  children: ReactNode
}

export default function PolicyPageShell({ eyebrow, title, date, children }: Props) {
  return (
    <div className="min-h-screen bg-[#F9F6F2] pt-[72px]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E0D8] px-6 py-16 text-center">
        <p className="font-sora text-[10px] font-medium tracking-[3px] uppercase text-[#636B2F] mb-4">
          {eyebrow}
        </p>
        <h1 className="font-sora text-[clamp(32px,5vw,52px)] font-light leading-[1.1] text-[#2D2926] mb-4 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-[#2D2926]/50 font-light">{date}</p>
        <div className="w-10 h-px bg-[#636B2F] mx-auto mt-5" />
      </div>

      {/* Content */}
      <div className="max-w-[780px] mx-auto px-6 py-16 pb-24">
        {children}
      </div>

      {/* Footer strip */}
      <div className="bg-[#2D2926] px-6 py-12 text-center text-white/60 text-[13px] font-light tracking-wide">
        <p>
          Questions? Contact us at{' '}
          <a
            href="https://elroisewellnesscenter.com"
            className="text-white hover:underline"
          >
            elroisewellnesscenter.com
          </a>
        </p>
        <p className="mt-2 opacity-60">© Elroisè Wellness Center. All rights reserved.</p>
      </div>
    </div>
  )
}
