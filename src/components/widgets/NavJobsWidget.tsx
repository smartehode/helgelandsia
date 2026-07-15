import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { WidgetVariant } from './PowerPriceWidget'
import { KOMMUNENAVN_UC } from '@/lib/helgeland/kommuner'

interface Props {
  title?: string
  count?: number
  variant?: WidgetVariant
}

// NAV-API returnerer kommunenavn som store bokstaver, f.eks. "BRØNNØY".
// Hentes fra src/lib/helgeland/kommuner.ts — énkildes sannhet.
// MELØY (Salten) er fjernet; var feilaktig inkludert.
const HELGELAND_KOMMUNER = KOMMUNENAVN_UC

interface NavLocation {
  municipal?: string
  county?: string
  city?: string
}

interface NavJob {
  uuid: string
  title?: string
  businessName?: string
  employer?: { name?: string }
  locationList?: NavLocation[]
  properties?: {
    applicationdue?: string
    jobtitle?: string
  }
  expires?: string
}

function getMunicipal(job: NavJob): string | undefined {
  const raw = job.locationList?.[0]?.municipal
  if (!raw) return undefined
  // Gjør om "BRØNNØY" → "Brønnøy"
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

function isHelgeland(job: NavJob): boolean {
  return (job.locationList ?? []).some(
    loc => loc.municipal && HELGELAND_KOMMUNER.has(loc.municipal.toUpperCase()),
  )
}

function getDeadline(job: NavJob): string | undefined {
  const raw = job.properties?.applicationdue ?? job.expires
  if (!raw || raw.toLowerCase() === 'snarest') return raw ?? undefined
  try {
    return format(new Date(raw), 'd. MMM', { locale: nb })
  } catch {
    return undefined
  }
}

function getEmployer(job: NavJob): string | undefined {
  return job.employer?.name ?? job.businessName
}

async function fetchNavJobs(): Promise<NavJob[]> {
  try {
    const res = await fetch(
      'https://arbeidsplassen.nav.no/stillinger/api/search?county=NORDLAND&size=50',
      {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 1800 },
        headers: { 'Accept': 'application/json' },
      },
    )
    if (!res.ok) return []
    const data = await res.json()
    // Respons: { hits: { hits: [{ _source: NavJob }] } }
    return (data.hits?.hits ?? []).map((h: { _source: NavJob }) => h._source)
  } catch {
    return []
  }
}

export async function NavJobsWidget({ title, count = 6, variant = 'full' }: Props) {
  const all = await fetchNavJobs()
  const jobs = all.filter(isHelgeland).slice(0, count)

  const heading = title ?? 'Ledige stillinger på Helgeland'

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>

      {jobs.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Ingen stillinger funnet akkurat nå.</p>
      ) : (
        <div className="mt-4 divide-y divide-ink/5">
          {jobs.map(job => {
            const deadline = getDeadline(job)
            const municipality = getMunicipal(job)
            const employer = getEmployer(job)
            return (
              <Link
                key={job.uuid}
                href={`https://arbeidsplassen.nav.no/stillinger/stilling/${job.uuid}`}
                target="_blank" rel="noopener"
                className="block py-3 first:pt-0 last:pb-0 hover:text-sea"
              >
                <p className="font-medium text-ink leading-snug">{job.title}</p>
                {variant === 'full' && (
                  <p className="mt-0.5 text-xs text-muted">
                    {[employer, municipality, deadline ? `Frist ${deadline}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {variant === 'kompakt' && employer && (
                  <p className="mt-0.5 text-xs text-muted">{employer}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Kilde: NAV Arbeidsplassen ·{' '}
        <Link href="/stillinger" className="underline hover:text-sea">
          Se også lokale stillinger her på Helgelandsia
        </Link>
      </p>
    </div>
  )
}
