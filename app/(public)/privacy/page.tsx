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
      title={<>Privacy <em className="italic text-[#c8dfd3]">Policy</em></>}
      date="Effective 5 June 2026"
    >
      <p className="serif text-[20px] font-light leading-[1.75] text-[#3a3a3a] italic">
        Policy text being finalized. Contact us for details.
      </p>
    </PolicyPageShell>
  )
}
