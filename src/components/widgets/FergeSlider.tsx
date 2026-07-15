'use client'

import { useState, useEffect, useRef } from 'react'
import type { WidgetVariant } from './PowerPriceWidget'

export interface Departure {
  aimedTime: string
  cancelled: boolean
  destination: string
  lineCode: string
}

export interface StopData {
  stopName: string
  shortName: string
  departures: Departure[]
}

interface Props {
  stops: StopData[]
  variant: WidgetVariant
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const dateFmt = (ref: Date) =>
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(ref)
  const time = new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit',
  }).format(d)
  const today = dateFmt(new Date())
  const tomorrow = dateFmt(new Date(Date.now() + 86_400_000))
  const depDay = dateFmt(d)
  if (depDay === today) return time
  if (depDay === tomorrow) return `i morgen ${time}`
  const dateLabel = new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo', day: 'numeric', month: 'short',
  }).format(d)
  return `${dateLabel} ${time}`
}

export function FergeSlider({ stops, variant }: Props) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const idxRef = useRef(0)
  const isHovered = useRef(false)
  const isPaused = useRef(false)

  const pauseUntilRef = useRef(0)
  const isKompakt = variant === 'kompakt'
  const current = stops[idx]

  function goTo(newIdx: number) {
    if (newIdx === idxRef.current || stops.length <= 1) return
    setFading(true)
    setTimeout(() => {
      idxRef.current = newIdx
      setIdx(newIdx)
      setFading(false)
    }, 200)
  }

  // Manuelt valg: hopp + frys auto-rotasjon i 30 sek
  function goToManual(newIdx: number) {
    pauseUntilRef.current = Date.now() + 30_000
    goTo(newIdx)
  }

  // Pause when fane er skjult
  useEffect(() => {
    const handler = () => { isPaused.current = document.visibilityState !== 'visible' }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // Auto-rotasjon hvert 10. sek — pausert ved hover, skjult fane, eller manuelt valg
  useEffect(() => {
    if (stops.length <= 1) return
    const timer = setInterval(() => {
      if (isHovered.current || isPaused.current || Date.now() < pauseUntilRef.current) return
      goTo((idxRef.current + 1) % stops.length)
    }, 10_000)
    return () => clearInterval(timer)
  }, [stops.length])

  if (!current) return null

  const shownDeps = isKompakt ? current.departures.slice(0, 3) : current.departures

  return (
    <div
      onMouseEnter={() => { isHovered.current = true }}
      onMouseLeave={() => { isHovered.current = false }}
    >
      {/* Kai-navn + pil-navigasjon */}
      <div
        className="flex items-center gap-2 border-b border-ink/5 px-4 py-2.5"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 200ms' }}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {current.stopName}
        </span>
        {stops.length > 1 && (
          <div className="flex shrink-0 items-center gap-0.5 text-muted">
            <button
              onClick={() => goToManual((idx - 1 + stops.length) % stops.length)}
              className="rounded p-0.5 text-lg leading-none hover:text-ink"
              aria-label="Forrige kai"
            >
              ‹
            </button>
            <span className="w-8 text-center text-xs tabular-nums">
              {idx + 1}/{stops.length}
            </span>
            <button
              onClick={() => goToManual((idx + 1) % stops.length)}
              className="rounded p-0.5 text-lg leading-none hover:text-ink"
              aria-label="Neste kai"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Avgangsliste */}
      <ul
        className="divide-y divide-ink/5 px-4"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 200ms' }}
      >
        {shownDeps.map((d, j) => (
          <li
            key={j}
            className={`flex items-baseline gap-2 text-sm ${isKompakt ? 'py-1.5' : 'py-2'}`}
          >
            {d.cancelled ? (
              <>
                <span className="w-14 shrink-0 font-medium text-red-600">Innstilt</span>
                <span className="tabular-nums text-xs text-muted line-through">
                  {fmtTime(d.aimedTime)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                  {d.destination}
                </span>
              </>
            ) : (
              <>
                <span className="w-14 shrink-0 tabular-nums font-semibold text-fjord">
                  {fmtTime(d.aimedTime)}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink">{d.destination}</span>
                {d.lineCode && (
                  <span className="shrink-0 text-xs text-muted">{d.lineCode}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Navnerad — direkte kaivalg, wrappbar på mobil */}
      {stops.length > 1 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-ink/5 px-4 py-2.5">
          {stops.map((s, i) => (
            <button
              key={i}
              onClick={() => goToManual(i)}
              className={`text-xs transition-colors ${
                i === idx
                  ? 'font-semibold text-fjord underline underline-offset-2'
                  : 'text-ink/40 hover:text-ink/70'
              }`}
            >
              {s.shortName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
