import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'
import { NyhetsbrevPaamelding } from '@/components/NyhetsbrevPaamelding'

export async function SiteFooter() {
  const payload = await getPayloadClient()
  const footer = await payload.findGlobal({ slug: 'footer' })

  return (
    <footer className="mt-20 bg-sea text-white">

      {/* Ukebrev-påmelding */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div className="shrink-0">
            <p className="font-semibold text-white">Uka på Helgeland</p>
            <p className="text-sm text-white/70">Ukentlig e-post med det viktigste som skjer.</p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[320px]">
            <NyhetsbrevPaamelding kompakt fra="/footer" />
          </div>
        </div>
      </div>

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
