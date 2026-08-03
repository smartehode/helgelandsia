import { KOMMUNENAVN_UC } from './helgeland/kommuner'

export interface NavLocation {
  municipal?: string
  county?: string
  city?: string
}

export interface NavJob {
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

export function isHelgeland(job: NavJob): boolean {
  return (job.locationList ?? []).some(
    loc => loc.municipal && KOMMUNENAVN_UC.has(loc.municipal.toUpperCase()),
  )
}

export function getNavEmployer(job: NavJob): string {
  return job.employer?.name ?? job.businessName ?? ''
}

/** Returnerer ISO-streng for søknadsfrist, null for "Snarest" og ugyldige datoer. */
export function parseNavDeadline(job: NavJob): string | null {
  const raw = job.properties?.applicationdue ?? job.expires
  if (!raw || raw.toLowerCase() === 'snarest') return null
  try {
    const d = new Date(raw)
    return isNaN(d.getTime()) ? null : d.toISOString()
  } catch {
    return null
  }
}

export async function fetchNavJobs(): Promise<NavJob[]> {
  try {
    const res = await fetch(
      'https://arbeidsplassen.nav.no/stillinger/api/search?county=NORDLAND&size=50',
      {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 1800 },
        headers: { Accept: 'application/json' },
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
