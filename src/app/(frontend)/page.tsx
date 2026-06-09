import Link from 'next/link'
import { Card } from '@/components/Card'
import {
  getFeaturedPosts,
  getUpcomingEvents,
  getFeaturedBusinesses,
} from '@/lib/queries'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

// Revalider forsiden hvert 5. minutt (ISR) for fart + ferskhet.
export const revalidate = 300

// Liten hjelper for å hente bilde-URL trygt fra et media-objekt.
const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object'
    ? size && m.sizes?.[size]?.url
      ? m.sizes[size].url
      : m.url
    : null

export default async function HomePage() {
  const [featured, events, businesses] = await Promise.all([
    getFeaturedPosts(3),
    getUpcomingEvents(4),
    getFeaturedBusinesses(4),
  ])

  return (
    <>
      {/* Hero */}
      <section className="bg-sea text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Historiene fra Helgeland
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Lokale historier, næringsliv, kultur og opplevelser fra hele regionen.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/historier" className="rounded-full bg-white px-6 py-3 font-medium text-sea hover:bg-brand-50">
              Les historier
            </Link>
            <Link href="/arrangementer" className="rounded-full border border-white/40 px-6 py-3 font-medium hover:bg-white/10">
              Hva skjer?
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Fremhevede historier */}
        <Section title="Fremhevede historier" href="/historier">
          {featured.map((post: any) => (
            <Card
              key={post.id}
              href={`/historier/${post.slug}`}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={mediaUrl(post.heroImage, 'card')}
              imageAlt={post.heroImage?.alt}
              meta={post.category?.title}
            />
          ))}
        </Section>

        {/* Kommende arrangementer */}
        <Section title="Hva skjer fremover" href="/arrangementer">
          {events.map((event: any) => (
            <Card
              key={event.id}
              href={`/arrangementer/${event.slug}`}
              title={event.title}
              imageUrl={mediaUrl(event.image, 'card')}
              imageAlt={event.image?.alt}
              meta={
                event.startDate
                  ? format(new Date(event.startDate), 'd. MMM yyyy', { locale: nb })
                  : null
              }
            />
          ))}
        </Section>

        {/* Fremhevede bedrifter */}
        <Section title="Næringsliv i regionen" href="/bedrifter">
          {businesses.map((biz: any) => (
            <Card
              key={biz.id}
              href={`/bedrifter/${biz.slug}`}
              title={biz.name}
              excerpt={biz.tagline}
              imageUrl={mediaUrl(biz.logo, 'card')}
              imageAlt={biz.logo?.alt}
              meta={biz.place?.name}
            />
          ))}
        </Section>
      </div>
    </>
  )
}

function Section({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <section className="py-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-serif text-2xl font-bold text-sea">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline">
          Se alle →
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}
