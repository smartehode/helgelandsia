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

const JOB_TYPE_SCHEMA: Record<string, string> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  'temp': 'TEMPORARY',
  'contract': 'CONTRACTOR',
  'seasonal': 'TEMPORARY',
  'apprentice': 'INTERN',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const j: any = await getJob(slug)
  if (!j) return {}
  // "[Tittel] – [arbeidsgiver] i [sted]" for unik og informativ tittel
  const titleParts = [j.title, j.employer ? `– ${j.employer}` : null, j.locationName ? `i ${j.locationName}` : null]
  const title = titleParts.filter(Boolean).join(' ')
  const description = [
    j.employer,
    j.locationName,
    j.jobType ? JOB_TYPE[j.jobType] : undefined,
    j.deadline ? `Frist ${new Date(j.deadline).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}` : undefined,
  ].filter(Boolean).join(' · ')
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/stillinger/${slug}` },
    openGraph: { title, description, url: `${SITE}/stillinger/${slug}`, type: 'article' },
    twitter: { card: 'summary' },
  }
}

export default async function StillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const j: any = await getJob(slug)
  if (!j) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: j.title,
    hiringOrganization: { '@type': 'Organization', name: j.employer },
    ...(j.locationName && {
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: j.locationName, addressCountry: 'NO' } },
    }),
    ...(j.createdAt && { datePosted: j.createdAt }),
    ...(j.deadline && { validThrough: j.deadline }),
    ...(j.jobType && { employmentType: JOB_TYPE_SCHEMA[j.jobType] ?? 'OTHER' }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="mx-auto max-w-4xl px-4 py-12">

      {/* Overskrift */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-fjord">{j.title}</h1>
        <p className="mt-1 text-base text-muted">{j.employer}</p>
        <div className="mt-3">
          <ShareButtons title={`${j.title} — ${j.employer}`} />
        </div>
      </div>

      {/* Etiketter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {j.jobType && (
          <span className="rounded-full bg-sea/10 px-3 py-1 text-sm font-medium text-sea">
            {JOB_TYPE[j.jobType] ?? j.jobType}
          </span>
        )}
        {j.locationName && (
          <span className="rounded-full border border-ink/10 px-3 py-1 text-sm text-muted">
            📍 {j.locationName}
          </span>
        )}
        {j.deadline && (
          <span className="rounded-full border border-ink/10 px-3 py-1 text-sm text-muted">
            Frist: {format(new Date(j.deadline), 'd. MMMM yyyy', { locale: nb })}
          </span>
        )}
      </div>

      {/* Stillingsbeskrivelse */}
      {j.description && (
        <div className="prose prose-slate max-w-none">
          <RichText data={j.description} />
        </div>
      )}

      {/* Søknadsinformasjon */}
      <aside className="mt-10 space-y-3 rounded-xl border border-ink/10 bg-white p-6">
        <h2 className="font-serif font-semibold text-fjord">Søknadsinformasjon</h2>
        {j.contactName && (
          <p className="text-sm text-ink">
            Kontaktperson: {j.contactName}
            {j.contactPhone ? ` · ${j.contactPhone}` : ''}
          </p>
        )}
        {j.applicationEmail && (
          <p className="text-sm">
            <a href={`mailto:${j.applicationEmail}`} className="text-sea hover:underline">
              {j.applicationEmail}
            </a>
          </p>
        )}
        {j.applicationUrl && (
          <a
            href={j.applicationUrl}
            target="_blank"
            rel="noopener"
            className="inline-block rounded-full bg-fjord px-6 py-3 text-sm font-semibold text-white transition hover:bg-fjord/90"
          >
            Søk på stillingen
          </a>
        )}
      </aside>
    </div>
    </>
  )
}
