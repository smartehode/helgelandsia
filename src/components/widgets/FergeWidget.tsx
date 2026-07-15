import type { WidgetVariant } from './PowerPriceWidget'
import { FergeSlider, type StopData, type Departure } from './FergeSlider'

// Én kilde til sannhet for Helgeland-kaier.
// Samme NSR-ID-er brukes som verdier i FergeBlock-options (blocks/index.ts).
// Verifisert mot Entur API 2026-07-15.
// shortName: kortversjon for navneraden under slideren.
// Plasser med to kaier (Sandnessjøen, Træna) disambigueres med "hb."/"ferje".
const ALL_STOPS = [
  { id: 'NSR:StopPlace:49452', name: 'Sandnessjøen hurtigbåtkai', shortName: 'Sandnessjøen hb.' },
  { id: 'NSR:StopPlace:47666', name: 'Sandnessjøen ferjekai',     shortName: 'Sandnessjøen ferje' },
  { id: 'NSR:StopPlace:59239', name: 'Nesna kai',                 shortName: 'Nesna' },
  { id: 'NSR:StopPlace:63216', name: 'Tjøtta kai',                shortName: 'Tjøtta' },
  { id: 'NSR:StopPlace:47674', name: 'Levang ferjekai',           shortName: 'Levang' },
  { id: 'NSR:StopPlace:47440', name: 'Herøy ferjekai',            shortName: 'Herøy' },
  { id: 'NSR:StopPlace:48835', name: 'Brønnøysund hurtigbåtkai',  shortName: 'Brønnøysund' },
  { id: 'NSR:StopPlace:50291', name: 'Træna hurtigbåtkai',        shortName: 'Træna hb.' },
  { id: 'NSR:StopPlace:47694', name: 'Træna ferjekai',            shortName: 'Træna ferje' },
]

interface StopInput {
  id: string
  name: string
  shortName: string
}

interface Props {
  title?: string
  stopIds?: string[]  // NSR-ID-er fra multi-select; undefined = alle
  count?: number
  variant?: WidgetVariant
}

const ENTUR_URL = 'https://api.entur.io/journey-planner/v3/graphql'
const CLIENT_NAME = 'helgelandsia.no'

function buildQuery(stopId: string, count: number): string {
  return `{
    stopPlace(id: "${stopId}") {
      estimatedCalls(
        timeRange: 86400
        numberOfDepartures: ${count}
      ) {
        aimedDepartureTime
        cancellation
        serviceJourney { line { publicCode transportMode } }
        destinationDisplay { frontText }
      }
    }
  }`
}

async function fetchStop(stop: StopInput, count: number): Promise<StopData | null> {
  try {
    const res = await fetch(ENTUR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ET-Client-Name': CLIENT_NAME,
      },
      body: JSON.stringify({ query: buildQuery(stop.id, count) }),
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null

    const json = await res.json()
    const calls: any[] = json?.data?.stopPlace?.estimatedCalls ?? []
    const now = new Date()

    const departures: Departure[] = calls
      .filter((c: any) =>
        new Date(c.aimedDepartureTime) > now &&
        c.serviceJourney?.line?.transportMode === 'water',
      )
      .map((c: any) => ({
        aimedTime: c.aimedDepartureTime,
        cancelled: c.cancellation === true,
        destination: c.destinationDisplay?.frontText ?? '—',
        lineCode: c.serviceJourney?.line?.publicCode ?? '',
      }))

    if (!departures.length) return null
    return { stopName: stop.name, shortName: stop.shortName, departures }
  } catch {
    return null
  }
}

export async function FergeWidget({
  title = 'Ferger og hurtigbåt',
  stopIds,
  count = 5,
  variant = 'full',
}: Props) {
  const stopsToFetch = stopIds?.length
    ? ALL_STOPS.filter(s => stopIds.includes(s.id))
    : ALL_STOPS

  const settled = await Promise.allSettled(stopsToFetch.map(s => fetchStop(s, count)))
  const stops: StopData[] = settled
    .map(r => (r.status === 'fulfilled' ? r.value : null))
    .filter((s): s is StopData => s !== null)

  if (!stops.length) return null

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="border-b border-ink/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>

      <FergeSlider stops={stops} variant={variant} />

      <div className="border-t border-ink/5 px-4 py-2">
        <p className="text-[11px] text-muted">
          Planlagte avganger fra{' '}
          <a
            href="https://entur.no"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sea"
          >
            Entur
          </a>
          {' '}(NLOD 2.0) · ikke sanntid
        </p>
      </div>
    </div>
  )
}
