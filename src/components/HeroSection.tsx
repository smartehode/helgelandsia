import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'

const mediaUrl = (m: any) => (m && typeof m === 'object' ? m.url : null)

export async function HeroSection() {
  const payload = await getPayloadClient()
  const hero: any = await payload.findGlobal({ slug: 'hero', depth: 1 }).catch(() => null)
  const eyebrow = hero?.eyebrow ?? 'Midt i Helgeland'
  const heading = hero?.heading ?? 'Historiene fra Helgeland'
  const subheading = hero?.subheading ?? 'Lokale historier, næringsliv, kultur og opplevelser fra hele regionen.'
  const bg = hero?.background ?? 'color'
  const imageUrl = mediaUrl(hero?.image)
  const videoUrl = mediaUrl(hero?.video)
  const overlay = typeof hero?.overlay === 'number' ? hero.overlay : 45
  const ctas: any[] = hero?.ctas?.length ? hero.ctas : [
    { label: 'Leserinnlegg', url: '/leserinnlegg', style: 'primary' },
    { label: 'Hva skjer?', url: '/arrangementer', style: 'secondary' },
  ]
  return (
    <section className="relative overflow-hidden rounded-3xl bg-fjord">
      {bg === 'image' && imageUrl && (
        <img src={imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      )}
      {bg === 'video' && videoUrl && (
        <video autoPlay muted loop playsInline poster={imageUrl ?? undefined}
               className="absolute inset-0 h-full w-full object-cover">
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
      {bg !== 'color' && (
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(12,39,51,${overlay / 100 + 0.1}) 0%, rgba(12,39,51,${overlay / 100 + 0.4}) 100%)` }} />
      )}
      <div className="relative px-6 py-24 text-center sm:py-28">
        <p className="font-sans text-xs font-semibold uppercase tracking-eyebrow text-sun">{eyebrow}</p>
        <span className="mx-auto mt-4 block h-px w-12 bg-sun/70" />
        <h1 className="mx-auto mt-6 max-w-3xl font-serif text-4xl font-semibold leading-tight text-white sm:text-6xl">{heading}</h1>
        {subheading && <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">{subheading}</p>}
        {ctas.length > 0 && (
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {ctas.map((c, i) => (
              <Link key={i} href={c.url}
                className={c.style === 'secondary'
                  ? 'rounded-full border border-white/40 px-7 py-3 font-medium text-white transition hover:bg-white/10'
                  : 'rounded-full bg-sun px-7 py-3 font-medium text-fjord transition hover:brightness-105'}>
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
