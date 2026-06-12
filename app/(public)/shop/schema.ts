import { z } from 'zod'

export const addressSchema = z.object({
  full_name:     z.string().min(2),
  email:         z.string().email(),
  phone:         z.string().min(7),
  address_line1: z.string().min(3),
  city:          z.string().min(1),
  state:         z.string().min(1),
})

export type ShippingAddress = z.infer<typeof addressSchema>
