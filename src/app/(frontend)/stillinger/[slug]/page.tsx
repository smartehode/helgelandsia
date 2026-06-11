import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { RichText } from '@/components/RichText'
import { ShareButtons } from '@/components/ShareButtons'
import { getPayloadClient } from '@/lib/getPayload'
import { SITE } from '@/lib/og'

export const dynamic = 'force-dynamic'

const JOB_TYPE: Record<string, string> = {
  'full-time': 'Heltid',
  'part-time': 'Deltid',
  'temp': 'Vikariat',
  'contract': 'Engasjement',
  'seasonal': 'Sesong',
  'apprentice': 'Lærling',
}

async function getJob(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'jobs',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const j: any = await getJob(slug)
  if (!j) return {}
  const title = `${j.title} — ${j.employer}`
  const description = [j.employer, j.locationName, j.jobType ? JOB_TYPE[j.jobType] : undefined].filter(Boolean).join(' · ')
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE}/stillinger/${slug}`, type: 'article' },
    twitter: { card: 'summary' },
  }
}

export default async function StillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const j: any = await getJob(slug)
  if (!j) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-sea">{j.title}</h1>
        <p className="mt-1 text-lg text-muted">{j.employer}</p>
        <ShareButtons title={`${j.title} — ${j.employer}`} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {j.jobType && (
          <span className="rounded-full bg-sea/10 px-3 py-1 text-sm font-medium text-sea">
            {JOB_TYPE[j.jobType] ?? j.jobType}
          </span>
        )}
        {j.locationName && (
          <span className="rounded-full bg-ink/5 px-3 py-1 text-sm text-ink/70">
            📍 {j.locationName}
          </span>
        )}
        {j.deadline && (
          <span className="rounded-full bg-ink/5 px-3 py-1 text-sm text-ink/70">
            Søknadsfrist: {format(new Date(j.deadline), 'd. MMMM yyyy', { locale: nb })}
          </span>
        )}
      </div>

      {j.description && (
        <div className="prose prose-slate max-w-none">
          <RichText data={j.description} />
        </div>
      )}

      <aside className="mt-10 rounded-2xl bg-paper p-6 ring-1 ring-ink/5 space-y-3">
        <h2 className="font-semibold text-sea">Søknadsinformasjon</h2>
        {j.contactName && <p className="text-sm text-ink">Kontaktperson: {j.contactName}{j.contactPhone ? ` · ${j.contactPhone}` : ''}</p>}
        {j.applicationEmail && (
          <p className="text-sm">
            ✉️ <a href={`mailto:${j.applicationEmail}`} className="text-sea hover:underline">{j.applicationEmail}</a>
          </p>
        )}
        {j.applicationUrl && (
          <a href={j.applicationUrl} target="_blank" rel="noopener"
             className="inline-block rounded-full bg-sea px-6 py-3 font-medium text-white transition hover:bg-fjord">
            Søk på stillingen
          </a>
        )}
      </aside>
    </div>
  )
}
