import type { Metadata } from 'next'
import { Hanken_Grotesk, Fraunces } from 'next/font/google'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Ad } from '@/components/Ad'
import './globals.css'

const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: { default: 'Helgelandsia', template: '%s · Helgelandsia' },
  description: 'Lokale historier, næringsliv, kultur og opplevelser fra Helgeland.',
  openGraph: { type: 'website', locale: 'nb_NO' },
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
