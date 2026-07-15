import type { Metadata } from 'next'
import { Hanken_Grotesk, Fraunces } from 'next/font/google'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Ad } from '@/components/Ad'
import './globals.css'

const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://helgelandsia.no'),
  title: {
    default: 'Helgelandsia – bedrifter, stillinger, anbud og arrangementer på Helgeland',
    template: '%s | Helgelandsia',
  },
  description: 'Helgelandsia samler alt som skjer på Helgeland på ett sted: bedrifter, stillinger, anbud, arrangementer, høringer, fergetider og lokale nyheter — fra 18 kommuner, oppdatert hver dag.',
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    siteName: 'Helgelandsia',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Helgelandsia' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <div className="mx-auto w-full max-w-6xl px-4"><Ad placement="header" className="my-4" /></div>
        <main className="flex-1">{children}</main>
        <div className="mx-auto w-full max-w-6xl px-4"><Ad placement="footer" className="my-8" /></div>
        <SiteFooter />
      </body>
    </html>
  )
}
