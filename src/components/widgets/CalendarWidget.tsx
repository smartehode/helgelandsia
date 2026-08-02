import type { WidgetVariant } from './PowerPriceWidget'
import { CalendarClient, type HolidayMap } from './CalendarClient'
import { hentKalenderData } from '@/lib/kalender'
import type { KalenderData } from '@/lib/kalender'

interface Props {
  title?: string
  variant?: WidgetVariant
  showEvents?: boolean
  showTenders?: boolean
  showJobs?: boolean
  showOppdrag?: boolean
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

export async function CalendarWidget({
  title,
  variant = 'full',
  showEvents = true,
  showTenders = true,
  showJobs = true,
  showOppdrag = true,
}: Props) {
  const now = new Date()
  const thisYear = now.getFullYear()
  const maned = `${thisYear}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [thisYearResult, nextYearResult, initialDataResult] = await Promise.allSettled([
    fetchHolidaysForYear(thisYear),
    fetchHolidaysForYear(thisYear + 1),
    hentKalenderData(maned),
  ])

  // Only include years that actually returned data so the client will retry on failure
  const preloadedHolidays: HolidayMap = {}
  if (thisYearResult.status === 'fulfilled' && Object.keys(thisYearResult.value).length > 0) {
    preloadedHolidays[thisYear] = thisYearResult.value
  }
  if (nextYearResult.status === 'fulfilled' && Object.keys(nextYearResult.value).length > 0) {
    preloadedHolidays[thisYear + 1] = nextYearResult.value
  }

  const initialData: KalenderData =
    initialDataResult.status === 'fulfilled'
      ? initialDataResult.value
      : { maned, arrangementer: [], anbud: [], stillinger: [], oppdrag: [] }

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <CalendarClient
        title={title ?? 'Helgeland-kalenderen'}
        variant={variant}
        preloadedHolidays={preloadedHolidays}
        initialData={initialData}
        showEvents={showEvents}
        showTenders={showTenders}
        showJobs={showJobs}
        showOppdrag={showOppdrag}
      />
    </div>
  )
}
