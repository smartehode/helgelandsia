'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { MapMarker } from './PolitiMap'
import { kategoriData } from '@/lib/politi-kategorier'

export type { MapMarker }

const PolitiMap = dynamic(
  () => import('./PolitiMap').then(m => ({ default: m.PolitiMap })),
  { ssr: false },
)

export interface PoliceMsg {
  id: string
  threadId: string
  category: string
  district: string
  municipality: string
  area: string
  isActive: boolean
  text: string
  createdOn: string
  isEdited: boolean
}

export interface PoliceThread {
  id: string
  category: string
  municipality: string
  area: string
  isActive: boolean
  latest: PoliceMsg
  history: PoliceMsg[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Ikon — samme SVG-data som kart-markørene (visuell paritet)

function CatIcon({ category, size = 14 }: { category: string; size?: number }) {
  const { hex, svgPaths } = kategoriData(category)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={hex}
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      // svgPaths er våre egne konstanter, ikke brukerinput
      dangerouslySetInnerHTML={{ __html: svgPaths }}
    />
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Hjelpefunksjoner

const CAT_TEXT: Record<string, string> = {
  Trafikk:       'text-amber-700',
  'Ro og orden': 'text-blue-700',
  Voldshendelse: 'text-red-700',
  Redning:       'text-orange-700',
  Brann:         'text-red-800',
  Ulykke:        'text-orange-700',
  Tyveri:        'text-purple-700',
  Innbrudd:      'text-purple-700',
  Savnet:        'text-pink-700',
  Sjø:           'text-sky-700',
  Arrangement:   'text-green-700',
  Dyr:           'text-lime-700',
  Skadeverk:     'text-stone-700',
  Vær:           'text-sky-700',
}

const CAT_CLS: Record<string, string> = {
  Trafikk:       'bg-amber-50 text-amber-700',
  'Ro og orden': 'bg-blue-50 text-blue-700',
  Voldshendelse: 'bg-red-50 text-red-700',
  Redning:       'bg-orange-50 text-orange-700',
  Brann:         'bg-red-100 text-red-800',
  Ulykke:        'bg-orange-50 text-orange-700',
  Tyveri:        'bg-purple-50 text-purple-700',
  Innbrudd:      'bg-purple-50 text-purple-700',
  Savnet:        'bg-pink-50 text-pink-700',
  Sjø:           'bg-sky-50 text-sky-700',
  Arrangement:   'bg-green-50 text-green-700',
  Dyr:           'bg-lime-50 text-lime-700',
  Skadeverk:     'bg-stone-100 text-stone-700',
  Vær:           'bg-sky-50 text-sky-700',
}

function relTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diffMs / 60_000)
  if (m < 2) return 'nettopp'
  if (m < 60) return `${m} min`
  const h = Math.floor(diffMs / 3_600_000)
  if (h < 24) return `${h} t`
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

const POLITILOGGEN_URL = 'https://www.politiet.no/politiloggen'
const TICKER_DURATION_S = 40

// ──────────────────────────────────────────────────────────────────────────────
// Enkelt listeelement — props-drevet expanded state

interface PolitiItemProps {
  thread: PoliceThread
  compact: boolean
  expanded: boolean
  onToggle: (id: string) => void
}

function PolitiItem({ thread, compact, expanded, onToggle }: PolitiItemProps) {
  const [overflows, setOverflows] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    setOverflows(el.scrollHeight > el.clientHeight + 2)
  }, [])

  const msg = thread.latest
  const location = thread.area ? `${thread.municipality} · ${thread.area}` : thread.municipality
  const canExpand = overflows || thread.history.length > 0

  const handleClick = useCallback(() => {
    if (canExpand) onToggle(thread.id)
  }, [canExpand, onToggle, thread.id])

