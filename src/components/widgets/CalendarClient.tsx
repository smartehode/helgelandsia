'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, getISOWeek, isSameMonth, isToday,
  addMonths, subMonths, format, parseISO,
} from 'date-fns'
import { nb } from 'date-fns/locale'
import type { WidgetVariant } from './PowerPriceWidget'

export type HolidayMap = Record<number, Record<string, string>>

// These types are mirrored in src/lib/kalender.ts (server-only). Keep shapes in sync.
export interface KalenderArrangement {
  tittel: string
  startIso: string
  sluttIso: string
  slug: string
}

export interface KalenderAnbud {
  tittel: string
  oppdragsgiver: string
  fristIso: string
  url: string
}

export interface KalenderStilling {
  tittel: string
  arbeidsgiver: string
  fristIso: string
  slug: string
  navUrl?: string  // definert for NAV-stillinger
}

export interface KalenderOppdrag {
  tittel: string
  kommune: string
  datoIso: string
  slug: string
}

export interface KalenderData {
  maned: string
  arrangementer: KalenderArrangement[]
  anbud: KalenderAnbud[]
  stillinger: KalenderStilling[]
  oppdrag: KalenderOppdrag[]
}

interface DayEntries {
  events: KalenderArrangement[]
  anbud: KalenderAnbud[]
  stillinger: KalenderStilling[]
  oppdrag: KalenderOppdrag[]
}

interface ListEntry {
  dateStr: string
  dateMs: number
  type: 'event' | 'anbud' | 'stilling' | 'oppdrag' | 'helligdag'
  tittel: string
  href?: string     // undefined → non-linkable (holidays)
  meta?: string
  external?: boolean // true → target="_blank" rel="noopener"
}

interface Props {
  title: string
  variant: WidgetVariant
  preloadedHolidays: HolidayMap
  initialData: KalenderData
  showEvents: boolean
  showTenders: boolean
  showJobs: boolean
  showOppdrag: boolean
}

const DAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

const TYPE_DOT: Record<ListEntry['type'], string> = {
  helligdag: 'bg-red-600',
  event:     'bg-fjord',
  anbud:     'bg-sun',
  stilling:  'bg-sky-500',   // lyseblå (sea-familien) — byttet fra grønn
  oppdrag:   'bg-green-500', // grønn — samkjørt med oppdrag-badge i kategorigrid
}

const TYPE_LABEL: Record<ListEntry['type'], string> = {
  helligdag: 'Helligdag',
  event:     'Arrangement',
  anbud:     'Anbudsfrist',
  stilling:  'Stillingsfrist',
  oppdrag:   'Oppdrag',
}

function buildDayIndex(data: KalenderData): Record<string, DayEntries> {
  const idx: Record<string, DayEntries> = {}
  function ensure(d: string): DayEntries {
    if (!idx[d]) idx[d] = { events: [], anbud: [], stillinger: [], oppdrag: [] }
    return idx[d]
  }
  for (const ev of data.arrangementer) {
    if (!ev.startIso) continue
    const startStr = format(new Date(ev.startIso), 'yyyy-MM-dd')
    const endStr = format(new Date(ev.sluttIso || ev.startIso), 'yyyy-MM-dd')
    let cur = startStr
    let safety = 0
    while (cur <= endStr && safety < 366) {
      ensure(cur).events.push(ev)
      const next = new Date(cur + 'T12:00:00')
      next.setDate(next.getDate() + 1)
      cur = format(next, 'yyyy-MM-dd')
      safety++
    }
  }
  for (const a of data.anbud) {
    if (a.fristIso) ensure(format(new Date(a.fristIso), 'yyyy-MM-dd')).anbud.push(a)
  }
  for (const s of data.stillinger) {
    if (s.fristIso) ensure(format(new Date(s.fristIso), 'yyyy-MM-dd')).stillinger.push(s)
  }
  for (const o of (data.oppdrag ?? [])) {
    if (o.datoIso) ensure(format(new Date(o.datoIso), 'yyyy-MM-dd')).oppdrag.push(o)
  }
  return idx
}

