import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'

export async function SiteHeader() {
  const payload = await getPayloadClient()
  const [header, settings] = await Promise.all([
    payload.findGlobal({ slug: 'header' }),
    payload.findGlobal({ slug: 'site-settings' }),
  ])
  const items = header?.items ?? []
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-fog/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-fjord">
          {settings?.siteName ?? 'Helgelandsia'}
        </Link>
        <nav className="hidden gap-8 md:flex">
          {items.map((item: { id?: string | null; label: string; url: string }) => (
            <Link key={item.id ?? item.url} href={item.url}
              className="text-sm font-medium text-ink/70 transition hover:text-sea">{item.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
