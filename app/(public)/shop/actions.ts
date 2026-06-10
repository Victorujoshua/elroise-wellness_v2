'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { CartItem } from '@/lib/cart'
import { verifyPaystackPayment } from '@/lib/paystack'
import { sendTransactional } from '@/lib/loops'

function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export const addressSchema = z.object({
  full_name:    z.string().min(2),
  email:        z.string().email(),
  phone:        z.string().min(7),
  address_line1: z.string().min(3),
  city:         z.string().min(1),
  state:        z.string().min(1),
})

export type ShippingAddress = z.infer<typeof addressSchema>

type OrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string }

export async function verifyAndCreateShopOrder(
  cartItems: CartItem[],
  address: ShippingAddress,
  reference: string,
): Promise<OrderResult> {
  const parsed = addressSchema.safeParse(address)
  if (!parsed.success) return { success: false, error: 'Invalid address details.' }
  if (!cartItems.length) return { success: false, error: 'Cart is empty.' }
  if (!reference) return { success: false, error: 'Missing payment reference.' }

  const expectedKobo = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0) * 100

  try {
    // PH-6: Guard against duplicate reference before writing any rows
    const db = createServiceClient()
    const { data: existingPayment } = await db
      .from('payments')
      .select('id')
      .eq('paystack_reference', reference)
      .maybeSingle()

    if (existingPayment) {
      console.warn('[shop] Duplicate paystack_reference submitted:', reference)
      return { success: false, error: 'This payment has already been processed. Contact us if you have not received your order confirmation.' }
    }

    // 1. Verify with Paystack
    const verified = await verifyPaystackPayment(reference)

    // 2. Amount security check — reject if what was charged doesn't match the cart
    if (verified.amount_kobo !== expectedKobo) {
      console.error(
        `[shop] Amount mismatch — expected ${expectedKobo} kobo, got ${verified.amount_kobo} kobo`,
      )
      return { success: false, error: 'Payment amount does not match order total.' }
    }

    // 3. Upsert client by email
    let clientId: string
    const { data: existing } = await db
      .from('clients')
      .select('id')
      .eq('email', parsed.data.email)
      .maybeSingle()

    if (existing) {
      clientId = existing.id
    } else {
      const { data: newClient, error: clientErr } = await db
        .from('clients')
        .insert({
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          phone: parsed.data.phone,
        })
        .select('id')
        .single()

      if (clientErr || !newClient) {
        console.error('[shop] Client insert failed:', clientErr)
        return { success: false, error: 'Failed to record customer details.' }
      }
      clientId = newClient.id
    }

    // 4. Insert shop_order
    const { data: order, error: orderErr } = await db
      .from('shop_orders')
      .insert({
        client_id: clientId,
        items: cartItems as unknown as Database['public']['Tables']['shop_orders']['Insert']['items'],
        total_kobo: expectedKobo,
        shipping_address: parsed.data as unknown as Database['public']['Tables']['shop_orders']['Insert']['shipping_address'],
        status: 'confirmed',
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error('[shop] Order insert failed:', orderErr)
      return { success: false, error: 'Failed to create order. Please contact us if you were charged.' }
    }

    // 5. Insert payment row
    const { error: paymentErr } = await db.from('payments').insert({
      shop_order_id: order.id,
      paystack_reference: verified.reference,
      amount_kobo: verified.amount_kobo,
      status: 'success',
      channel: verified.channel,
      verified_at: new Date().toISOString(),
    })
    if (paymentErr) {
      // Order exists — log but don't fail. Client is charged and order is created.
      console.error('[shop] Payment row insert failed (non-fatal):', paymentErr)
    }

    // 6. Fire Loops confirmation email — non-blocking, never fail the order
    const templateId = process.env.LOOPS_SHOP_ORDER_TEMPLATE_ID
    if (templateId && templateId !== 'your-template-id') {
      try {
        const itemSummary = cartItems
          .map(i => `${i.color} (${i.size}) ×${i.qty}`)
          .join(', ')
        await sendTransactional({
          templateId,
          email: parsed.data.email,
          dataVariables: {
            first_name: parsed.data.full_name.split(' ')[0],
            order_id: order.id,
            item_summary: itemSummary,
            total_naira: (expectedKobo / 100).toLocaleString('en-NG'),
          },
        })
      } catch (err) {
        console.warn('[shop] Loops email failed (non-fatal):', err)
      }
    }

    return { success: true, orderId: order.id }
  } catch (err) {
    console.error('[shop] verifyAndCreateShopOrder error:', err)
    return {
      success: false,
      error: 'Something went wrong. Please contact us if you were charged.',
    }
  }
}
