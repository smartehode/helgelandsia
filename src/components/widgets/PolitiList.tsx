'use client'

import { useState, useRef, useEffect } from 'react'

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
  history: PoliceMsg[] // eldre meldinger, eldst først
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

function PolitiItem({ thread, compact }: { thread: PoliceThread; compact: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    // scrollHeight > clientHeight betyr at teksten er kappet av line-clamp
    setOverflows(el.scrollHeight > el.clientHeight + 2)
  }, [])

  const msg = thread.latest
  const location = thread.area
    ? `${thread.municipality} · ${thread.area}`
    : thread.municipality
  const canExpand = overflows || thread.history.length > 0

  if (compact) {
    return (
      <li
        className={`py-1.5 ${canExpand ? 'cursor-pointer' : ''}`}
        onClick={() => canExpand && setExpanded(e => !e)}
      >
        {/* Linje 1: kategori · sted · tid */}
        <div className="flex items-center gap-1.5 text-[11px] leading-none">
          {thread.isActive && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
          )}
          <span className={`shrink-0 font-semibold ${CAT_TEXT[msg.category] ?? 'text-muted'}`}>
            {msg.category}
          </span>
          <span className="text-ink/30">·</span>
          <span className="min-w-0 flex-1 truncate text-muted">{location}</span>
          <span className="ml-1 shrink-0 text-muted">{relTime(msg.createdOn)}</span>
        </div>
        {/* Linje 2: tekst + expand-pil */}
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
        {/* Utvidet: historikk + lenke */}
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
              onClick={e => e.stopPropagation()}
            >
              politiet.no ↗
            </a>
          </>
        )}
      </li>
    )
  }

  // ── FULL VARIANT ──────────────────────────────────────────────────────────
  return (
    <li
      className={`px-4 py-3.5 transition hover:bg-fog/40 ${canExpand ? 'cursor-pointer' : ''}`}
      onClick={() => canExpand && setExpanded(e => !e)}
    >
      {/* Header: badge + tid */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {thread.isActive && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Pågående hendelse" />
          )}
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${CAT_CLS[msg.category] ?? 'bg-fog text-muted'}`}
          >
            {msg.category}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted">{relTime(msg.createdOn)}</span>
      </div>

      {/* Sted */}
      <p className="mb-1 text-xs font-medium text-sea">
        {location}{msg.isEdited ? ' · oppdatert' : ''}
      </p>

      {/* Meldingstekst — kappet/full */}
      <p
        ref={textRef}
        className={`text-sm leading-relaxed text-ink/80 ${!expanded ? 'line-clamp-3' : ''}`}
      >
        {msg.text}
      </p>

      {/* "Vis mer" — kun når teksten faktisk er kappet */}
      {!expanded && overflows && (
        <div className="mt-1 flex items-center gap-0.5 text-[11px] text-sea/80">
          <span>vis mer</span>
          <span>▾</span>
        </div>
      )}

      {/* "Vis mindre" — når utvidet */}
      {expanded && canExpand && (
        <div className="mt-1 text-[11px] text-sea/80">▴ vis mindre</div>
      )}

      {/* Historikk: eldre oppdateringer på samme sak */}
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

      {/* Lenke til politiloggen — kun ved utvidet visning */}
      {expanded && (
        <a
          href={POLITILOGGEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] text-muted hover:text-sea"
          onClick={e => e.stopPropagation()}
        >
          politiet.no ↗
        </a>
      )}
    </li>
  )
}

export function PolitiList({
  threads,
  variant,
}: {
  threads: PoliceThread[]
  variant: 'full' | 'kompakt'
}) {
  const compact = variant === 'kompakt'
  return (
    <ul className={compact ? 'divide-y divide-ink/5 px-3' : 'divide-y divide-ink/5'}>
      {threads.map(thread => (
        <PolitiItem key={thread.id} thread={thread} compact={compact} />
      ))}
    </ul>
  )
}
