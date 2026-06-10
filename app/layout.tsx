import type { Metadata } from 'next'
import { Playfair_Display, Montserrat, Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    default: 'Elroisè Wellness Center',
    template: '%s — Elroisè Wellness Center',
  },
  description:
    "Lagos' premier sanctuary for Laser Hair Reduction and Reformer Pilates. Precision. Grace. You.",
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://elroisewellnesscenter.com',
    siteName: 'Elroisè Wellness Center',
    images: [{ url: '/hero.jpeg', width: 1200, height: 630, alt: 'Elroisè Wellness Center' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", playfair.variable, montserrat.variable, "font-sans", geist.variable)}
    >
      {/* suppressHydrationWarning: browser extensions add attributes to body that don't exist in SSR HTML */}
      <body className="min-h-full flex flex-col font-body bg-bg text-charcoal" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
