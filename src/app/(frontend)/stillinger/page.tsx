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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-sea">Ledige stillinger</h1>
      {docs.length === 0 ? (
        <p className="text-muted">Ingen stillinger er ute for øyeblikket.</p>
      ) : (
        <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
          {docs.map((j: any) => (
            <li key={j.id}>
              <Link href={`/stillinger/${j.slug}`} className="block px-6 py-5 hover:bg-ink/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{j.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{j.employer}{j.locationName ? ` · ${j.locationName}` : ''}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {j.jobType && (
                      <span className="rounded-full bg-sea/10 px-2.5 py-0.5 text-xs font-medium text-sea">
                        {JOB_TYPE[j.jobType] ?? j.jobType}
                      </span>
                    )}
                    {j.deadline && (
                      <span className="text-xs text-muted">
                        Frist: {format(new Date(j.deadline), 'd. MMM yyyy', { locale: nb })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
