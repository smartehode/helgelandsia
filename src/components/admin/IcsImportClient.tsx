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
  isAllDay: boolean
  existing: boolean
  past: boolean
}

const inp = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-sea'
const lbl = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-muted'

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "EEEE d. MMM yyyy 'kl.' HH:mm", { locale: nb })
  } catch {
    return iso
  }
}

export function IcsImportClient() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<PreviewEvent[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setEvents(null)
    setResult(null)
    setLoading(true)

    const fd = new FormData()
    const file = fileRef.current?.files?.[0]
    if (file) {
      fd.set('file', file)
    } else if (url.trim()) {
      fd.set('url', url.trim())
    } else {
      setError('Lim inn en URL eller last opp en .ics-fil.')
      setLoading(false)
      return
    }

    try {
      const r = await fetch('/api/admin/ics-import', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Noe gikk galt.')
      const evts: PreviewEvent[] = j.events
      setEvents(evts)
      // Pre-select: future, non-existing events
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

  function toggleAll(check: boolean) {
    if (!events) return
    if (check) {
      setSelected(new Set(events.filter(e => !e.existing).map(e => e.occurrenceId)))
    } else {
      setSelected(new Set())
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleImport() {
    if (!events || selected.size === 0) return
    setImporting(true)
    setError('')
    setResult(null)

    const toImport = events.filter(e => selected.has(e.occurrenceId))
    try {
      const r = await fetch('/api/admin/ics-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: toImport, status }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Noe gikk galt.')
      setResult(j)
      setEvents(null)
      setSelected(new Set())
      setUrl('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Input form */}
      <form onSubmit={handlePreview} className="space-y-4">
        <div>
          <label className={lbl}>Kilde</label>
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); if (fileRef.current) fileRef.current.value = '' }}
            placeholder="https://kulturhuset.no/events.ics"
            className={inp}
          />
          <p className="mt-1.5 text-xs text-muted">— eller last opp en fil —</p>
          <input
            ref={fileRef}
            type="file"
            accept=".ics,text/calendar"
            onChange={() => setUrl('')}
            className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-sea file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-fjord"
          />
        </div>
        <button
          disabled={loading}
          className="rounded-full bg-fjord px-7 py-2.5 text-sm font-medium text-white transition hover:bg-sea disabled:opacity-60"
        >
          {loading ? 'Analyserer …' : 'Analyser kalender'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-sea/30 bg-sea/5 px-4 py-4">
          <p className="font-semibold text-fjord">
            ✓ {result.imported} arrangement{result.imported !== 1 ? 'er' : ''} opprettet
            {result.skipped > 0 && `, ${result.skipped} hoppet over (allerede importert)`}.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.errors.map((e, i) => <li key={i} className="text-sm text-red-600">⚠ {e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Preview table */}
      {events && events.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-fjord">
              {events.length} arrangement{events.length !== 1 ? 'er' : ''} funnet
            </h2>
            <div className="flex gap-3 text-sm">
              <button onClick={() => toggleAll(true)} className="text-sea hover:underline">Velg alle</button>
              <span className="text-muted">·</span>
              <button onClick={() => toggleAll(false)} className="text-sea hover:underline">Fjern valg</button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-fog/60">
                <tr>
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={events.filter(e => !e.existing).every(e => selected.has(e.occurrenceId))}
                      onChange={e => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-ink/60">Tittel</th>
                  <th className="hidden px-3 py-3 text-left font-semibold text-ink/60 sm:table-cell">Dato</th>
                  <th className="hidden px-3 py-3 text-left font-semibold text-ink/60 md:table-cell">Sted</th>
                  <th className="w-24 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {events.map(ev => (
                  <tr
                    key={ev.occurrenceId}
                    className={[
                      'transition',
                      ev.existing ? 'bg-ink/[0.03] opacity-60' : 'hover:bg-fog/50',
                      ev.past && !ev.existing ? 'opacity-70' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        disabled={ev.existing}
                        checked={selected.has(ev.occurrenceId)}
                        onChange={() => toggle(ev.occurrenceId)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-ink">{ev.summary}</p>
                      <p className="sm:hidden mt-0.5 text-xs text-muted">{formatDate(ev.start)}</p>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <span className="text-ink/70">{formatDate(ev.start)}</span>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <span className="text-xs text-muted">{ev.location ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ev.existing && (
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Finnes
                        </span>
                      )}
                      {!ev.existing && ev.past && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Passert
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-2.5">
              <label className="text-sm font-medium text-ink">Status:</label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="status" value="draft" checked={status === 'draft'} onChange={() => setStatus('draft')} />
                Utkast
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="status" value="published" checked={status === 'published'} onChange={() => setStatus('published')} />
                Publiser direkte
              </label>
            </div>
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="rounded-full bg-sea px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-fjord disabled:opacity-60"
            >
              {importing ? 'Importerer …' : `Importer valgte (${selected.size})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
