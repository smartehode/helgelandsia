import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { RichText } from '@/components/RichText'
import { Card } from '@/components/Card'
import { ShareButtons } from '@/components/ShareButtons'
import { getPostBySlug } from '@/lib/queries'
import { getPayloadClient } from '@/lib/getPayload'
import { SITE, abs } from '@/lib/og'
import { bizUrl } from '@/lib/slug'

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 200,
    depth: 0,
  })
  return docs.map((p: any) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  const meta = (post as any).meta ?? {}
  const ogImage = abs(mediaUrl(meta.image ?? (post as any).heroImage, 'hero'))
  const title = meta.title ?? post.title
  const description = meta.description ?? (post as any).excerpt

  return {
    title,
    description,
    alternates: { canonical: `${SITE}/leserinnlegg/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/leserinnlegg/${slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: 'article',
    },
    twitter: { card: ogImage ? 'summary_large_image' : 'summary' },
  }
}

export default async function LeserinnleggDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const p = post as any
  const heroUrl = mediaUrl(p.heroImage, 'hero')

  return (
    <article>
      {heroUrl && (
        <div className="relative h-[40vh] w-full">
          <Image src={heroUrl} alt={p.heroImage?.alt ?? p.title} fill priority className="object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-prose px-4 py-12">
        {p.category?.title && (
          <span className="text-sm font-medium uppercase tracking-wide text-brand-600">
            {p.category.title}
          </span>
        )}
        <h1 className="mt-2 font-serif text-4xl font-bold text-sea">{p.title}</h1>
        <ShareButtons title={p.title} />

        <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
          {p.author?.name && <span>Av {p.author.name}</span>}
          {p.publishedAt && (
            <time dateTime={p.publishedAt}>
              {format(new Date(p.publishedAt), 'd. MMMM yyyy', { locale: nb })}
            </time>
          )}
        </div>

        {p.excerpt && <p className="mt-6 text-xl text-slate-600">{p.excerpt}</p>}

        <div className="mt-8">
          <RichText data={p.content} />
        </div>

        {Array.isArray(p.relatedBusinesses) && p.relatedBusinesses.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-serif text-xl font-bold text-sea">Relaterte bedrifter</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {p.relatedBusinesses.map((b: any) => (
                <Card
                  key={b.id}
                  href={bizUrl(b)}
                  title={b.name}
                  excerpt={b.tagline}
                  imageUrl={mediaUrl(b.logo, 'card')}
                  imageAlt={b.logo?.alt}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
