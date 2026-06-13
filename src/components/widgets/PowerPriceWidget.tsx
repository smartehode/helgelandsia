import Link from 'next/link'

export type PowerZone = 'NO1' | 'NO2' | 'NO3' | 'NO4' | 'NO5'
export type WidgetVariant = 'full' | 'kompakt'

interface Props {
  title?: string
  zone?: PowerZone
  variant?: WidgetVariant
}

interface HourPrice {
  NOK_per_kWh: number
  time_start: string
}

async function fetchPrices(zone: PowerZone): Promise<HourPrice[]> {
  const dateStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Oslo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const [year, month, day] = dateStr.split('-')
  try {
    const res = await fetch(
      `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${zone}.json`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 1800 } },
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString('nb-NO', {
    timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit',
  })

export async function PowerPriceWidget({ title, zone = 'NO4', variant = 'full' }: Props) {
  const prices = await fetchPrices(zone)
  const heading = title ?? `Strømpriser ${zone}`

  if (!prices.length) {
    return (
      <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
        <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>
        <p className="mt-4 text-sm text-muted">Priser ikke tilgjengelig akkurat nå.</p>
      </div>
    )
  }

  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Oslo', hour: '2-digit', hour12: false,
    }).format(new Date()),
  )

  const ore = prices.map(p => Math.round(p.NOK_per_kWh * 100))
  const maxVal = Math.max(...ore)
  const minVal = Math.min(...ore)
  const cheapestIdx = ore.indexOf(minVal)
  const mostExpIdx = ore.indexOf(maxVal)
  const nowOre = ore[currentHour] ?? ore[0]

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums text-ink">{nowOre}</span>
        <span className="text-sm text-muted">øre/kWh nå (time {currentHour}:00)</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <span className="font-medium text-emerald-600">
          ▼ {minVal} øre · kl. {formatClock(prices[cheapestIdx].time_start)}
        </span>
        <span className="font-medium text-red-500">
          ▲ {maxVal} øre · kl. {formatClock(prices[mostExpIdx].time_start)}
        </span>
      </div>

      {variant === 'full' && (
        <div className="mt-5">
          <div className="flex h-16 items-end gap-px">
            {ore.map((val, i) => {
              const heightPct = maxVal > 0 ? Math.max((val / maxVal) * 100, 5) : 5
              const isCheapest = i === cheapestIdx
              const isMostExp = i === mostExpIdx
              const isCurrent = i === currentHour
              return (
                <div
                  key={i}
                  style={{ height: `${heightPct}%` }}
                  title={`${String(i).padStart(2, '0')}:00 — ${val} øre`}
                  className={[
                    'flex-1 rounded-t',
                    isCheapest ? 'bg-emerald-400' : isMostExp ? 'bg-red-400' : 'bg-sea/35',
                    isCurrent ? 'ring-1 ring-fjord ring-offset-0' : '',
                  ].join(' ')}
                />
              )
            })}
          </div>
          <div className="mt-1 flex justify-between px-px text-[10px] text-muted select-none">
            {[0, 4, 8, 12, 16, 20, 23].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Kilde:{' '}
        <Link href="https://www.hvakosterstrommen.no" target="_blank" rel="noopener"
          className="underline hover:text-sea">
          hvakosterstrommen.no
        </Link>
      </p>
    </div>
  )
}
