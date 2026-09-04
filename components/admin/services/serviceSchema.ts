import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(1, 'Required'),
  slug: z
    .string()
    .min(1, 'Required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  category: z.enum(['pilates', 'laser', 'other']),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(1, 'At least 1 minute'),
  buffer_minutes: z.number().int().min(0, 'Must be non-negative').max(120, 'Max 120 minutes'),
  max_concurrent: z.number().int().min(1, 'At least 1').max(20, 'Max 20'),
  single_price_naira: z.number().int().min(0, 'Must be non-negative'),
  has_package: z.boolean(),
  package_price_naira: z.number().int().min(0).nullable().optional(),
  package_session_count: z.number().int().min(2, 'At least 2 sessions').nullable().optional(),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex colour'),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  practitioner_ids: z.array(z.string()),
  class_start_times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time')),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const TIME_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export function parseClassStartTimes(
  text: string,
): { ok: true; times: string[] } | { ok: false; error: string } {
  const parts = text.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return { ok: true, times: [] }

  for (const part of parts) {
    if (!TIME_HHMM.test(part)) {
      return { ok: false, error: `Invalid time "${part}". Use 24-hour HH:MM, e.g. 10:00` }
    }
  }

  return { ok: true, times: [...new Set(parts)].sort() }
}

export function formatClassStartTimes(times: string[]): string {
  return times.map(t => t.slice(0, 5)).join(', ')
}
