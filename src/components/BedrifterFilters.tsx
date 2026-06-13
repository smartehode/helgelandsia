'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect, useRef } from 'react'
import { BUSINESS_CATEGORIES } from '@/lib/businesses/categories'

const HELGELAND_KOMMUNER = [
  'Rana', 'Vefsn', 'Brønnøy', 'Alstahaug', 'Hemnes',
  'Lurøy', 'Sømna', 'Vega', 'Leirfjord', 'Dønna',
  'Herøy', 'Nesna', 'Hattfjelldal', 'Rødøy', 'Bindal',
  'Grane', 'Træna', 'Vevelstad',
]

interface Props {
  lockKategori?: string
}

export default function BedrifterFilters({ lockKategori }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentQ = searchParams.get('q') ?? ''
  const currentKommune = searchParams.get('kommune') ?? ''
  const currentEnk = searchParams.get('enk') === '1'
  const [inputQ, setInputQ] = useState(currentQ)

  // Alltid oppdatert referanse — unngår foreldede closures i debounce-timeouten
  const latestSearchParams = useRef(searchParams)
  useEffect(() => { latestSearchParams.current = searchParams }, [searchParams])

  // Synk inputQ fra URL ved tilbake/fremover-navigasjon
  useEffect(() => {
    if (currentQ !== inputQ.trim()) setInputQ(currentQ)
  }, [currentQ]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounset live-søk: oppdaterer URL 300 ms etter siste tastetrykk
  useEffect(() => {
    const trimmed = inputQ.trim()
    // 1 tegn gir altfor mange treff — vent til 2 eller tøm til 0
    if (trimmed.length === 1) return
    const timer = setTimeout(() => {
      const params = new URLSearchParams(latestSearchParams.current.toString())
      if (trimmed.length >= 2) params.set('q', trimmed)
      else params.delete('q')
      params.delete('side')
      // replace i stedet for push — søk-som-du-skriver skal ikke fylle opp historikken
      startTransition(() => router.replace(`${pathname}?${params.toString()}`))
    }, 300)
    return () => clearTimeout(timer)
  }, [inputQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('side')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, searchParams, pathname],
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Eksplisitt søk via knapp — push slik at det kan navigeres tilbake til
    const params = new URLSearchParams(latestSearchParams.current.toString())
    const trimmed = inputQ.trim()
    if (trimmed) params.set('q', trimmed)
    else params.delete('q')
    params.delete('side')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const hasAnyFilter = !!(currentQ || searchParams.get('kategori') || currentKommune || currentEnk)

  return (
    <div className="space-y-3">
      {/* Søkefelt */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={inputQ}
          onChange={e => setInputQ(e.target.value)}
          placeholder="Søk på navn eller orgnr…"
          className="flex-1 rounded-xl border border-ink/10 bg-paper px-4 py-2.5 text-sm shadow-sm outline-none focus:border-sea focus:ring-1 focus:ring-sea"
        />
        <button
          type="submit"
          className="rounded-xl bg-sea px-5 py-2.5 text-sm font-medium text-white hover:bg-fjord transition-colors"
        >
          Søk
        </button>
      </form>

      {/* Diskret laste-indikator — fast høyde unngår layout-shift */}
      <div className="h-4">
        {isPending && (
          <span className="text-xs text-muted animate-pulse">søker…</span>
        )}
      </div>

      {/* Filter-rad */}
      <div className="flex flex-wrap gap-2">
        {/* Kategori */}
        {!lockKategori && (
          <select
            value={searchParams.get('kategori') ?? ''}
            onChange={e => setParam('kategori', e.target.value)}
            className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm shadow-sm focus:border-sea focus:outline-none"
          >
            <option value="">Alle bransjer</option>
            {BUSINESS_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        )}

        {/* Kommune */}
        <select
          value={currentKommune}
          onChange={e => setParam('kommune', e.target.value)}
          className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm shadow-sm focus:border-sea focus:outline-none"
        >
          <option value="">Alle kommuner</option>
          {HELGELAND_KOMMUNER.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        {/* ENK-toggle */}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm shadow-sm select-none">
          <input
            type="checkbox"
            checked={currentEnk}
            onChange={e => setParam('enk', e.target.checked ? '1' : '')}
            className="accent-sea"
          />
          Vis enkeltpersonforetak
        </label>

        {/* Nullstill */}
        {hasAnyFilter && (
          <button
            onClick={() => {
              startTransition(() => router.push(pathname))
              setInputQ('')
            }}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm text-muted hover:border-sea hover:text-sea transition-colors"
          >
            ✕ Nullstill
          </button>
        )}
      </div>
    </div>
  )
}
