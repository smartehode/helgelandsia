import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { getPayloadClient } from '@/lib/getPayload'
import type { WidgetVariant } from './PowerPriceWidget'

interface Props {
  title?: string
  count?: number
  variant?: WidgetVariant
}

export async function AnbudWidget({
  title = 'Siste offentlige anbud',
  count = 5,
  variant = 'full',
}: Props) {
  const payload = await getPayloadClient()
  const now = new Date()

  let tenders: any[] = []
  try {
    const res = await payload.find({
      collection: 'tenders' as any,
      where: {
        and: [
          { status: { equals: 'ACTIVE' } },
          {
            or: [
              { deadline: { greater_than: now.toISOString() } },
              { deadline: { exists: false } },
            ],
          },
        ],
      },
      sort: '-publicationDate',
      limit: count,
      depth: 0,
      overrideAccess: true,
    })
    tenders = res.docs as any[]
  } catch {
    // Databasefeil — viser ingenting
  }

  if (!tenders.length) return null

  return (
    <div className="rounded-xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-4 pb-3 pt-4">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <Link href="/anbud" className="text-xs font-medium text-sea hover:underline">
          Se alle →
        </Link>
      </div>
      <ul className="divide-y divide-ink/5">
        {tenders.map((t: any) => (
          <li key={t.id}>
            <a
              href={t.doffinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-fog/60"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-medium text-ink transition group-hover:text-sea">
                  {t.title}
                </p>
                {variant === 'full' && t.buyerName && (
                  <p className="mt-0.5 truncate text-xs text-muted">{t.buyerName}</p>
                )}
              </div>
              {t.deadline && (
                <span className="shrink-0 whitespace-nowrap tabular-nums text-[11px] text-muted">
                  {format(new Date(t.deadline), 'd. MMM', { locale: nb })}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