  const handleLinkClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  // ── KOMPAKT ────────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <li
        className={`py-1.5 ${canExpand ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1.5 text-[11px] leading-none">
          {thread.isActive && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
          )}
          <CatIcon category={msg.category} size={12} />
          <span className={`shrink-0 font-semibold ${CAT_TEXT[msg.category] ?? 'text-muted'}`}>
            {msg.category}
          </span>
          <span className="text-ink/30">·</span>
          <span className="min-w-0 flex-1 truncate text-muted">{location}</span>
          <span className="ml-1 shrink-0 text-muted">{relTime(msg.createdOn)}</span>
        </div>
        <div className="mt-0.5 flex items-start gap-1">
          <p
            ref={textRef}
            className={`flex-1 text-sm leading-snug text-ink/80 ${!expanded ? 'line-clamp-1' : ''}`}
          >
            {msg.text}
          </p>
          {!expanded && overflows && (
            <span className="shrink-0 pt-px text-[10px] leading-snug text-sea/70">▾</span>
          )}
        </div>
        {expanded && (
          <>
            {thread.history.length > 0 && (
              <div className="mt-1.5 space-y-1 border-t border-ink/5 pt-1.5">
                {thread.history.map(h => (
                  <p key={h.id} className="text-xs text-muted">
                    <span className="mr-1 text-[10px] text-muted/60">{relTime(h.createdOn)}</span>
                    {h.text}
                  </p>
                ))}
              </div>
            )}
            <a
              href={POLITILOGGEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[10px] text-muted hover:text-sea"
              onClick={handleLinkClick}
            >
              politiet.no ↗
            </a>
          </>
        )}
      </li>
    )
  }

  // ── FULL ───────────────────────────────────────────────────────────────────
  return (
    <li
      className={`px-4 py-3.5 transition hover:bg-fog/40 ${canExpand ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {thread.isActive && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Pågående hendelse" />
          )}
          <CatIcon category={msg.category} size={14} />
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${CAT_CLS[msg.category] ?? 'bg-fog text-muted'}`}
          >
            {msg.category}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted">{relTime(msg.createdOn)}</span>
      </div>

      <p className="mb-1 text-xs font-medium text-sea">
        {location}{msg.isEdited ? ' · oppdatert' : ''}
      </p>

      <p
        ref={textRef}
        className={`text-sm leading-relaxed text-ink/80 ${!expanded ? 'line-clamp-3' : ''}`}
      >
        {msg.text}
      </p>

      {!expanded && overflows && (
        <div className="mt-1 flex items-center gap-0.5 text-[11px] text-sea/80">
          <span>vis mer</span><span>▾</span>
        </div>
      )}
      {expanded && canExpand && (
        <div className="mt-1 text-[11px] text-sea/80">▴ vis mindre</div>
      )}

      {expanded && thread.history.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-ink/5 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Tidligere meldinger
          </p>
          {thread.history.map(h => (
            <div key={h.id} className="text-xs text-muted">
              <span className="mr-1.5 text-[10px] text-muted/60">{relTime(h.createdOn)}</span>
              {h.text}
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <a
          href={POLITILOGGEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] text-muted hover:text-sea"
          onClick={handleLinkClick}
        >
          politiet.no ↗
        </a>
      )}
    </li>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Ticker-wrapper (full variant, > 2 meldinger, ingen reduced-motion)

const KEYFRAME_CSS =
  '@keyframes politi-scroll{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}'

interface TickerProps {
  threads: PoliceThread[]
  expandedId: string | null
  onToggle: (id: string) => void
}

function PolitiTicker({ threads, expandedId, onToggle }: TickerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isExpanded = expandedId !== null

  // Injiser @keyframes én gang
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = KEYFRAME_CSS
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  const pauseTicker = useCallback(() => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
    setIsPaused(true)
  }, [])

  const resumeTicker = useCallback(() => {
    touchTimerRef.current = setTimeout(() => setIsPaused(false), 400)
  }, [])

  // Ticker-modus: dupliser lista for sømløs loop
  // Expanded-modus: vanlig liste (ingen høydebegrensning, ingen animasjon)
  const doubled = [...threads, ...threads]

  if (isExpanded) {
    // Vis alle elementer uten clip — bruker kollapser inn igjen ved klikk
    return (
      <ul className="divide-y divide-ink/5">
        {threads.map(t => (
          <PolitiItem
            key={t.id}
            thread={t}
            compact={false}
            expanded={expandedId === t.id}
            onToggle={onToggle}
          />
        ))}
      </ul>
    )
  }

  return (
    <div
      className="overflow-hidden"
      style={{ height: '220px' }}
      onMouseEnter={pauseTicker}
      onMouseLeave={resumeTicker}
      onTouchStart={pauseTicker}
      onTouchEnd={resumeTicker}
    >
      <ul
        className="divide-y divide-ink/5"
        style={{
          animation: `politi-scroll ${TICKER_DURATION_S}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {doubled.map((t, i) => (
          <PolitiItem
            key={`${t.id}-${i}`}
            thread={t}
            compact={false}
            // Kun første halvdel kan ekspandere (ikke duplikaten)
            expanded={expandedId === t.id && i < threads.length}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Hoved-komponent

export function PolitiList({
  threads,
  variant,
  markers,
}: {
  threads: PoliceThread[]
  variant: 'full' | 'kompakt'
  markers?: MapMarker[]
}) {
  const compact = variant === 'kompakt'
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const onToggle = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }, [])

  const useTicker = !compact && !prefersReduced && threads.length > 2

  if (compact) {
    return (
      <ul className="divide-y divide-ink/5 px-3">
        {threads.map(t => (
          <PolitiItem
            key={t.id}
            thread={t}
            compact
            expanded={expandedId === t.id}
            onToggle={onToggle}
          />
        ))}
      </ul>
    )
  }

  // Full variant med ticker
  if (useTicker) {
    return (
      <>
        {markers && markers.length > 0 && <PolitiMap markers={markers} />}
        <PolitiTicker threads={threads} expandedId={expandedId} onToggle={onToggle} />
      </>
    )
  }

  // Full variant, reduced-motion: vis 2 + Se alle-lenke
  const visibleThreads = prefersReduced ? threads.slice(0, 2) : threads
  const hasMore = prefersReduced && threads.length > 2

  return (
    <>
      {markers && markers.length > 0 && <PolitiMap markers={markers} />}
      <ul className="divide-y divide-ink/5">
        {visibleThreads.map(t => (
          <PolitiItem
            key={t.id}
            thread={t}
            compact={false}
            expanded={expandedId === t.id}
            onToggle={onToggle}
          />
        ))}
      </ul>
      {hasMore && (
        <div className="px-4 py-2.5">
          <a
            href={POLITILOGGEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sea hover:underline"
          >
            Se alle meldinger ↗
          </a>
        </div>
      )}
    </>
  )
}
