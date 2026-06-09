import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'

// Server Component: henter meny fra Header-global.
export async function SiteHeader() {
  const payload = await getPayloadClient()
  const [header, settings] = await Promise.all([
    payload.findGlobal({ slug: 'header' }),
    payload.findGlobal({ slug: 'site-settings' }),
  ])

  const items = header?.items ?? []

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-serif text-xl font-bold text-sea">
          {settings?.siteName ?? 'Helgeland-portalen'}
        </Link>
        <nav className="hidden gap-6 md:flex">
          {items.map((item: { id?: string | null; label: string; url: string }) => (
            <Link
              key={item.id ?? item.url}
              href={item.url}
              className="text-sm font-medium text-slate-700 hover:text-brand-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
