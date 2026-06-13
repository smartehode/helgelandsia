import type { WidgetVariant } from './PowerPriceWidget'
import { CalendarClient, type HolidayMap } from './CalendarClient'

interface Props {
  title?: string
  variant?: WidgetVariant
}

async function fetchHolidaysForYear(year: number): Promise<Record<string, string>> {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/NO`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return {}
    const data: { date: string; localName: string }[] = await res.json()
    return Object.fromEntries(data.map(h => [h.date, h.localName]))
  } catch {
    return {}
  }
}

export async function CalendarWidget({ title, variant = 'full' }: Props) {
  const thisYear = new Date().getFullYear()

  const [thisYearResult, nextYearResult] = await Promise.allSettled([
    fetchHolidaysForYear(thisYear),
    fetchHolidaysForYear(thisYear + 1),
  ])

  // Only include years that actually returned data so the client will retry on failure
  const preloadedHolidays: HolidayMap = {}
  if (thisYearResult.status === 'fulfilled' && Object.keys(thisYearResult.value).length > 0) {
    preloadedHolidays[thisYear] = thisYearResult.value
  }
  if (nextYearResult.status === 'fulfilled' && Object.keys(nextYearResult.value).length > 0) {
    preloadedHolidays[thisYear + 1] = nextYearResult.value
  }

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <CalendarClient
        title={title ?? 'Kalender'}
        variant={variant}
        preloadedHolidays={preloadedHolidays}
      />
    </div>
  )
}
