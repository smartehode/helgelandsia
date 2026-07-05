import { getPayloadClient } from '@/lib/getPayload'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
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
      <h1 className="mb-8 font-serif text-3xl font-semibold text-fjord">Ledige stillinger</h1>

      {docs.length === 0 ? (
        <p className="text-muted">Ingen stillinger er ute for øyeblikket.</p>
      ) : (
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
      )}
    </div>
  )
}
