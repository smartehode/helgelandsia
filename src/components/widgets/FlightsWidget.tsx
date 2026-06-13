import Link from 'next/link'
import type { WidgetVariant } from './PowerPriceWidget'

export type Airport = 'BNN' | 'SSJ' | 'MJF'
export type FlightDirection = 'departure' | 'arrival' | 'begge'

interface Props {
  title?: string
  airports?: Airport[]
  direction?: FlightDirection
  count?: number
  variant?: WidgetVariant
}

const AIRPORT_NAMES: Record<Airport, string> = {
  BNN: 'Brønnøysund',
  SSJ: 'Sandnessjøen',
  MJF: 'Mosjøen',
}

const AIRPORT_SLUGS: Record<Airport, string> = {
  BNN: 'bronnoysund',
  SSJ: 'sandnessjoen',
  MJF: 'mosjoen',
}

const IATA_CITY: Record<string, string> = {
  TRD: 'Trondheim', BOO: 'Bodø', OSL: 'Oslo',
  MQN: 'Mo i Rana', BNN: 'Brønnøysund', SSJ: 'Sandnessjøen', MJF: 'Mosjøen',
  TOS: 'Tromsø', EVE: 'Harstad/Narvik', BGO: 'Bergen', SVG: 'Stavanger',
  KRS: 'Kristiansand', AES: 'Ålesund', SKN: 'Stokmarknes', ANX: 'Andenes',
}

interface ParsedFlight {
  flight_id: string
  schedule_time: string  // UTC ISO
  airport: string
  arr_dep: string
  status_code: string
  status_time: string
}

// --- XML-parsing ---

function extractText(xml: string, tag: string): string {
  return xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim() ?? ''
}

function extractAttr(xml: string, tag: string, attr: string): string {
  return xml.match(new RegExp(`<${tag}[^>]*\\b${attr}="([^"]*)"`)) ?.[1]?.trim() ?? ''
}

function parseXml(xml: string): ParsedFlight[] {
  return [...xml.matchAll(/<flight\b[^>]*>([\s\S]*?)<\/flight>/g)].map(m => {
    const f = m[1]
    return {
      flight_id: extractText(f, 'flight_id'),
      schedule_time: extractText(f, 'schedule_time'),
      airport: extractText(f, 'airport'),
      arr_dep: extractText(f, 'arr_dep'),
      status_code: extractAttr(f, 'status', 'code'),
      status_time: extractAttr(f, 'status', 'time'),
    }
  }).filter(f => !!f.flight_id && !!f.schedule_time)
}

// --- Tid-formatering ---

function fmtOslo(utcIso: string): string {
  if (!utcIso) return '—'
  const d = new Date(utcIso)

  const osloDate = (ref: Date) =>
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Oslo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(ref)

  const time = new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit',
  }).format(d)

  const today = osloDate(new Date())
  const tomorrow = osloDate(new Date(Date.now() + 86_400_000))
  const yesterday = osloDate(new Date(Date.now() - 86_400_000))
  const flightDay = osloDate(d)

  if (flightDay === today) return `kl. ${time}`
  if (flightDay === tomorrow) return `i morgen kl. ${time}`
  if (flightDay === yesterday) return `i går kl. ${time}`

  const dateLabel = new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo', day: 'numeric', month: 'short',
  }).format(d)
  return `${dateLabel} kl. ${time}`
}

function cityName(iata: string): string {
  return IATA_CITY[iata] ?? iata
}

// --- API-henting ---

