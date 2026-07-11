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
  single_price_naira: z.number().int().min(0, 'Must be non-negative'),
  has_package: z.boolean(),
  package_price_naira: z.number().int().min(0).nullable().optional(),
  package_session_count: z.number().int().min(2, 'At least 2 sessions').nullable().optional(),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex colour'),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  practitioner_ids: z.array(z.string()),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
