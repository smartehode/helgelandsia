'use client'
import { useState, useEffect, useRef } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, getISOWeek, isSameMonth, isToday,
  addMonths, subMonths, format,
} from 'date-fns'
import { nb } from 'date-fns/locale'
import type { WidgetVariant } from './PowerPriceWidget'

export type HolidayMap = Record<number, Record<string, string>>

interface Props {
  title: string
  variant: WidgetVariant
  preloadedHolidays: HolidayMap
}

const DAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

export function CalendarClient({ title, variant, preloadedHolidays }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [holidaysByYear, setHolidaysByYear] = useState<HolidayMap>(preloadedHolidays)
  const loadedYears = useRef(new Set(Object.keys(preloadedHolidays).map(Number)))

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

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

  const holidays = holidaysByYear[year] ?? {}

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  // Holidays in the displayed month (parse date parts directly to avoid timezone issues)
  const monthHolidays = Object.entries(holidays)
    .filter(([date]) => {
      const parts = date.split('-').map(Number)
      return parts[0] === year && parts[1] === month + 1
    })
    .sort(([a], [b]) => a.localeCompare(b))

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: nb })
  const isKompakt = variant === 'kompakt'

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
        <span className={`font-medium capitalize text-ink ${isKompakt ? 'text-sm' : ''}`}>
          {monthLabel}
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

                const size = isKompakt ? 'w-5 h-5 text-[11px]' : 'w-7 h-7 text-sm'
                let spanCls = `inline-flex items-center justify-center rounded-full ${size} `

                if (!inMonth) {
                  spanCls += 'text-muted/30'
                } else if (todayDate) {
                  spanCls += 'bg-sea text-fog font-bold'
                } else if (isHoliday) {
                  spanCls += 'bg-red-50 text-red-700 font-semibold'
                } else {
                  spanCls += 'text-ink'
                }

                return (
                  <td key={dateStr} className="py-px text-center">
                    <span className={spanCls}>{format(day, 'd')}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Holiday list */}
      <div className="mt-4 border-t border-ink/5 pt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Norske helligdager
        </p>
        {monthHolidays.length === 0 ? (
          <p className="text-xs text-muted">Ingen helligdager i denne måneden.</p>
        ) : (
          <ul className="space-y-0.5">
            {(isKompakt ? monthHolidays.slice(0, 3) : monthHolidays).map(([date, name]) => {
              const parts = date.split('-').map(Number)
              return (
                <li key={date} className="text-xs text-ink">
                  <span className="font-semibold text-red-600">{parts[2]}.{parts[1]}.</span>
                  {' '}{name}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 text-[11px] text-muted">
        Kilde:{' '}
        <a href="https://date.nager.at" target="_blank" rel="noopener" className="underline hover:text-sea">
          date.nager.at
        </a>
      </p>
    </>
  )
}
