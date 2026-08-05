'use client'
import { useState, useMemo } from 'react'

export interface YearData {
  aar: number
  omsetning: number | null
  driftsresultat: number | null
  aarsresultat: number | null
  egenkapital: number | null
}

// SVG layout
const W = 560, H = 240
const PAD = { top: 20, right: 20, bottom: 38, left: 72 }
const PW = W - PAD.left - PAD.right  // 468
const PH = H - PAD.top - PAD.bottom  // 182

type SeriesKey = 'omsetning' | 'driftsresultat' | 'aarsresultat' | 'egenkapital'

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'omsetning',      label: 'Omsetning',      color: '#0C2733' },  // fjord
  { key: 'driftsresultat', label: 'Driftsresultat', color: '#3f93a6' },  // brand-400
  { key: 'aarsresultat',   label: 'Årsresultat',    color: '#DDA13A' },  // sun
  { key: 'egenkapital',    label: 'Egenkapital',    color: '#16a34a' },  // green-600
]

function niceScale(vals: number[]): { ticks: number[]; vMin: number; vMax: number } {
  const finite = vals.filter(Number.isFinite)
  if (finite.length === 0) return { ticks: [0, 1], vMin: 0, vMax: 1 }
  const rawMin = Math.min(0, ...finite)
  const rawMax = Math.max(0, ...finite)
  if (rawMin === rawMax) {
    const pad = rawMax === 0 ? 1e6 : Math.abs(rawMax) * 0.5
    return { ticks: [rawMin - pad, rawMin, rawMin + pad], vMin: rawMin - pad, vMax: rawMin + pad }
  }
  const range = rawMax - rawMin
  const rough = range / 4
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const f = rough / mag
  const step = f < 1.5 ? mag : f < 3.5 ? 2 * mag : f < 7.5 ? 5 * mag : 10 * mag
  const vMin = Math.floor(rawMin / step) * step
  const vMax = Math.ceil(rawMax / step) * step
  const ticks: number[] = []
  for (let v = vMin; v <= vMax + step * 0.001; v += step) {
    ticks.push(Math.round(v / step) * step)
  }
  return { ticks, vMin, vMax }
}

function fmtY(v: number): string {
  if (v === 0) return '0'
  const a = Math.abs(v)
  const s = v < 0 ? '-' : ''
  if (a >= 1e9) return s + (a / 1e9).toFixed(1).replace(/\.0$/, '') + ' mrd'
  if (a >= 1e6) return s + (a / 1e6).toFixed(1).replace(/\.0$/, '') + ' m'
  if (a >= 1e3) return s + Math.round(a / 1e3) + ' t'
  return s + a.toFixed(0)
}

function buildPath(
  data: YearData[],
  key: SeriesKey,
  toX: (i: number) => number,
  toY: (v: number) => number,
): string {
  let d = ''
  let prevNull = true
  for (let i = 0; i < data.length; i++) {
    const v = data[i][key]
    if (v == null) { prevNull = true; continue }
    d += (prevNull ? ' M ' : ' L ') + toX(i).toFixed(1) + ' ' + toY(v).toFixed(1)
    prevNull = false
  }
  return d.trim()
}

export function OkonomiGraf({ data }: { data: YearData[] }) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set())

  const visibleSeries = useMemo(
    () => SERIES.filter(s => data.some(d => d[s.key] != null)),
    [data],
  )

  const allVals = useMemo(() => {
    const out: number[] = [0]
    for (const s of visibleSeries) {
      if (hidden.has(s.key)) continue
      for (const d of data) {
        const v = d[s.key]
        if (v != null) out.push(v)
      }
    }
    return out
  }, [visibleSeries, hidden, data])

  const { ticks, vMin, vMax } = useMemo(() => niceScale(allVals), [allVals])

  const toY = (v: number): number =>
    PAD.top + PH * (1 - (v - vMin) / (vMax - vMin))

  const toX = (i: number): number =>
    PAD.left + (data.length > 1 ? (i / (data.length - 1)) * PW : PW / 2)

  const toggle = (key: SeriesKey) => {
    setHidden(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-eyebrow text-muted">
        Økonomiutvikling
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Økonomiutvikling"
      >
        {/* Gridlines og Y-akse */}
        {ticks.map(t => {
          const y = toY(t)
          const isZero = t === 0
          return (
            <g key={t}>
              <line
                x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke={isZero ? '#7a8a90' : '#dde1e3'}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? undefined : '4 3'}
              />
              <text
                x={PAD.left - 6} y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="#7a8a90"
              >
                {fmtY(t)}
              </text>
            </g>
          )
        })}

        {/* X-akse: årstall */}
        {data.map((d, i) => (
          <text
            key={d.aar}
            x={toX(i)} y={H - PAD.bottom + 16}
            textAnchor="middle"
            fontSize={10}
            fill="#7a8a90"
          >
            {d.aar}
          </text>
        ))}

        {/* Serielinjer */}
        {visibleSeries.map(s => {
          if (hidden.has(s.key)) return null
          const path = buildPath(data, s.key, toX, toY)
          if (!path) return null
          return (
            <path
              key={s.key}
              d={path}
              stroke={s.color}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )
        })}

        {/* Datapunkter */}
        {visibleSeries.map(s =>
          hidden.has(s.key)
            ? null
            : data.map((d, i) => {
                const v = d[s.key]
                if (v == null) return null
                return (
                  <circle
                    key={`${s.key}-${i}`}
                    cx={toX(i)} cy={toY(v)}
                    r={3.5}
                    fill={s.color}
                    stroke="white"
                    strokeWidth={1.5}
                  >
                    <title>{`${d.aar} ${s.label}: ${fmtY(v)}`}</title>
                  </circle>
                )
              }),
        )}
      </svg>

      {/* Forklaring — klikkbar for å skjule/vise serier */}
      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {visibleSeries.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => toggle(s.key)}
            className="flex items-center gap-1.5 rounded px-1 py-0.5 text-xs transition-opacity hover:opacity-70"
            style={{ opacity: hidden.has(s.key) ? 0.35 : 1 }}
            aria-pressed={!hidden.has(s.key)}
          >
            <span
              className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-ink/70">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
