'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const inp = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-sea'
const lbl = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-muted'

interface ImportResult {
  tittel?: string
  beskrivelse?: string
  bildeId?: number
  bildeUrl?: string
  startdato?: string
  sluttdato?: string
  sted?: string
  hints: string[]
}

export function EventForm() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  // Import section
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Controlled form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [locationName, setLocationName] = useState('')
  const [ticketUrl, setTicketUrl] = useState('')
  const [price, setPrice] = useState('')
  const [free, setFree] = useState(false)
  const [useImportedImage, setUseImportedImage] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImport() {
    const url = importUrl.trim()
    if (!url) return
    setImporting(true)
    setImportError('')
    setImportResult(null)
    try {
      const r = await fetch('/api/arrangement-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Kunne ikke hente informasjon fra lenken.')
      const result: ImportResult = j
      setImportResult(result)
      if (result.tittel && !title) setTitle(result.tittel)
      if (result.beskrivelse && !description) setDescription(result.beskrivelse)
      if (result.startdato && !startDate) setStartDate(result.startdato)
      if (result.sluttdato && !endDate) setEndDate(result.sluttdato)
      if (result.sted && !locationName) setLocationName(result.sted)
      if (result.bildeId) setUseImportedImage(true)
    } catch (err: any) {
      setImportError(err.message)
    } finally {
      setImporting(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setStatus('sending')

    const fd = new FormData()
    fd.set('title', title)
    fd.set('description', description)
    fd.set('startDate', startDate)
    if (endDate) fd.set('endDate', endDate)
    if (locationName) fd.set('locationName', locationName)
    if (ticketUrl) fd.set('ticketUrl', ticketUrl)
    if (price) fd.set('price', price)
    if (free) fd.set('free', 'on')
    if (importResult) fd.set('sourceUrl', importUrl)

    const file = fileRef.current?.files?.[0]
    if (file && file.size > 0) {
      fd.set('image', file)
    } else if (useImportedImage && importResult?.bildeId) {
      fd.set('importedImageId', String(importResult.bildeId))
    }

    try {
      const r = await fetch('/innsending/arrangement', { method: 'POST', body: fd })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Noe gikk galt.')
      setTitle(''); setDescription(''); setStartDate(''); setEndDate('')
      setLocationName(''); setTicketUrl(''); setPrice(''); setFree(false)
      setImportUrl(''); setImportResult(null); setUseImportedImage(false)
      if (fileRef.current) fileRef.current.value = ''
      setStatus('sent')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl bg-sea/5 p-6 text-center ring-1 ring-sea/15">
        <p className="font-medium text-fjord">Takk! Arrangementet er sendt inn.</p>
        <p className="mt-1 text-sm text-muted">Det publiseres så snart redaksjonen har godkjent det.</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-medium text-sea hover:underline">
          Send inn et til
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Import from URL */}
      <div className="rounded-xl border border-ink/10 bg-fog/40 p-4">
        <p className={lbl}>Hent fra lenke (valgfritt)</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={e => setImportUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleImport() } }}
            placeholder="Lim inn lenke til arrangementet (f.eks. fra Facebook)"
            className={inp + ' flex-1'}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
            className="shrink-0 rounded-xl bg-fjord px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sea disabled:opacity-50"
          >
            {importing ? 'Henter …' : 'Hent info'}
          </button>
        </div>
        {/facebook\.com/i.test(importUrl) && !importResult && !importError && (
          <p className="mt-2 text-xs text-muted">
            Facebook deler begrenset informasjon med andre nettsteder — vi henter det vi kan, men dato og sted må du trolig fylle inn selv.
          </p>
        )}
        {importError && <p className="mt-2 text-sm text-red-600">{importError}</p>}
        {importResult && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold text-sea">
              Informasjon hentet — sjekk og juster alt før du sender inn.
            </p>
            {importResult.hints.map((h, i) => (
              <p key={i} className="text-xs text-amber-700">⚠ {h}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Tittel *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required className={inp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>Starter *</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Slutter</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className={inp}
          />
        </div>
      </div>

      {((startDate && new Date(startDate) < new Date()) || (endDate && new Date(endDate) < new Date())) && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          ⚠ Arrangementet ser ut til å ha vært — er datoen riktig?
        </p>
      )}

      <div>
        <label className={lbl}>Sted (f.eks. Kulturhuset)</label>
        <input value={locationName} onChange={e => setLocationName(e.target.value)} className={inp} />
      </div>

      <div>
        <label className={lbl}>Beskrivelse</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className={inp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lbl}>Pris</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="F.eks. 250 kr" className={inp} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={free} onChange={e => setFree(e.target.checked)} />
            Gratis
          </label>
        </div>
      </div>

      <div>
        <label className={lbl}>Billettlenke</label>
        <input
          type="url"
          value={ticketUrl}
          onChange={e => setTicketUrl(e.target.value)}
          placeholder="https://…"
          className={inp}
        />
      </div>

      <div>
        <label className={lbl}>Bilde (maks 8 MB)</label>
        {useImportedImage && importResult?.bildeUrl && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-3">
            <img src={importResult.bildeUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink">Bilde hentet automatisk</p>
              <p className="text-xs text-muted">Last opp et nytt for å erstatte det</p>
            </div>
            <button
              type="button"
              onClick={() => setUseImportedImage(false)}
              className="shrink-0 text-xs text-red-500 hover:underline"
            >
              Fjern
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={() => { if (fileRef.current?.files?.length) setUseImportedImage(false) }}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-sea file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-fjord"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={status === 'sending'}
        className="rounded-full bg-sea px-7 py-3 font-medium text-white transition hover:bg-fjord disabled:opacity-60"
      >
        {status === 'sending' ? 'Sender …' : 'Send inn til godkjenning'}
      </button>
    </form>
  )
}
