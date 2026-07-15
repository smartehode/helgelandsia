'use client'

import { useState, useEffect, useRef } from 'react'
import type { WidgetVariant } from './PowerPriceWidget'

export interface Departure {
  aimedTime: string
  cancelled: boolean
  destination: string
  lineCode: string
  lineName?: string
  submode?: string      // 'localCarFerry' | 'highSpeedPassengerService' | ...
  situations?: string[]
  quayCode?: string
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

// ── Tid ──────────────────────────────────────────────────────────────────────

function osloDay(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}
function todayStr(): string {
  return osloDay(new Date().toISOString())
}
function tomorrowStr(): string {
  return osloDay(new Date(Date.now() + 86_400_000).toISOString())
}
function tomorrowWeekday(): string {
  const wd = new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo', weekday: 'long',
  }).format(new Date(Date.now() + 86_400_000))
  return wd.charAt(0).toUpperCase() + wd.slice(1)
}
function fmtTimeOnly(iso: string): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// ── Dag-gruppering ────────────────────────────────────────────────────────────

function groupByDay(deps: Departure[]): { label: string; deps: Departure[] }[] {
  const today = todayStr()
  const tomorrow = tomorrowStr()
  const raw = [
    { label: 'I dag',                            deps: deps.filter(d => osloDay(d.aimedTime) === today) },
    { label: `I morgen · ${tomorrowWeekday()}`,   deps: deps.filter(d => osloDay(d.aimedTime) === tomorrow) },
    { label: (() => {
        const later = deps.filter(d => osloDay(d.aimedTime) !== today && osloDay(d.aimedTime) !== tomorrow)
        if (!later.length) return ''
        return new Intl.DateTimeFormat('nb-NO', {
          timeZone: 'Europe/Oslo', day: 'numeric', month: 'short',
        }).format(new Date(later[0].aimedTime))
      })(),
      deps: deps.filter(d => osloDay(d.aimedTime) !== today && osloDay(d.aimedTime) !== tomorrow),
    },
  ]
  return raw.filter(g => g.deps.length > 0)
}

// ── Linje-info ────────────────────────────────────────────────────────────────

interface LineInfo { name?: string; code: string; submode?: string }

// Returnerer felles linje-info hvis ALLE avganger deler samme linjekode
function sharedLine(deps: Departure[]): LineInfo | null {
  if (!deps.length) return null
  const first = deps[0]
  if (!deps.every(d => d.lineCode === first.lineCode)) return null
  return { name: first.lineName, code: first.lineCode, submode: first.submode }
}

function lineLabel(l: LineInfo): string {
  return l.name ? `${l.name} (${l.code})` : l.code
}

function isFerge(submode?: string): boolean {
  return submode === 'localCarFerry'
}

// ── Komponent ─────────────────────────────────────────────────────────────────

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
    setTimeout(() => { idxRef.current = newIdx; setIdx(newIdx); setFading(false) }, 200)
  }
  function goToManual(newIdx: number) {
    pauseUntilRef.current = Date.now() + 30_000
    goTo(newIdx)
  }

  useEffect(() => {
    const h = () => { isPaused.current = document.visibilityState !== 'visible' }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [])

  useEffect(() => {
    if (stops.length <= 1) return
    const t = setInterval(() => {
      if (isHovered.current || isPaused.current || Date.now() < pauseUntilRef.current) return
      goTo((idxRef.current + 1) % stops.length)
    }, 10_000)
    return () => clearInterval(t)
  }, [stops.length])

  if (!current) return null

  const shownDeps = isKompakt ? current.departures.slice(0, 3) : current.departures
  const groups = groupByDay(shownDeps)
  // Felles linje: sjekk mot ALLE avganger (ikke bare vist utvalg)
  const shared = sharedLine(current.departures)

  return (
    <div
      onMouseEnter={() => { isHovered.current = true }}
      onMouseLeave={() => { isHovered.current = false }}
    >
      {/* ── Kai-overskrift + nav ─────────────────────────────────────── */}
      <div
        className="border-b border-ink/5 px-4 py-2.5"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 200ms' }}
      >
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            Avganger fra {current.stopName}
          </span>
          {stops.length > 1 && (
            <div className="flex shrink-0 items-center gap-0.5 text-muted">
              <button onClick={() => goToManual((idx - 1 + stops.length) % stops.length)}
                className="rounded p-0.5 text-lg leading-none hover:text-ink" aria-label="Forrige kai">‹</button>
              <span className="w-8 text-center text-xs tabular-nums">{idx + 1}/{stops.length}</span>
              <button onClick={() => goToManual((idx + 1) % stops.length)}
                className="rounded p-0.5 text-lg leading-none hover:text-ink" aria-label="Neste kai">›</button>
            </div>
          )}
        </div>
        {/* Felles linjeinformasjon — vises én gang her når alle avganger har samme linje */}
        {shared && !isKompakt && (
          <p className="mt-0.5 text-xs text-muted">
            {lineLabel(shared)}{isFerge(shared.submode) ? ' · ⛴ Bilferge' : ''}
          </p>
        )}
      </div>

      {/* ── Avgangsliste ────────────────────────────────────────────── */}
      <div style={{ opacity: fading ? 0 : 1, transition: 'opacity 200ms' }}>
        {groups.map(group => (
          <div key={group.label}>
            <p className="bg-fog/60 px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted/70">
              {group.label}
            </p>
            <ul className="divide-y divide-ink/5 px-4">
              {group.deps.map((d, j) => (
                <li key={j} className={isKompakt ? 'py-1.5' : 'py-2'}>
                  {d.cancelled ? (
                    /* Innstilt */
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="w-14 shrink-0 font-medium text-red-600">Innstilt</span>
                      <span className="tabular-nums text-xs text-muted line-through">{fmtTimeOnly(d.aimedTime)}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-muted">Til {d.destination}</span>
                    </div>
                  ) : (
                    <>
                      {/* Primærlinje: tid · destinasjon · ferge-badge */}
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="w-12 shrink-0 tabular-nums font-semibold text-fjord">
                          {fmtTimeOnly(d.aimedTime)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-ink">
                          Til {d.destination}
                        </span>
                        {isFerge(d.submode) && (
                          <span className="shrink-0 whitespace-nowrap rounded bg-sea/10 px-1.5 py-0.5 text-[10px] font-medium text-sea">
                            {isKompakt ? '⛴' : 'Ferge'}
                          </span>
                        )}
                      </div>
                      {/* Sekundærlinje: linje + kai (full variant, kun når linjene varierer) */}
                      {!isKompakt && !shared && (d.lineName || d.lineCode) && (
                        <p className="mt-0.5 text-xs text-muted">
                          {lineLabel({ name: d.lineName, code: d.lineCode, submode: d.submode })}
                          {d.quayCode && ` · Kai ${d.quayCode}`}
                        </p>
                      )}
                      {!isKompakt && shared && d.quayCode && (
                        <p className="mt-0.5 text-xs text-muted">Kai {d.quayCode}</p>
                      )}
                    </>
                  )}
                  {/* SX-avvik */}
                  {d.situations?.[0] && (
                    <p className="mt-0.5 truncate text-[11px] text-amber-600">⚠ {d.situations[0]}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Navnerad ─────────────────────────────────────────────────── */}
      {stops.length > 1 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-ink/5 px-4 py-2.5">
          {stops.map((s, i) => (
            <button key={i} onClick={() => goToManual(i)}
              className={`text-xs transition-colors ${i === idx
                ? 'font-semibold text-fjord underline underline-offset-2'
                : 'text-ink/40 hover:text-ink/70'}`}>
              {s.shortName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
