const PAYSTACK_BASE = 'https://api.paystack.co'

export async function refundPaystackPayment(reference: string): Promise<void> {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not set')

  const res = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transaction: reference }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Paystack refund → ${res.status}: ${text}`)
  }
}

export type PaystackVerification = {
  amount_kobo: number
  channel: string
  reference: string
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerification> {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not set')

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Paystack verify → ${res.status}: ${text}`)
  }

  const json = await res.json()
  if (json.data?.status !== 'success') {
    throw new Error(
      `Payment not successful: ${json.data?.gateway_response ?? 'unknown'}`,
    )
  }

  return {
    amount_kobo: json.data.amount as number,
    channel: (json.data.channel ?? 'unknown') as string,
    reference: json.data.reference as string,
  }
}
