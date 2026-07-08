import type { Metadata } from 'next'
import PolicyPageShell from '@/components/public/PolicyPageShell'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Elroisè Wellness Center.',
}

export default function PrivacyPage() {
  return (
    <PolicyPageShell
      eyebrow="Elroisè Wellness Center"
      title={<>Privacy <span className="text-[#636B2F]">Policy</span></>}
      date="Effective 5 June 2026"
    >
      <p className="font-sora text-[20px] font-light leading-[1.75] text-[#2D2926]">
        Policy text being finalized. Contact us for details.
      </p>
    </PolicyPageShell>
  )
}