async function fetchXml(
  iata: Airport,
  direction: 'D' | 'A',
  timeFrom: number,
  timeTo: number,
): Promise<ParsedFlight[]> {
  const url =
    `https://asrv.avinor.no/XmlFeed/v1.0` +
    `?airport=${iata}&TimeFrom=${timeFrom}&TimeTo=${timeTo}&direction=${direction}`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/xml, text/xml, */*' },
    })
    if (!res.ok) return []
    return parseXml(await res.text())
  } catch {
    return []
  }
}

interface AirportStatus {
  iata: Airport
  departures: ParsedFlight[]  // sortert, fremtidige først
  arrivals: ParsedFlight[]    // sortert, nyeste ankomst først
  depError: boolean
  arrError: boolean
}

async function fetchAirportStatus(iata: Airport): Promise<AirportStatus> {
  const [depResult, arrResult] = await Promise.allSettled([
    fetchXml(iata, 'D', 6, 24),
    fetchXml(iata, 'A', 6, 6),
  ])

  const depRaw = depResult.status === 'fulfilled' ? depResult.value : null
  const arrRaw = arrResult.status === 'fulfilled' ? arrResult.value : null

  const now = new Date()

  // Fremtidige avganger; fallback til siste avgang (alle er gått)
  let departures: ParsedFlight[] = []
  if (depRaw) {
    const upcoming = depRaw.filter(f => new Date(f.schedule_time) > now)
    departures = upcoming.length > 0 ? upcoming : depRaw.slice(-1)
  }

  // Nyeste ankomster: landede (status A) nyeste først, fallback til siste i listen
  let arrivals: ParsedFlight[] = []
  if (arrRaw) {
    const landed = [...arrRaw]
      .filter(f => f.status_code === 'A')
      .sort((a, b) => new Date(b.schedule_time).getTime() - new Date(a.schedule_time).getTime())
    arrivals = landed.length > 0 ? landed : arrRaw.slice(-1)
  }

  return { iata, departures, arrivals, depError: depRaw === null, arrError: arrRaw === null }
}

// --- Visningskomponenter ---

// Material Design "flight"-ikon (planet peker mot høyre), rotert for avgang/ankomst
function PlaneIcon({ type }: { type: 'dep' | 'arr' }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
      className="shrink-0 text-sea"
      style={{ transform: type === 'dep' ? 'rotate(-45deg)' : 'rotate(135deg)' }}
      aria-hidden="true"
    >
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  )
}

// Én enkelt flyrad: ikon + tid (med evt. stryking) + sted + flightnummer
function FlightRow({
  f,
  type,
  showFlightId = true,
}: {
  f: ParsedFlight
  type: 'dep' | 'arr'
  showFlightId?: boolean
}) {
  const cancelled = f.status_code === 'C'
  const hasNewTime =
    f.status_code === 'E' && !!f.status_time && f.status_time !== f.schedule_time
  const shownTime = hasNewTime ? f.status_time : f.schedule_time

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <PlaneIcon type={type} />

      {cancelled ? (
        <>
          <span className="font-medium text-red-600">Innstilt</span>
          <span className="text-xs text-muted line-through">{fmtOslo(f.schedule_time)}</span>
          <span className="text-xs text-muted">{cityName(f.airport)}</span>
        </>
      ) : (
        <>
          {hasNewTime && (
            <span className="tabular-nums text-xs text-muted line-through">
              {fmtOslo(f.schedule_time)}
            </span>
          )}
          <span className={`tabular-nums font-medium shrink-0 ${hasNewTime ? 'text-amber-700' : 'text-ink'}`}>
            {fmtOslo(shownTime)}
          </span>
          <span className="text-ink">
            {type === 'arr' ? 'fra ' : ''}{cityName(f.airport)}
          </span>
        </>
      )}

      {showFlightId && (
        <span className="ml-auto shrink-0 text-xs text-muted">{f.flight_id}</span>
      )}
    </div>
  )
}

// Kompakt: neste avgang + siste ankomst, ingen etiketter
function AirportKompakt({ status }: { status: AirportStatus }) {
  const { iata, departures, arrivals, depError, arrError } = status
  const nextDep = departures[0] ?? null
  const lastArr = arrivals[0] ?? null

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <Link
        href={`https://avinor.no/flyplass/${AIRPORT_SLUGS[iata]}/flytider/`}
        target="_blank" rel="noopener"
        className="mb-1.5 flex items-center justify-between"
      >
        <span className="text-sm font-medium text-sea hover:underline">{AIRPORT_NAMES[iata]}</span>
        <span className="text-xs text-muted">{iata}</span>
      </Link>

      <div className="space-y-0.5">
        {depError ? (
          <div className="flex items-center gap-1.5 text-xs text-muted"><PlaneIcon type="dep" /> Ikke tilgjengelig</div>
        ) : nextDep ? (
          <FlightRow f={nextDep} type="dep" showFlightId={false} />
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted"><PlaneIcon type="dep" /> Ingen planlagt</div>
        )}

        {arrError ? (
          <div className="flex items-center gap-1.5 text-xs text-muted"><PlaneIcon type="arr" /> Ikke tilgjengelig</div>
        ) : lastArr ? (
          <FlightRow f={lastArr} type="arr" showFlightId={false} />
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted"><PlaneIcon type="arr" /> Ingen registrert</div>
        )}
      </div>
    </div>
  )
}

// Full: opptil 4 avganger + 4 ankomster med flightnummer
function AirportFull({ status }: { status: AirportStatus }) {
  const { iata, departures, arrivals, depError, arrError } = status
  const shownDeps = departures.slice(0, 4)
  const shownArrs = arrivals.slice(0, 4)

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <Link
        href={`https://avinor.no/flyplass/${AIRPORT_SLUGS[iata]}/flytider/`}
        target="_blank" rel="noopener"
        className="mb-2 flex items-center justify-between"
      >
        <span className="font-medium text-sea hover:underline">{AIRPORT_NAMES[iata]}</span>
        <span className="text-xs text-muted">{iata}</span>
      </Link>

      <div className="space-y-1">
        {depError ? (
          <div className="flex items-center gap-1.5 text-sm text-muted"><PlaneIcon type="dep" /> Avganger ikke tilgjengelig</div>
        ) : shownDeps.length > 0 ? (
          shownDeps.map(f => <FlightRow key={f.flight_id + f.schedule_time} f={f} type="dep" />)
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-muted"><PlaneIcon type="dep" /> Ingen planlagte avganger</div>
        )}

        <div className="pt-1">
          {arrError ? (
            <div className="flex items-center gap-1.5 text-sm text-muted"><PlaneIcon type="arr" /> Ankomster ikke tilgjengelig</div>
          ) : shownArrs.length > 0 ? (
            shownArrs.map(f => <FlightRow key={f.flight_id + f.schedule_time} f={f} type="arr" />)
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-muted"><PlaneIcon type="arr" /> Ingen registrerte ankomster</div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Eksportert widget ---

export async function FlightsWidget({
  title,
  airports = ['BNN', 'SSJ', 'MJF'],
  variant = 'full',
}: Props) {
  const results = await Promise.all(airports.map(fetchAirportStatus))
  const heading = title ?? 'Flytider Helgeland'

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>

      <div className={`mt-4 divide-y divide-ink/5`}>
        {results.map(status =>
          variant === 'kompakt'
            ? <AirportKompakt key={status.iata} status={status} />
            : <AirportFull key={status.iata} status={status} />,
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted">
        <Link href="https://www.avinor.no" target="_blank" rel="noopener"
          className="underline hover:text-sea">
          Flydata fra Avinor
        </Link>
      </p>
    </div>
  )
}
