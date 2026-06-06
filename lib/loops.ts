const LOOPS_BASE = 'https://app.loops.so/api/v1'

async function loopsPost(path: string, body: unknown): Promise<void> {
  const key = process.env.LOOPS_API_KEY
  if (!key) throw new Error('LOOPS_API_KEY is not set')

  const res = await fetch(`${LOOPS_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Loops ${path} → ${res.status}: ${text}`)
  }
}

export async function sendTransactional({
  templateId,
  email,
  dataVariables,
}: {
  templateId: string
  email: string
  dataVariables: Record<string, string>
}): Promise<void> {
  await loopsPost('/transactional', {
    transactionalId: templateId,
    email,
    dataVariables,
  })
}

export async function upsertContact({
  email,
  firstName,
  lastName,
  phone,
  properties,
}: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  properties?: Record<string, unknown>
}): Promise<void> {
  await loopsPost('/contacts/upsert', {
    email,
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(phone && { phone }),
    ...properties,
  })
}
