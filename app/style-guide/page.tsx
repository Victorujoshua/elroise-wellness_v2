import { Section }  from '@/components/public/ui/Section'
import { Eyebrow }  from '@/components/public/ui/Eyebrow'
import { Heading }  from '@/components/public/ui/Heading'
import { Body }     from '@/components/public/ui/Body'
import { Button }   from '@/components/public/ui/Button'
import { Card }     from '@/components/public/ui/Card'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sora text-[10px] uppercase tracking-widest text-charcoal/40 font-medium mb-2">
      {children}
    </p>
  )
}

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-12 border-b border-charcoal/8 last:border-0">
      <p className="font-sora text-xs uppercase tracking-[0.3em] font-semibold text-[#636B2F] mb-8">
        {title}
      </p>
      {children}
    </div>
  )
}

// ── Color swatch ──────────────────────────────────────────────────────────────

function Swatch({ name, hex, className }: { name: string; hex: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 w-full rounded-lg ${className}`} />
      <p className="font-sora text-xs font-medium text-charcoal">{name}</p>
      <p className="font-sora text-[10px] text-charcoal/50">{hex}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-bg">

      {/* Header bar */}
      <div className="bg-[#636B2F] px-10 py-6">
        <p className="font-sora text-[10px] uppercase tracking-[0.4em] text-white/60 font-medium">
          Elroisè Wellness — Rebrand Foundation
        </p>
        <p className="font-sora text-2xl font-light text-white mt-1">Style Guide</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 pb-24">

        {/* ── 1. Colors ─────────────────────────────────────────────────── */}
        <GuideSection title="1 · Colors">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            <Swatch name="Green Primary"   hex="#636B2F" className="bg-[#636B2F]" />
            <Swatch name="Green Secondary" hex="#98A869" className="bg-[#98A869]" />
            <Swatch name="Charcoal"        hex="#2D2926" className="bg-charcoal" />
            <Swatch name="Sand"            hex="#F3EFEA" className="bg-sand border border-charcoal/10" />
            <Swatch name="Bg"              hex="#F9F6F2" className="bg-bg border border-charcoal/10" />
          </div>
        </GuideSection>

        {/* ── 2. Typography ─────────────────────────────────────────────── */}
        <GuideSection title="2 · Typography Scale">
          <div className="space-y-10">
            <div>
              <Label>Display — 5xl / 6xl / 7xl · font-light</Label>
              <Heading as="h1" size="display">Where light meets<br />the art of motion.</Heading>
            </div>
            <div>
              <Label>Large — 4xl / 5xl · font-light</Label>
              <Heading as="h2" size="large">Mindful movement, redefined.</Heading>
            </div>
            <div>
              <Label>Medium — 3xl / 4xl · font-light</Label>
              <Heading as="h3" size="medium">Reformer Pilates Studio</Heading>
            </div>
            <div>
              <Label>Body lg — text-lg · font-light</Label>
              <Body size="lg">
                Our Reformer Pilates sessions are designed to build long, lean muscle and core
                stability. In our sanctuary, movement is a ritual of strength and grace.
              </Body>
            </div>
            <div>
              <Label>Body md — text-base · font-light</Label>
              <Body size="md">
                Every service at Elroisè is designed with precision, care, and a deep respect
                for your body and time. Discover treatments curated for you.
              </Body>
            </div>
            <div>
              <Label>Body sm — text-sm · font-light</Label>
              <Body size="sm">
                Cancellations must be made at least 24 hours in advance. Late arrivals may
                result in a shortened session.
              </Body>
            </div>
            <div>
              <Label>Body muted</Label>
              <Body size="md" muted>Secured by Paystack. Your card is never stored.</Body>
            </div>
          </div>
        </GuideSection>

        {/* ── 3. Italic accent pattern ───────────────────────────────────── */}
        <GuideSection title="3 · Italic Accent Pattern">
          <div className="space-y-8">
            <div>
              <Label>Display with italic accent word</Label>
              <Heading as="h1" size="display">
                Where <span className="italic text-[#636B2F]">light</span> meets<br />
                the art of motion.
              </Heading>
            </div>
            <div>
              <Label>Large with italic accent word</Label>
              <Heading as="h2" size="large">
                Mindful movement,{' '}
                <span className="italic text-[#636B2F]">redefined.</span>
              </Heading>
            </div>
            <div>
              <Label>Dark background variant</Label>
              <div className="bg-charcoal rounded-2xl p-10">
                <Heading as="h2" size="large" className="text-white">
                  Return to{' '}
                  <span className="italic text-[#98A869]">yourself.</span>
                </Heading>
              </div>
            </div>
          </div>
        </GuideSection>

        {/* ── 4. Eyebrow ────────────────────────────────────────────────── */}
        <GuideSection title="4 · Eyebrow">
          <div className="space-y-4">
            <div><Label>green-primary (default)</Label><Eyebrow>Wellness Sanctuary</Eyebrow></div>
            <div><Label>green-secondary</Label><Eyebrow color="green-secondary">Pilates Studio</Eyebrow></div>
            <div><Label>charcoal</Label><Eyebrow color="charcoal">Laser Hair Reduction</Eyebrow></div>
            <div className="bg-[#636B2F] rounded-xl p-5">
              <Label>white (on dark bg)</Label>
              <Eyebrow color="white">Est. Lagos</Eyebrow>
            </div>
          </div>
        </GuideSection>

        {/* ── 5. Buttons ────────────────────────────────────────────────── */}
        <GuideSection title="5 · Buttons">
          {(['primary', 'secondary', 'ghost'] as const).map(variant => (
            <div key={variant} className="mb-8">
              <Label>{variant}</Label>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant={variant} size="sm">Book a Session</Button>
                <Button variant={variant} size="md">Book a Session</Button>
                <Button variant={variant} size="lg">Book a Session</Button>
                <Button variant={variant} size="md" disabled>Disabled</Button>
              </div>
            </div>
          ))}
        </GuideSection>

        {/* ── 6. Cards ──────────────────────────────────────────────────── */}
        <GuideSection title="6 · Cards">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>White · padding md (default)</Label>
              <Card>
                <Eyebrow className="mb-3">Laser Ritual</Eyebrow>
                <Heading as="h3" size="medium">Lower Face</Heading>
                <Body size="sm" className="mt-2">30 min · ₦70,000</Body>
              </Card>
            </div>
            <div>
              <Label>Off-white · padding sm</Label>
              <Card background="off-white" padding="sm">
                <Body size="sm">A subtle container for secondary content, forms, or metadata.</Body>
              </Card>
            </div>
            <div>
              <Label>Green primary · padding md</Label>
              <Card background="green-primary">
                <Eyebrow color="white" className="mb-3">Featured</Eyebrow>
                <Heading as="h3" size="medium" className="text-white">Reformer Pilates</Heading>
                <Body size="sm" className="mt-2 text-white/70">55 min · ₦20,000</Body>
              </Card>
            </div>
            <div>
              <Label>Green secondary · padding lg</Label>
              <Card background="green-secondary" padding="lg">
                <Heading as="h3" size="medium">Begin Here</Heading>
                <Body size="sm" className="mt-2">
                  Not sure where to start? Our team is happy to help.
                </Body>
              </Card>
            </div>
          </div>
        </GuideSection>

        {/* ── 7. Section backgrounds ────────────────────────────────────── */}
        <GuideSection title="7 · Section Backgrounds">
          <div className="space-y-4 -mx-6 lg:-mx-10">
            {(
              [
                { bg: 'white',           label: 'white' },
                { bg: 'off-white',       label: 'off-white' },
                { bg: 'green-secondary', label: 'green-secondary' },
                { bg: 'green-primary',   label: 'green-primary' },
              ] as const
            ).map(({ bg, label }) => (
              <Section key={bg} background={bg} className="!py-10">
                <div className="flex items-center justify-between">
                  <Eyebrow color={bg === 'green-primary' ? 'white' : 'green-primary'}>
                    Section — {label}
                  </Eyebrow>
                  <Body
                    size="sm"
                    muted={bg !== 'green-primary'}
                    className={bg === 'green-primary' ? 'text-white/60' : ''}
                  >
                    py-16 md:py-24 · max-w-7xl mx-auto
                  </Body>
                </div>
              </Section>
            ))}
          </div>
        </GuideSection>

      </div>
    </div>
  )
}
