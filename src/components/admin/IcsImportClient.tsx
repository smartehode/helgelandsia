'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface PreviewEvent {
  uid: string
  occurrenceId: string
  summary: string
  start: string
  end: string
  location?: string
  description?: string
  url?: string
  attachUrl?: string
  isAllDay: boolean
  existing: boolean
  past: boolean
  hasImage: boolean
}

type ResultStatus = 'created' | 'updated' | 'skipped_past' | 'skipped_duplicate' | 'error'

interface EventResult {
  occurrenceId: string
  summary: string
  status: ResultStatus
  error?: string
}

interface ImportResult {
  results: EventResult[]
  counts: Partial<Record<ResultStatus, number>>
}

interface FetchImgResult { found: number; failed: number; total: number; errors: string[] }

interface Options {
  skipPast: boolean
  update: boolean
  fetchImages: boolean
  status: 'draft' | 'published'
}

const inp = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-sea'
const lbl = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-muted'
const chk = 'flex items-start gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3'

function fmtDate(iso: string): string {
  try { return format(new Date(iso), "EEE d. MMM yyyy 'kl.' HH:mm", { locale: nb }) } catch { return iso }
}

const STATUS_LABELS: Record<ResultStatus, string> = {
  created: 'Opprettet',
  updated: 'Oppdatert',
  skipped_past: 'Hoppet over (ferdig)',
  skipped_duplicate: 'Hoppet over (finnes)',
  error: 'Feil',
}

const STATUS_ICON: Record<ResultStatus, string> = {
  created: '✓',
  updated: '↻',
  skipped_past: '→',
  skipped_duplicate: '→',
  error: '✗',
}

const STATUS_COLOR: Record<ResultStatus, string> = {
  created: 'text-green-700',
  updated: 'text-blue-700',
  skipped_past: 'text-muted',
  skipped_duplicate: 'text-muted',
  error: 'text-red-600',
}

