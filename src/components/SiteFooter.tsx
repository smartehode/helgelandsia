import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'

export async function SiteFooter() {
  const payload = await getPayloadClient()
  const footer = await payload.findGlobal({ slug: 'footer' })

  return (
    <footer className="mt-20 bg-sea text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        {(footer?.columns ?? []).map((col: any) => (
          <div key={col.id}>
            <h4 className="mb-3 font-semibold">{col.heading}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {(col.links ?? []).map((l: any) => (
                <li key={l.id}>
                  <Link href={l.url} className="hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        <div className="mb-2 flex justify-center gap-5">
          <Link href="/om" className="hover:text-white">Om Helgelandsia</Link>
          <Link href="/min-side" className="hover:text-white">Min side</Link>
        </div>
        {footer?.copyright ?? `© ${new Date().getFullYear()} Helgeland-portalen`}
      </div>
    </footer>
  )
}
