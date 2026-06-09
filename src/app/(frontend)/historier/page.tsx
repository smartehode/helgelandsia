import Link from 'next/link'
import { Card } from '@/components/Card'
import { getLatestPosts } from '@/lib/queries'
import type { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Historier',
  description: 'Lokale historier og artikler fra Helgeland.',
}

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>
}) {
  const { side } = await searchParams
  const page = Number(side ?? '1')
  const result = await getLatestPosts(9, page)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-sea">Historier</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.docs.map((post: any) => (
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
      </div>

      {/* Paginering */}
      <div className="mt-10 flex justify-center gap-2">
        {result.hasPrevPage && (
          <Link href={`/historier?side=${page - 1}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-white">
            ← Forrige
          </Link>
        )}
        <span className="px-4 py-2 text-sm text-slate-500">
          Side {result.page} av {result.totalPages}
        </span>
        {result.hasNextPage && (
          <Link href={`/historier?side=${page + 1}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-white">
            Neste →
          </Link>
        )}
      </div>
    </div>
  )
}
