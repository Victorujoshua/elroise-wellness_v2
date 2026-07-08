import type { Metadata } from 'next'
import PolicyPageShell from '@/components/public/PolicyPageShell'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    'Our policy on cancellations, returns, and refunds for Pilates sessions and wellness products.',
}

const listItems = (
  items: { label: string; text: string }[],
) => (
  <ul className="space-y-2 my-3">
    {items.map(item => (
      <li
        key={item.label}
        className="text-[15px] leading-[1.7] text-[#2D2926]/75 font-light py-2.5 pl-5 border-l-2 border-[#E5E0D8] hover:border-[#636B2F] transition-colors"
      >
        <span className="font-medium text-[#2D2926]">{item.label}</span> — {item.text}
      </li>
    ))}
  </ul>
)

export default function RefundPolicyPage() {
  return (
    <PolicyPageShell
      eyebrow="Elroisè Wellness Center"
      title={
        <>
          Refund &amp; <span className="text-[#636B2F]">Cancellation</span> Policy
        </>
      }
      date="Effective 5 June 2026"
    >
      <p className="font-sora text-[20px] font-light leading-[1.75] text-[#2D2926]/75 mb-16 pb-12 border-b border-[#E5E0D8]">
        At Elroisè Wellness Center, we are committed to a fair and transparent experience for every
        client. This policy outlines the terms governing cancellations, returns, and refunds for our
        Pilates sessions and physical wellness products.
      </p>

      {/* 01 — Pilates */}
      <div className="mb-14 pb-14 border-b border-[#E5E0D8]">
        <div className="flex items-baseline gap-5 mb-8">
          <span className="font-sora text-[13px] text-[#636B2F] tracking-[2px] shrink-0 pt-0.5">01</span>
          <h2 className="font-sora text-[28px] font-semibold text-[#2D2926] leading-[1.2]">
            Pilates Session Bookings
          </h2>
        </div>
        <div className="pl-9 space-y-7">
          <div>
            <p className="text-[12px] font-medium tracking-[2px] uppercase text-[#636B2F] mb-3">
              Cancellation Policy
            </p>
            <p className="text-[15px] leading-[1.8] text-[#2D2926]/75 font-light mb-3">
              To ensure fairness to our instructors and clients on the waitlist, we require that all
              session cancellations be made at least{' '}
              <strong className="font-medium text-[#2D2926]">12 hours before</strong> the scheduled
              start time.
            </p>
            {listItems([
              { label: '12+ hours in advance', text: 'Eligible for a full refund or session transfer.' },
              { label: 'Under 12 hours', text: 'Session fee is forfeited and non-refundable.' },
              {
                label: 'No-shows',
                text: 'The full session fee will be charged and cannot be refunded or transferred.',
              },
            ])}
          </div>
          <div>
            <p className="text-[12px] font-medium tracking-[2px] uppercase text-[#636B2F] mb-3">
              Rescheduling
            </p>
            <p className="text-[15px] leading-[1.8] text-[#2D2926]/75 font-light">
              Clients may reschedule a session without penalty if the request is made at least{' '}
              <strong className="font-medium text-[#2D2926]">12 hours before</strong> the scheduled
              session. Requests within the 12-hour window are treated as a late cancellation and the
              session fee will not be refunded.
            </p>
          </div>
        </div>
      </div>

      {/* 02 — Products */}
      <div className="mb-14 pb-14 border-b border-[#E5E0D8]">
        <div className="flex items-baseline gap-5 mb-8">
          <span className="font-sora text-[13px] text-[#636B2F] tracking-[2px] shrink-0 pt-0.5">02</span>
          <h2 className="font-sora text-[28px] font-semibold text-[#2D2926] leading-[1.2]">
            Physical Wellness Products
          </h2>
        </div>
        <div className="pl-9 space-y-7">
          <div>
            <p className="text-[12px] font-medium tracking-[2px] uppercase text-[#636B2F] mb-3">
              Return &amp; Exchange Window
            </p>
            <p className="text-[15px] leading-[1.8] text-[#2D2926]/75 font-light">
              Customers may request a return or exchange within{' '}
              <strong className="font-medium text-[#2D2926]">7 days</strong> of the date of delivery
              or in-store purchase.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-medium tracking-[2px] uppercase text-[#636B2F] mb-3">
              Eligibility Conditions
            </p>
            <p className="text-[15px] leading-[1.8] text-[#2D2926]/75 font-light mb-3">
              To qualify, the item must meet all of the following:
            </p>
            {listItems([
              { label: 'Unused', text: 'In its original condition with no signs of use.' },
              { label: 'Tags intact', text: 'All original tags are attached and undamaged.' },
              {
                label: 'Original packaging',
                text: 'Returned with all packaging included and undamaged.',
              },
            ])}
            <p className="text-[14px] leading-[1.8] text-[#2D2926]/40 font-light mt-4">
              Items that have been used, altered, or returned without original packaging will not be
              accepted.
            </p>
          </div>
        </div>
      </div>

      {/* 03 — Refund Method */}
      <div className="mb-14 pb-14 border-b border-[#E5E0D8]">
        <div className="flex items-baseline gap-5 mb-8">
          <span className="font-sora text-[13px] text-[#636B2F] tracking-[2px] shrink-0 pt-0.5">03</span>
          <h2 className="font-sora text-[28px] font-semibold text-[#2D2926] leading-[1.2]">
            Refund Method
          </h2>
        </div>
        <div className="pl-9">
          <p className="text-[12px] font-medium tracking-[2px] uppercase text-[#636B2F] mb-3">
            How Refunds Are Issued
          </p>
          <p className="text-[15px] leading-[1.8] text-[#2D2926]/75 font-light mb-3">
            Where a refund is approved, it will be issued using one of the following methods
            depending on the circumstances:
          </p>
          {listItems([
            {
              label: 'Original payment method',
              text: 'Returned directly to the card or account used at checkout.',
            },
            {
              label: 'Elroisè store credit',
              text: 'Issued to your account for use toward future sessions or products.',
            },
          ])}
          <p className="text-[15px] leading-[1.8] text-[#2D2926]/75 font-light">
            You will be notified of the chosen method upon approval of your request.
          </p>
        </div>
      </div>

      {/* 04 — How to Request */}
      <div>
        <div className="flex items-baseline gap-5 mb-8">
          <span className="font-sora text-[13px] text-[#636B2F] tracking-[2px] shrink-0 pt-0.5">04</span>
          <h2 className="font-sora text-[28px] font-semibold text-[#2D2926] leading-[1.2]">
            How to Request
          </h2>
        </div>
        <div className="pl-9">
          <p className="text-[12px] font-medium tracking-[2px] uppercase text-[#636B2F] mb-3">
            Submit a Request
          </p>
          <p className="text-[15px] leading-[1.8] text-[#2D2926]/75 font-light">
            All cancellation, return, and refund requests should be submitted through our website or
            by contacting our support team directly via the contact details on our platform. Please
            include your{' '}
            <strong className="font-medium text-[#2D2926]">booking reference or order number</strong>{' '}
            to ensure prompt processing.
          </p>
        </div>
      </div>
    </PolicyPageShell>
  )
}
