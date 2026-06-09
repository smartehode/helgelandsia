import Link from 'next/link'
import { Card } from '@/components/Card'
import { Ad } from '@/components/Ad'
import { HeroSection } from '@/components/HeroSection'
import { getFeaturedPosts, getUpcomingEvents, getFeaturedBusinesses } from '@/lib/queries'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

export default async function HomePage() {
  const [featured, events, businesses] = await Promise.all([
    getFeaturedPosts(3), getUpcomingEvents(4), getFeaturedBusinesses(4),
  ])
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="pt-2"><HeroSection /></div>
      <div className="mt-4 flex gap-10">
        <div className="min-w-0 flex-1">
          <Section title="Fremhevede historier" href="/historier">
            {featured.map((post: any) => (
              <Card key={post.id} href={`/historier/${post.slug}`} title={post.title} excerpt={post.excerpt}
                    imageUrl={mediaUrl(post.heroImage, 'card')} imageAlt={post.heroImage?.alt} meta={post.category?.title} />
            ))}
          </Section>
          <Ad placement="in-content" className="my-10" />
          <Section title="Hva skjer fremover" href="/arrangementer">
            {events.map((event: any) => (
              <Card key={event.id} href={`/arrangementer/${event.slug}`} title={event.title}
                    imageUrl={mediaUrl(event.image, 'card')} imageAlt={event.image?.alt}
                    meta={event.startDate ? format(new Date(event.startDate), 'd. MMM yyyy', { locale: nb }) : null} />
            ))}
          </Section>
          <Section title="Næringsliv i regionen" href="/bedrifter">
            {businesses.map((biz: any) => (
              <Card key={biz.id} href={`/bedrifter/${biz.slug}`} title={biz.name} excerpt={biz.tagline}
                    imageUrl={mediaUrl(biz.logo, 'card')} imageAlt={biz.logo?.alt} meta={biz.place?.name} />
            ))}
          </Section>
        </div>
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="sticky top-24"><Ad placement="sidebar" /></div>
        </aside>
      </div>
    </div>
  )
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="py-9">
      <div className="mb-6 flex items-end justify-between border-b border-ink/10 pb-3">
        <h2 className="font-serif text-2xl font-semibold text-fjord">{title}</h2>
        <Link href={href} className="text-sm font-medium text-sea hover:text-sun">Se alle →</Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}
