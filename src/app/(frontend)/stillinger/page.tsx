import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Stillinger',
  description: 'Ledige stillinger på Helgeland.',
}

const JOB_TYPE: Record<string, string> = {
  'full-time': 'Heltid',
  'part-time': 'Deltid',
  'temp': 'Vikariat',
  'contract': 'Engasjement',
  'seasonal': 'Sesong',
  'apprentice': 'Lærling',
}

const BIDRA = `/logg-inn?fra=${encodeURIComponent('/min-side?type=stilling')}`

export default async function StillingerPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'jobs',
    where: { _status: { equals: 'published' } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold text-fjord">Ledige stillinger</h1>
        <Link
          href={BIDRA}
          className="shrink-0 rounded-full border border-fjord/30 px-4 py-2 text-sm font-medium text-fjord transition hover:bg-fjord hover:text-white"
        >
          + Lys ut stilling
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 bg-white px-8 py-14 text-center">
          <p className="text-base text-muted">Ingen stillinger er ute for øyeblikket.</p>
          <p className="mt-1 text-sm text-muted/70">Driver du bedrift? Lyse ut din neste stilling her.</p>
          <Link
            href={BIDRA}
            className="mt-6 inline-block rounded-full bg-fjord px-7 py-3 text-sm font-semibold text-white transition hover:bg-sea"
          >
            Lys ut en stilling
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ink/5 rounded-xl border border-ink/10 bg-white">
            {docs.map((j: any) => (
              <li key={j.id}>
                <Link
                  href={`/stillinger/${j.slug}`}
                  className="group flex items-start justify-between gap-4 px-6 py-5 transition hover:bg-fog/60"
                >
                  <div className="min-w-0">
                    <p className="font-serif font-semibold text-ink transition group-hover:text-sea">
                      {j.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {[j.employer, j.locationName].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {j.jobType && (
                      <span className="rounded-full bg-sea/10 px-2.5 py-0.5 text-xs font-medium text-sea">
                        {JOB_TYPE[j.jobType] ?? j.jobType}
                      </span>
                    )}
                    {j.deadline && (
                      <span className="tabular-nums text-xs text-muted">
                        Frist {format(new Date(j.deadline), 'd. MMM yyyy', { locale: nb })}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link href={BIDRA} className="text-sm font-medium text-fjord transition hover:text-sea">
              Skal du ansette? Lys ut en stilling →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
