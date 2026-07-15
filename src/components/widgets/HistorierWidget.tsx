import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { getPayloadClient } from '@/lib/getPayload'

interface Props {
  title?: string
  count?: number
  variant?: 'full' | 'kompakt'
}

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

export async function HistorierWidget({ title = 'Siste leserinnlegg', count = 3, variant = 'full' }: Props) {
  const payload = await getPayloadClient()
  let posts: any[] = []
  try {
    const res = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: count,
      depth: 1,
    })
    posts = res.docs
  } catch { }
  if (!posts.length) return null

  if (variant === 'kompakt') {
    return (
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <Link href="/leserinnlegg" className="text-xs text-sea transition hover:underline">Se alle →</Link>
        </div>
        <ul className="divide-y divide-ink/5">
          {posts.map((post: any) => (
            <li key={post.id}>
              <Link
                href={`/leserinnlegg/${post.slug}`}
                className="block px-4 py-3 transition hover:bg-fog/50"
              >
                <p className="line-clamp-2 text-sm text-ink">{post.title}</p>
                {post.publishedAt && (
                  <p className="mt-0.5 text-[11px] text-muted">
                    {format(new Date(post.publishedAt), 'd. MMM yyyy', { locale: nb })}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <Link href="/leserinnlegg" className="text-xs font-medium text-sea transition hover:underline">
          Se alle →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {posts.map((post: any) => {
          const img = mediaUrl(post.heroImage, 'card') ?? mediaUrl(post.heroImage)
          return (
            <Link
              key={post.id}
              href={`/leserinnlegg/${post.slug}`}
              className="group overflow-hidden rounded-xl border border-ink/10 bg-white transition hover:shadow-sm"
            >
              <div className="aspect-[3/2] overflow-hidden bg-fog">
                {img
                  ? <img src={img} alt={post.heroImage?.alt ?? post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  : <div className="flex h-full w-full items-center justify-center"><span className="font-serif text-3xl text-sea/20">H</span></div>
                }
              </div>
              <div className="p-4">
                <h3 className="font-serif text-base font-semibold leading-snug text-ink transition group-hover:text-sea">
                  {post.title}
                </h3>
                {post.publishedAt && (
                  <p className="mt-2 text-[11px] text-muted">
                    {format(new Date(post.publishedAt), 'd. MMMM yyyy', { locale: nb })}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