function buildActivityEntries(
  data: KalenderData,
  holidays: Record<string, string>,
  showEvents: boolean,
  showTenders: boolean,
  showJobs: boolean,
  showOppdrag: boolean,
): ListEntry[] {
  const entries: ListEntry[] = []

  for (const [date, name] of Object.entries(holidays)) {
    entries.push({
      dateStr: date,
      dateMs: new Date(date + 'T12:00:00').getTime(),
      type: 'helligdag',
      tittel: name,
      // no href — holidays are not linkable in the list
    })
  }
  if (showEvents) {
    for (const ev of data.arrangementer) {
      if (!ev.startIso) continue
      entries.push({
        dateStr: format(new Date(ev.startIso), 'yyyy-MM-dd'),
        dateMs: new Date(ev.startIso).getTime(),
        type: 'event',
        tittel: ev.tittel,
        href: `/arrangementer/${ev.slug}`,
      })
    }
  }
  if (showTenders) {
    for (const a of data.anbud) {
      if (!a.fristIso) continue
      entries.push({
        dateStr: format(new Date(a.fristIso), 'yyyy-MM-dd'),
        dateMs: new Date(a.fristIso).getTime(),
        type: 'anbud',
        tittel: a.tittel,
        href: a.url,
        meta: a.oppdragsgiver || undefined,
        external: true,
      })
    }
  }
  if (showJobs) {
    for (const s of data.stillinger) {
      if (!s.fristIso) continue
      const isNav = !!s.navUrl
      entries.push({
        dateStr: format(new Date(s.fristIso), 'yyyy-MM-dd'),
        dateMs: new Date(s.fristIso).getTime(),
        type: 'stilling',
        tittel: s.tittel,
        href: isNav ? s.navUrl : `/stillinger/${s.slug}`,
        meta: [s.arbeidsgiver || undefined, isNav ? '(NAV)' : undefined].filter(Boolean).join(' ') || undefined,
        external: isNav,
      })
    }
  }
  if (showOppdrag) {
    for (const o of (data.oppdrag ?? [])) {
      if (!o.datoIso) continue
      const kommune = o.kommune
        ? o.kommune.charAt(0).toUpperCase() + o.kommune.slice(1)
        : ''
      entries.push({
        dateStr: format(new Date(o.datoIso), 'yyyy-MM-dd'),
        dateMs: new Date(o.datoIso).getTime(),
        type: 'oppdrag',
        tittel: o.tittel,
        href: `/oppdrag/${o.slug}`,
        meta: kommune || undefined,
      })
    }
  }

  return entries.sort((a, b) => a.dateMs - b.dateMs)
}

