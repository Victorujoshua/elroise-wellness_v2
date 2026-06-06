'use server'

import { sendTransactional, upsertContact } from '@/lib/loops'
import { contactSchema, type ContactFormValues } from './schema'

type ActionResult = { success: true } | { success: false; error: string }

export async function submitContactForm(data: ContactFormValues): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Invalid form data.' }
  }

  const templateId = process.env.LOOPS_CONTACT_TEMPLATE_ID
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL
  if (!templateId || !staffEmail) {
    console.error('[contact] Missing LOOPS_CONTACT_TEMPLATE_ID or STAFF_NOTIFICATION_EMAIL')
    return {
      success: false,
      error: 'Server configuration error. Please call or email us directly.',
    }
  }

  const { name, email, phone, message } = parsed.data

  const nameParts = name.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

  try {
    await Promise.all([
      upsertContact({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        properties: { source: 'contact_form' },
      }),
      sendTransactional({
        templateId,
        email: staffEmail,
        dataVariables: {
          name,
          email,
          phone: phone || '—',
          message,
        },
      }),
    ])
    return { success: true }
  } catch (err) {
    console.error('[contact] Loops error:', err)
    return {
      success: false,
      error: 'Something went wrong. Please try again or contact us directly.',
    }
  }
}
