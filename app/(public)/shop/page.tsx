import type { Metadata } from 'next'
import ShopProduct from '@/components/public/ShopProduct'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Shop Elroisè Wellness grip socks — premium Pilates essentials crafted for the reformer. Lagos delivery.',
}

export default function ShopPage() {
  return <ShopProduct />
}