export function CalendarClient({
  title,
  variant,
  preloadedHolidays,
  initialData,
  showEvents,
  showTenders,
  showJobs,
  showOppdrag,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [holidaysByYear, setHolidaysByYear] = useState<HolidayMap>(preloadedHolidays)
  const [kalData, setKalData] = useState<KalenderData>(initialData)
  const [kalLoading, setKalLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const loadedYears = useRef(new Set(Object.keys(preloadedHolidays).map(Number)))
  const initialManed = useRef(initialData.maned)
  const isKompakt = variant === 'kompakt'

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const maned = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    if (loadedYears.current.has(year)) return
    loadedYears.current.add(year)
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/NO`, { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : [])
      .then((data: { date: string; localName: string }[]) => {
        setHolidaysByYear(prev => ({
          ...prev,
          [year]: Object.fromEntries(data.map(h => [h.date, h.localName])),
        }))
      })
      .catch(() => {})
  }, [year])

  useEffect(() => {
    if (maned === initialManed.current) return
    setKalLoading(true)
    setSelectedDay(null)
    fetch(`/api/kalender?maned=${maned}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setKalData(data) })
      .catch(() => {})
      .finally(() => setKalLoading(false))
  }, [maned])

  const holidays = holidaysByYear[year] ?? {}
  const dayIndex = buildDayIndex(kalData)

  // Calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7))

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: nb })

  // Chronological list (full variant)
  const allListEntries = useMemo(
    () => buildActivityEntries(kalData, holidays, showEvents, showTenders, showJobs, showOppdrag),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kalData, holidays, showEvents, showTenders, showJobs, showOppdrag],
  )

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthStartStr = format(monthStart, 'yyyy-MM-dd')
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd')
  const isPastMonth = monthEndStr < todayStr
  const isFutureMonth = monthStartStr > todayStr
  const kommendeFra = isFutureMonth ? monthStartStr : todayStr

  const monthEntries = allListEntries.filter(
    e => e.dateStr >= monthStartStr && e.dateStr <= monthEndStr,
  )

  const displayList: ListEntry[] = selectedDay
    ? monthEntries.filter(e => e.dateStr === selectedDay)
    : monthEntries.filter(e => isPastMonth || e.dateStr >= kommendeFra).slice(0, 7)

  const listLabel = selectedDay
    ? `Viser ${format(parseISO(selectedDay), 'd. MMMM', { locale: nb })}`
    : isPastMonth
    ? 'Denne måneden'
    : 'Kommende'

  const hasAnyTypes = showEvents || showTenders || showJobs || showOppdrag

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-fjord">{title}</h2>

      {/* Month navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="rounded-lg px-2 py-1 text-lg leading-none text-muted hover:bg-ink/5 hover:text-ink transition-colors"
          aria-label="Forrige måned"
        >
          ‹
        </button>
        <span className={`flex items-center gap-1.5 font-medium capitalize text-ink ${isKompakt ? 'text-sm' : ''}`}>
          {monthLabel}
          {kalLoading && <span className="text-xs text-muted animate-pulse">…</span>}
        </span>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="rounded-lg px-2 py-1 text-lg leading-none text-muted hover:bg-ink/5 hover:text-ink transition-colors"
          aria-label="Neste måned"
        >
          ›
        </button>
      </div>

      {/* Calendar table */}
      <table className={`mt-2 w-full border-collapse ${isKompakt ? 'text-[11px]' : 'text-sm'}`}>
        <thead>
          <tr>
            <th className="pb-1 pr-1 text-right text-[10px] font-normal text-muted">Uke</th>
            {DAY_LABELS.map(d => (
              <th key={d} className="pb-1 text-center font-normal text-muted">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              <td className="pr-1 text-right text-[10px] tabular-nums text-muted/60">
                {getISOWeek(week[0])}
              </td>
              {week.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const inMonth = isSameMonth(day, currentMonth)
                const isHoliday = !!holidays[dateStr]
                const todayDate = isToday(day)
                const isSelected = selectedDay === dateStr
                const dots = inMonth ? (dayIndex[dateStr] ?? null) : null

                let spanCls = `inline-flex items-center justify-center rounded-full ${isKompakt ? 'w-5 h-5 text-[11px]' : 'w-7 h-7 text-sm'} `
                if (!inMonth) {
                  spanCls += 'text-muted/30'
                } else if (todayDate) {
                  spanCls += 'bg-sea text-fog font-bold'
                } else if (isHoliday) {
                  spanCls += 'text-red-600 font-semibold'
                } else if (isSelected) {
                  spanCls += 'bg-fjord/10 text-fjord font-semibold ring-1 ring-fjord/30'
                } else {
                  spanCls += 'text-ink'
                }

                return (
                  <td
                    key={dateStr}
                    className={`py-px text-center${inMonth ? ' cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!inMonth) return
                      if (isKompakt) { window.location.href = '/arrangementer'; return }
                      setSelectedDay(prev => prev === dateStr ? null : dateStr)
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className={spanCls}>{format(day, 'd')}</span>
                      {isKompakt ? (
                        <div className="mt-0.5 flex h-[4px] items-center gap-[2px]">
                          {inMonth && isHoliday && (
                            <span className="inline-block h-[3px] w-[3px] rounded-full bg-red-600" />
                          )}
                          {dots && showEvents && dots.events.length > 0 && (
                            <span className="inline-block h-[3px] w-[3px] rounded-full bg-fjord" />
                          )}
                          {dots && showTenders && dots.anbud.length > 0 && (
                            <span className="inline-block h-[3px] w-[3px] rounded-full bg-sun" />
                          )}
                          {dots && showJobs && dots.stillinger.length > 0 && (
                            <span className="inline-block h-[3px] w-[3px] rounded-full bg-sky-500" />
                          )}
                          {dots && showOppdrag && dots.oppdrag.length > 0 && (
                            <span className="inline-block h-[3px] w-[3px] rounded-full bg-green-500" />
                          )}
                        </div>
                      ) : (
                        <div className="mt-0.5 flex h-2 items-center gap-[2px]">
                          {inMonth && isHoliday && (
                            <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
                          )}
                          {dots && showEvents && dots.events.length > 0 && (
                            <span className="inline-block h-2 w-2 rounded-full bg-fjord" />
                          )}
                          {dots && showTenders && dots.anbud.length > 0 && (
                            <span className="inline-block h-2 w-2 rounded-full bg-sun" />
                          )}
                          {dots && showJobs && dots.stillinger.length > 0 && (
                            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
                          )}
                          {dots && showOppdrag && dots.oppdrag.length > 0 && (
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-600" />
          Helligdag
        </span>
        {showEvents && (
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-fjord" />
            Arrangement
          </span>
        )}
        {showTenders && (
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-sun" />
            Anbudsfrist
          </span>
        )}
        {showJobs && (
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-sky-500" />
            Stillingsfrist
          </span>
        )}
        {showOppdrag && (
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" />
            Oppdrag
          </span>
        )}
      </div>

      {/* Kommende list (full variant only) */}
      {!isKompakt && (
        <div className="mt-4 border-t border-ink/5 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {listLabel}
            </p>
            {selectedDay && (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-[11px] text-sea hover:underline"
              >
                Vis alle →
              </button>
            )}
          </div>

          {displayList.length === 0 ? (
            <p className="text-xs text-muted">
              {selectedDay
                ? 'Ingen hendelser denne dagen.'
                : 'Ingen planlagte hendelser denne måneden.'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {displayList.map((entry, i) => {
                const dot = (
                  <span
                    className={`mt-[3px] inline-block h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[entry.type]}`}
                  />
                )
                const text = (
                  <span className="text-xs leading-snug">
                    <span className="text-muted">
                      {format(parseISO(entry.dateStr), 'd. MMMM', { locale: nb })}
                      {' · '}
                    </span>
                    <span className="font-medium text-ink/70">{TYPE_LABEL[entry.type]}:</span>
                    {' '}
                    <span className={entry.href ? 'text-ink group-hover:underline' : 'text-ink'}>
                      {entry.tittel}
                    </span>
                    {entry.meta && <span className="text-muted"> — {entry.meta}</span>}
                  </span>
                )

                return (
                  <li key={i}>
                    {entry.href ? (
                      <a
                        href={entry.href}
                        target={entry.external ? '_blank' : undefined}
                        rel={entry.external ? 'noopener' : undefined}
                        className="group flex items-start gap-2"
                      >
                        {dot}{text}
                      </a>
                    ) : (
                      <span className="flex items-start gap-2">{dot}{text}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Discrete source credit */}
      <p className="mt-3 text-[10px] text-muted/60">
        Helligdager:{' '}
        <a href="https://date.nager.at" target="_blank" rel="noopener" className="hover:text-sea">
          date.nager.at
        </a>
      </p>
    </>
  )
}
