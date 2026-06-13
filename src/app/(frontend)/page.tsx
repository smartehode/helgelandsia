import Link from 'next/link'
import { Card } from '@/components/Card'
import { Ad } from '@/components/Ad'
import { HeroSection } from '@/components/HeroSection'
import { RenderBlocks } from '@/components/RenderBlocks'
import { getPayloadClient } from '@/lib/getPayload'
import { getFeaturedPosts, getUpcomingEvents, getFeaturedBusinesses } from '@/lib/queries'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

export default async function HomePage() {
  const payload = await getPayloadClient()
  const [featured, events, businesses, areas] = await Promise.all([
    getFeaturedPosts(3),
    getUpcomingEvents(4),
    getFeaturedBusinesses(4),
    payload.findGlobal({ slug: 'sidefelt', depth: 2 }).catch(() => null),
  ])

  const sidefeltBlocks: any[] = (areas as any)?.sidefelt ?? []
  const midtenBlocks: any[] = (areas as any)?.midten ?? []
  const bunnBlocks: any[] = (areas as any)?.bunn ?? []


  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="pt-2"><HeroSection /></div>

      <div className="mt-4 flex gap-10">
        {/* Hovedinnhold */}
        <div className="min-w-0 flex-1">
          <Section title="Fremhevede historier" href="/historier">
            {featured.map((post: any) => (
              <Card key={post.id} href={`/historier/${post.slug}`} title={post.title} excerpt={post.excerpt}
                    imageUrl={mediaUrl(post.heroImage, 'card')} imageAlt={post.heroImage?.alt} meta={post.category?.title} />
            ))}
          </Section>

          {/* Midten-sone: mellom seksjoner, full variant */}
          {midtenBlocks.length > 0 && (
            <div className="py-6">
              <div className="grid gap-6 md:grid-cols-2">
                <RenderBlocks blocks={midtenBlocks} />
              </div>
            </div>
          )}

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

        {/* Sidefelt-sone: høyrespalte, kompakt variant */}
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            {sidefeltBlocks.length > 0 && (
              <RenderBlocks blocks={sidefeltBlocks} forceVariant="kompakt" />
            )}
            <Ad placement="sidebar" />
          </div>
        </aside>
      </div>

      {/* Bunn-sone: full bredde, kompakt variant, 3 kolonner */}
      {bunnBlocks.length > 0 && (
        <div className="mt-8 border-t border-ink/10 py-8">
          <div className="grid gap-4 md:grid-cols-3">
            <RenderBlocks blocks={bunnBlocks} forceVariant="kompakt" />
          </div>
        </div>
      )}
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
