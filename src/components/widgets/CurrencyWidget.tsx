import type { WidgetVariant } from './PowerPriceWidget'

export type CurrencyItem = 'usd' | 'eur' | 'btc' | 'brent'

interface Props {
  title?: string
  show?: CurrencyItem[]
  variant?: WidgetVariant
}

interface Rate {
  code: CurrencyItem
  label: string
  price: number
  unit: string
  change?: number
  changePct?: number
}

// --- Hjelpefunksjoner ---

function prevWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return d.toISOString().split('T')[0]
}

async function fetchFrankfurter(from: string, to: string): Promise<Rate | null> {
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 1800 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const price: number = data.rates[to]
    if (!price) return null

    let change: number | undefined
    let changePct: number | undefined
    try {
      const prev = await fetch(
        `https://api.frankfurter.app/${prevWeekday(data.date)}?from=${from}&to=${to}`,
        { signal: AbortSignal.timeout(5000), next: { revalidate: 1800 } },
      )
      if (prev.ok) {
        const prevData = await prev.json()
        const prevPrice: number = prevData.rates[to]
        if (prevPrice) {
          change = price - prevPrice
          changePct = (change / prevPrice) * 100
        }
      }
    } catch {}

    const code: CurrencyItem = from.toLowerCase() as CurrencyItem
    return { code, label: `${from}/${to}`, price, unit: to, change, changePct }
  } catch {
    return null
  }
}

async function fetchBitcoin(): Promise<Rate | null> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC', {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 1800 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const price = parseFloat(data?.data?.rates?.USD)
    if (isNaN(price)) return null
    return { code: 'btc', label: 'Bitcoin', price, unit: 'USD' }
  } catch {
    return null
  }
}

async function fetchBrent(): Promise<Rate | null> {
  try {
    const res = await fetch('https://stooq.com/q/l/?s=cb.f&i=d', {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 1800 },
    })
    if (!res.ok) return null
    const csv = await res.text()
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return null
    const headers = lines[0].split(',')
    const closeIdx = headers.findIndex(h => h.trim() === 'Close')
    if (closeIdx === -1) return null
    const price = parseFloat(lines[1].split(',')[closeIdx])
    if (isNaN(price)) return null
    return { code: 'brent', label: 'Brent råolje', price, unit: 'USD/fat' }
  } catch {
    return null
  }
}

// --- Formatering ---

function fmtPrice(rate: Rate): string {
  if (rate.code === 'btc') {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(rate.price) + ' USD'
  }
  if (rate.code === 'brent') {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(rate.price) + ' USD/fat'
  }
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(rate.price) + ' NOK'
}

function fmtChange(rate: Rate): { text: string; up: boolean } | null {
  if (rate.change === undefined || rate.changePct === undefined) return null
  const abs = Math.abs(rate.change)
  const pct = Math.abs(rate.changePct)
  const sign = rate.change >= 0 ? '+' : '−'
  const absStr = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(abs)
  const pctStr = pct.toFixed(2).replace('.', ',')
  return { text: `${sign}${absStr} (${sign}${pctStr} %)`, up: rate.change >= 0 }
}

// --- Widget ---

export async function CurrencyWidget({
  title,
  show,
  variant = 'full',
}: Props) {
  const showItems: CurrencyItem[] = show?.length ? show : ['usd', 'eur', 'btc', 'brent']
  const heading = title ?? 'Valuta & råvarer'

  const [usdRes, eurRes, btcRes, brentRes] = await Promise.allSettled([
    showItems.includes('usd') ? fetchFrankfurter('USD', 'NOK') : Promise.resolve(null),
    showItems.includes('eur') ? fetchFrankfurter('EUR', 'NOK') : Promise.resolve(null),
    showItems.includes('btc') ? fetchBitcoin()                  : Promise.resolve(null),
    showItems.includes('brent') ? fetchBrent()                  : Promise.resolve(null),
  ])

  const rates: Rate[] = [
    usdRes.status === 'fulfilled' ? usdRes.value : null,
    eurRes.status === 'fulfilled' ? eurRes.value : null,
    btcRes.status === 'fulfilled' ? btcRes.value : null,
    brentRes.status === 'fulfilled' ? brentRes.value : null,
  ].filter((r): r is Rate => r !== null)

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>

      {rates.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Kunne ikke hente kurser akkurat nå.</p>
      ) : (
        <div className="mt-4 divide-y divide-ink/5">
          {rates.map(rate => {
            const ch = fmtChange(rate)
            return (
              <div key={rate.code} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-ink">{rate.label}</span>
                <div className="flex min-w-0 flex-col items-end text-right">
                  <span className="tabular-nums text-sm font-semibold text-ink">
                    {fmtPrice(rate)}
                  </span>
                  {variant === 'full' && ch && (
                    <span className={`tabular-nums text-xs ${ch.up ? 'text-green-600' : 'text-red-600'}`}>
                      {ch.text}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Kurser fra Frankfurter API, Coinbase og Stooq. Kun veiledende.
      </p>
    </div>
  )
}
