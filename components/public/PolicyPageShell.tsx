import type { ReactNode } from 'react'

type Props = {
  eyebrow: string
  title: ReactNode
  date: string
  children: ReactNode
}

export default function PolicyPageShell({ eyebrow, title, date, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f9f7f4] font-body text-[#1a1a1a]">
      <div className="relative bg-[#2c4a42] px-10 pb-16 pt-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_60%_0%,rgba(180,210,190,0.15)_0%,transparent_70%)]" />
        <p className="relative text-[11px] font-medium tracking-[3px] uppercase text-[#9ec4b0] mb-5">
          {eyebrow}
        </p>
        <h1 className="relative serif font-light text-[clamp(36px,6vw,64px)] leading-[1.1] text-[#f0ece5] mb-6 tracking-tight">
          {title}
        </h1>
        <p className="relative text-[13px] text-[#7aaa92] font-light">{date}</p>
        <div className="relative w-12 h-px bg-[#9ec4b0] mx-auto mt-5" />
      </div>

      <div className="max-w-[780px] mx-auto px-6 py-16 pb-24">
        {children}
      </div>

      <div className="bg-[#2c4a42] px-6 py-12 text-center text-[#9ec4b0] text-[13px] font-light tracking-wide">
        <p>
          Questions? Contact us at{' '}
          <a
            href="https://elroisewellnesscenter.com"
            className="text-[#c8dfd3] hover:underline"
          >
            elroisewellnesscenter.com
          </a>
        </p>
        <p className="mt-2 opacity-60">© Elroisè Wellness Center. All rights reserved.</p>
      </div>
    </div>
  )
}
