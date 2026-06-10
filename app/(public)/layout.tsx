import Script from 'next/script'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import CartDrawer from '@/components/public/CartDrawer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartDrawer />
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
    </>
  )
}
