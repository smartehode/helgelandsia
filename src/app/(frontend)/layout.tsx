import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const lora = Lora({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Helgeland-portalen',
    template: '%s · Helgeland-portalen',
  },
  description: 'Lokale historier, næringsliv, kultur og opplevelser fra Helgeland.',
  openGraph: { type: 'website', locale: 'nb_NO' },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className={`${inter.variable} ${lora.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
