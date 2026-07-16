import Link from 'next/link'
import { Card } from '@/components/Card'
import { getLatestPosts } from '@/lib/queries'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Leserinnlegg',
  description: 'Leserinnlegg og artikler fra Helgeland.',
}

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

const BIDRA = `/logg-inn?fra=${encodeURIComponent('/min-side?type=artikkel')}`

export default async function LeserinnleggPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>
}) {
  const { side } = await searchParams
  const page = Number(side ?? '1')
  const result = await getLatestPosts(9, page)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold text-sea">Leserinnlegg</h1>
        <Link
          href={BIDRA}
          className="shrink-0 rounded-full border border-fjord/30 px-4 py-2 text-sm font-medium text-fjord transition hover:bg-fjord hover:text-white"
        >
          + Skriv leserinnlegg
        </Link>
      </div>

      {result.docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 bg-white px-8 py-14 text-center">
          <p className="text-base text-muted">Ingen leserinnlegg er publisert ennå.</p>
          <p className="mt-1 text-sm text-muted/70">Del noe med Helgeland — bli den første!</p>
          <Link
            href={BIDRA}
            className="mt-6 inline-block rounded-full bg-fjord px-7 py-3 text-sm font-semibold text-white transition hover:bg-sea"
          >
            Skriv et leserinnlegg
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.docs.map((post: any) => (
              <Card
                key={post.id}
                href={`/leserinnlegg/${post.slug}`}
                title={post.title}
                excerpt={post.excerpt}
                imageUrl={mediaUrl(post.heroImage, 'card')}
                imageAlt={post.heroImage?.alt}
                meta={post.category?.title}
              />
            ))}
          </div>

          <div className="mt-10 flex justify-center gap-2">
            {result.hasPrevPage && (
              <Link href={`/leserinnlegg?side=${page - 1}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-white">
                ← Forrige
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-slate-500">
              Side {result.page} av {result.totalPages}
            </span>
            {result.hasNextPage && (
              <Link href={`/leserinnlegg?side=${page + 1}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-white">
                Neste →
              </Link>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link href={BIDRA} className="text-sm font-medium text-fjord transition hover:text-sea">
              Har du noe å dele? Skriv et leserinnlegg →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
