'use client'
import { useState } from 'react'
import { BUSINESS_CATEGORIES } from '@/lib/businesses/categories'
import { KOMMUNENAVN_LC } from '@/lib/helgeland/kommuner'

const kommuneOptions = [...KOMMUNENAVN_LC].sort().map(navn => ({
  label: navn.charAt(0).toUpperCase() + navn.slice(1),
  value: navn,
}))

export function OppdragForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/innsending/oppdrag', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Noe gikk galt.'); setStatus('error'); return }
      setStatus('success')
    } catch {
      setError('Noe gikk galt. Prøv igjen.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-800">
        <p className="font-semibold">Oppdrag sendt inn!</p>
        <p className="mt-1 text-emerald-700">
          Takk — redaksjonen ser på det og publiserer det snart. Du får e-post når det er godkjent.
        </p>
      </div>
    )
  }

  const field = 'block w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-sea focus:outline-none'
  const label = 'block text-xs font-medium text-ink/70 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={label}>Hva trenger du hjelp til? *</label>
        <input name="tittel" required placeholder="F.eks. «Elektriker til bad» eller «Logo til ny bedrift»"
          className={field} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Bransje / type hjelp *</label>
          <select name="kategori" required className={field} defaultValue="">
            <option value="" disabled>Velg kategori</option>
            {BUSINESS_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Kommune *</label>
          <select name="kommune" required className={field} defaultValue="">
            <option value="" disabled>Velg kommune</option>
            {kommuneOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Ønsket tidsrom</label>
        <input name="onsketTidsrom" placeholder='F.eks. "Innen utgangen av august"'
          className={field} />
      </div>

      <div>
        <label className={label}>Beskrivelse</label>
        <textarea name="beskrivelse" rows={4} placeholder="Beskriv hva du trenger — jo mer detaljer, jo enklere for bedriftene å vurdere."
          className={`${field} resize-y`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Din e-post (for bedriftene å nå deg)</label>
          <input name="kontaktEpost" type="email" placeholder="din@epost.no" className={field} />
        </div>
        <div>
          <label className={label}>Telefon</label>
          <input name="kontaktTelefon" type="tel" placeholder="+47 000 00 000" className={field} />
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Helgelandsia formidler kun kontakt mellom deg og lokale bedrifter, og er ikke part i eventuelle avtaler som inngås. Kontaktinfo er kun synlig for bedrifter som melder interesse.
      </p>

      {status === 'error' && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="w-full rounded-xl bg-fjord px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sea disabled:opacity-60">
        {status === 'loading' ? 'Sender…' : 'Send inn oppdrag'}
      </button>
    </form>
  )
}