export function IcsImportClient() {
  const [showPaste, setShowPaste] = useState(false)
  const [pasteContent, setPasteContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fetchingImages, setFetchingImages] = useState(false)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<PreviewEvent[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [options, setOptions] = useState<Options>({
    skipPast: true,
    update: true,
    fetchImages: true,
    status: 'draft',
  })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [fetchImgResult, setFetchImgResult] = useState<FetchImgResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setEvents(null)
    setImportResult(null)
    setLoading(true)

    const fd = new FormData()
    const file = fileRef.current?.files?.[0]
    if (file) {
      fd.set('file', file)
    } else if (pasteContent.trim()) {
      fd.set('content', pasteContent.trim())
    } else {
      setError('Last opp en .ics-fil eller lim inn ICS-innholdet.')
      setLoading(false)
      return
    }

    try {
      const r = await fetch('/api/admin/ics-import', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Noe gikk galt.')
      const evts: PreviewEvent[] = j.events
      setEvents(evts)
      const sel = new Set<string>()
      for (const ev of evts) {
        if (!ev.existing && !ev.past) sel.add(ev.occurrenceId)
      }
      setSelected(sel)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!events || selected.size === 0) return
    setImporting(true)
    setError('')

    const toImport = events.filter(e => selected.has(e.occurrenceId))
    try {
      const r = await fetch('/api/admin/ics-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', events: toImport, ...options }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Noe gikk galt.')
      setImportResult(j as ImportResult)
      setEvents(null)
      setSelected(new Set())
      setPasteContent('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  async function handleFetchImages() {
    setFetchingImages(true)
    setFetchImgResult(null)
    try {
      const r = await fetch('/api/admin/ics-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-images' }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Noe gikk galt.')
      setFetchImgResult(j)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFetchingImages(false)
    }
  }

  function toggleAll(check: boolean) {
    if (!events) return
    if (check) setSelected(new Set(events.filter(e => !e.existing || options.update).map(e => e.occurrenceId)))
    else setSelected(new Set())
  }

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function opt<K extends keyof Options>(key: K, val: Options[K]) {
    setOptions(prev => ({ ...prev, [key]: val }))
  }

  function startOver() {
    setEvents(null)
    setImportResult(null)
    setSelected(new Set())
    setError('')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-10">

      {/* ── Phase 1: Input ── */}
      {!events && !importResult && (
        <form onSubmit={handlePreview} className="space-y-5">
          {/* File upload */}
          <div>
            <label className={lbl}>Last opp .ics-fil</label>
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              onChange={() => setPasteContent('')}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-sea file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-fjord"
            />
          </div>

          {/* Paste toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowPaste(p => !p)}
              className="text-sm font-medium text-sea hover:underline"
            >
              {showPaste ? '▲ Skjul tekst-felt' : '▼ Eller lim inn ICS-innhold direkte'}
            </button>
            {showPaste && (
              <textarea
                value={pasteContent}
                onChange={e => { setPasteContent(e.target.value); if (fileRef.current) fileRef.current.value = '' }}
                rows={8}
                placeholder={'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n...\nEND:VEVENT\nEND:VCALENDAR'}
                className={inp + ' mt-2 font-mono text-xs'}
              />
            )}
          </div>

          {/* Facebook tip */}
          <div className="rounded-xl border border-sun/40 bg-sun/10 px-4 py-3">
            <p className="text-xs font-semibold text-amber-800">Facebook-tips</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Arrangement → Del → Legg til i kalender → last ned .ics-filen, og last den opp her.
              Merk at Facebook ikke alltid gir dato og sted — disse feltene kan mangle.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={loading}
            className="rounded-full bg-fjord px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-sea disabled:opacity-60"
          >
            {loading ? 'Analyserer …' : 'Analyser kalender'}
          </button>
        </form>
      )}

      {/* ── Phase 2: Preview + options ── */}
      {events && !importResult && (
        <div className="space-y-6">
          {/* Options */}
          <div className="space-y-2">
            <p className={lbl}>Valg</p>
            <div className={chk}>
              <input type="checkbox" checked={options.skipPast} onChange={e => opt('skipPast', e.target.checked)} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">Hopp over arrangementer som allerede er ferdige</p>
                <p className="text-xs text-muted">Importerer ikke arrangementer der slutt-tidspunktet er passert</p>
              </div>
            </div>
            <div className={chk}>
              <input type="checkbox" checked={options.update} onChange={e => opt('update', e.target.checked)} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">Oppdater hvis samme UID finnes fra før</p>
                <p className="text-xs text-muted">Oppdaterer tittel, dato, sted og beskrivelse. Status og URL bevares.</p>
              </div>
            </div>
            <div className={chk}>
              <input type="checkbox" checked={options.fetchImages} onChange={e => opt('fetchImages', e.target.checked)} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">Hent cover-bilde</p>
                <p className="text-xs text-muted">Prøver ATTACH-URL i ICS, deretter og:image fra arrangement-siden</p>
              </div>
            </div>
            <div className={chk}>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-ink">Status:</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={options.status === 'draft'} onChange={() => opt('status', 'draft')} />
                  Kladd (anbefalt)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={options.status === 'published'} onChange={() => opt('status', 'published')} />
                  Publisert direkte
                </label>
              </div>
            </div>
          </div>

          {/* Select all / deselect */}
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-fjord">
              {events.length} arrangement{events.length !== 1 ? 'er' : ''} funnet
              <span className="ml-2 text-sm font-normal text-muted">({selected.size} valgt)</span>
            </h2>
            <div className="flex gap-3 text-sm">
              <button onClick={() => toggleAll(true)} className="text-sea hover:underline">Velg alle</button>
              <span className="text-muted">·</span>
              <button onClick={() => toggleAll(false)} className="text-sea hover:underline">Fjern valg</button>
            </div>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-fog/60">
                <tr>
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={events.length > 0 && events.every(e => selected.has(e.occurrenceId))}
                      onChange={e => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-ink/60">Tittel</th>
                  <th className="hidden px-3 py-3 text-left font-semibold text-ink/60 sm:table-cell">Dato</th>
                  <th className="hidden px-3 py-3 text-left font-semibold text-ink/60 md:table-cell">Sted</th>
                  <th className="w-28 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {events.map(ev => (
                  <tr
                    key={ev.occurrenceId}
                    className={[
                      'transition hover:bg-fog/40',
                      ev.past ? 'opacity-60' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(ev.occurrenceId)}
                        onChange={() => toggle(ev.occurrenceId)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-ink">{ev.summary}</p>
                      <p className="mt-0.5 text-xs text-muted sm:hidden">{fmtDate(ev.start)}</p>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <span className="text-xs text-ink/70">{fmtDate(ev.start)}</span>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <span className="text-xs text-muted">{ev.location ?? '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        {ev.existing && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Finnes
                          </span>
                        )}
                        {ev.past && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Passert
                          </span>
                        )}
                        {ev.hasImage && !ev.past && (
                          <span className="rounded-full bg-sea/10 px-2 py-0.5 text-[10px] font-semibold text-sea">
                            Bilde
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="rounded-full bg-sea px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-fjord disabled:opacity-60"
            >
              {importing ? 'Importerer …' : `Importer valgte (${selected.size})`}
            </button>
            <button
              onClick={startOver}
              className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-medium text-ink/60 transition hover:border-ink/40"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* ── Phase 3: Import results ── */}
      {importResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-sea/20 bg-sea/5 px-5 py-4">
            <p className="font-semibold text-fjord">Import fullført</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {(importResult.counts.created ?? 0) > 0 && (
                <span className="text-green-700">✓ {importResult.counts.created} opprettet</span>
              )}
              {(importResult.counts.updated ?? 0) > 0 && (
                <span className="text-blue-700">↻ {importResult.counts.updated} oppdatert</span>
              )}
              {(importResult.counts.skipped_past ?? 0) > 0 && (
                <span className="text-muted">→ {importResult.counts.skipped_past} hoppet over (ferdige)</span>
              )}
              {(importResult.counts.skipped_duplicate ?? 0) > 0 && (
                <span className="text-muted">→ {importResult.counts.skipped_duplicate} hoppet over (finnes)</span>
              )}
              {(importResult.counts.error ?? 0) > 0 && (
                <span className="text-red-600">✗ {importResult.counts.error} feil</span>
              )}
            </div>
          </div>

          {/* Per-row results */}
          <div className="overflow-hidden rounded-xl border border-ink/10">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ink/5">
                {importResult.results.map((r, i) => (
                  <tr key={i} className="hover:bg-fog/40">
                    <td className={`w-6 px-4 py-2.5 font-bold ${STATUS_COLOR[r.status]}`}>
                      {STATUS_ICON[r.status]}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink">{r.summary}</td>
                    <td className={`px-3 py-2.5 text-right text-xs ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                      {r.error && <span className="ml-1 text-red-400">— {r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={startOver}
            className="rounded-full bg-fjord px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-sea"
          >
            Importer ny fil
          </button>
        </div>
      )}

      {/* ── Fetch missing images (always available) ── */}
      <div className="border-t border-ink/10 pt-8">
        <h2 className="mb-1 font-serif text-base font-semibold text-ink">Hent manglende bilder</h2>
        <p className="mb-4 text-sm text-muted">
          Kjører bildehenting (og:image) for alle arrangementer som har en kilde-URL men mangler bilde.
          Maks 20 per kjøring.
        </p>
        <button
          onClick={handleFetchImages}
          disabled={fetchingImages}
          className="rounded-full border border-sea px-6 py-2 text-sm font-medium text-sea transition hover:bg-sea hover:text-white disabled:opacity-60"
        >
          {fetchingImages ? 'Henter …' : 'Hent manglende bilder'}
        </button>

        {fetchImgResult && (
          <div className="mt-3 rounded-xl border border-ink/10 bg-fog/40 px-4 py-3 text-sm">
            <p className="font-medium text-ink">
              Fant bilde til {fetchImgResult.found} av {fetchImgResult.total} arrangementer
              {fetchImgResult.failed > 0 && ` (${fetchImgResult.failed} feilet)`}.
            </p>
            {fetchImgResult.errors.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {fetchImgResult.errors.map((e, i) => <li key={i} className="text-xs text-red-600">✗ {e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
