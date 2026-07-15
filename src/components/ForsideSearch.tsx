'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'

interface SearchResult {
  id: string | number
  title: string
  url: string
  meta?: string
  external?: boolean
}

interface SearchResults {
  businesses?: SearchResult[]
  events?: SearchResult[]
  jobs?: SearchResult[]
  posts?: SearchResult[]
  tenders?: SearchResult[]
}

const GROUPS: { key: keyof SearchResults; label: string }[] = [
  { key: 'businesses', label: 'Bedrifter' },
  { key: 'events',     label: 'Arrangementer' },
  { key: 'jobs',       label: 'Stillinger' },
  { key: 'posts',      label: 'Leserinnlegg' },
  { key: 'tenders',    label: 'Anbud' },
]

function flattenResults(results: SearchResults): SearchResult[] {
  return GROUPS.flatMap(g => results[g.key] ?? [])
}

export function ForsideSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flat = results ? flattenResults(results) : []
  const hasResults = flat.length > 0

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/sok?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error()
      const data: SearchResults = await res.json()
      setResults(data)
      setOpen(true)
      setSelectedIdx(-1)
    } catch {
      setResults(null)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q.trim()), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, search])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navigate = useCallback((item: SearchResult) => {
    if (item.external) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
    } else {
      router.push(item.url)
      setOpen(false)
    }
  }, [router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && selectedIdx >= 0 && flat[selectedIdx]) {
      e.preventDefault()
      navigate(flat[selectedIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setSelectedIdx(-1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIdx >= 0 && flat[selectedIdx]) navigate(flat[selectedIdx])
  }

  return (
    <div ref={containerRef} className="relative mx-auto mt-6 max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-ink/20 bg-white p-1.5 shadow-sm"
      >
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results && hasResults) setOpen(true) }}
          placeholder="Søk etter bedrifter, arrangementer, stillinger…"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-ink placeholder:text-muted focus:outline-none"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Søk"
          className="shrink-0 rounded-full bg-sun px-5 py-2 text-sm font-semibold text-fjord transition hover:brightness-105"
        >
          {loading ? '…' : 'Søk'}
        </button>
      </form>

      {open && results && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg">
          {!hasResults ? (
            <p className="px-4 py-3 text-[13px] text-muted">Ingen treff for «{q}»</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto py-1">
              {(() => {
                let cursor = 0
                let rendered = 0
                return GROUPS.map(group => {
                  const items = results[group.key] ?? []
                  if (!items.length) return null
                  const groupStart = cursor
                  cursor += items.length
                  const notFirst = rendered > 0
                  rendered++
                  return (
                    <div key={group.key}>
                      {notFirst && <div className="mx-3 my-1 border-t border-ink/5" />}
                      <p className="px-3 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-widest text-muted/70">
                        {group.label}
                      </p>
                      {items.map((item, i) => {
                        const flatI = groupStart + i
                        return (
                          <ResultRow
                            key={item.id}
                            item={item}
                            selected={flatI === selectedIdx}
                            onHover={() => setSelectedIdx(flatI)}
                            onClick={() => { navigate(item); setOpen(false) }}
                          />
                        )
                      })}
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultRow({
  item,
  selected,
  onHover,
  onClick,
}: {
  item: SearchResult
  selected: boolean
  onHover: () => void
  onClick: () => void
}) {
  const inner = (
    <div
      onMouseEnter={onHover}
      className={`flex items-center gap-2 px-3 py-[7px] transition-colors ${
        selected ? 'bg-sea/10 text-sea' : 'hover:bg-fog/60'
      }`}
    >
      {/* Tittel + meta på samme linje */}
      <div className="flex min-w-0 flex-1 items-baseline gap-0 overflow-hidden">
        <span className={`min-w-0 truncate text-[13px] ${selected ? 'text-sea' : 'text-ink'}`}>
          {item.title}
        </span>
        {item.meta && (
          <span className="ml-1.5 shrink-0 text-[11px] text-muted">— {item.meta}</span>
        )}
      </div>
      {item.external && (
        <span className="shrink-0 text-[10px] text-muted" aria-hidden>↗</span>
      )}
    </div>
  )

  if (item.external) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={item.url} onClick={onClick} prefetch={false}>
      {inner}
    </Link>
  )
}
