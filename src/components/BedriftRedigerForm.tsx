'use client'
import { useState } from 'react'
import Link from 'next/link'

const DAY_LABELS: Record<string, string> = {
  mon: 'Mandag', tue: 'Tirsdag', wed: 'Onsdag', thu: 'Torsdag',
  fri: 'Fredag', sat: 'Lørdag', sun: 'Søndag',
}
const DAYS = Object.keys(DAY_LABELS)

type Hour = { day: string; opens: string; closes: string }

const inp = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-sea focus:ring-1 focus:ring-sea/20'
const lbl = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-muted'

export function BedriftRedigerForm({
  business,
  action,
  descriptionText,
}: {
  business: any
  action: (fd: FormData) => Promise<void>
  descriptionText: string
}) {
  const [hours, setHours] = useState<Hour[]>(
    (business.openingHours ?? []).map((h: any) => ({
      day: h.day ?? 'mon',
      opens: h.opens ?? '',
      closes: h.closes ?? '',
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addHour() {
    const used = new Set(hours.map(h => h.day))
    const next = DAYS.find(d => !used.has(d)) ?? 'mon'
    setHours(prev => [...prev, { day: next, opens: '09:00', closes: '17:00' }])
  }

  function removeHour(i: number) {
    setHours(prev => prev.filter((_, idx) => idx !== i))
  }

  function setField(i: number, field: keyof Hour, val: string) {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('openingHours', JSON.stringify(hours))
    try {
      await action(fd)
    } catch (err: any) {
      // NEXT_REDIRECT kastes av redirect() inne i Server Action — la React håndtere det
      if ((err?.digest ?? '').startsWith('NEXT_REDIRECT')) throw err
      setError(err?.message ?? 'Noe gikk galt. Prøv igjen.')
      setSaving(false)
    }
  }

  const logo = business.logo && typeof business.logo === 'object' ? business.logo : null
  const gallery = (business.gallery ?? []).filter((item: any) => item?.image?.url)

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* Read-only topp — navn + orgnr */}
      <div className="rounded-2xl bg-fog/60 p-4">
        <p className="font-semibold text-ink">{business.name}</p>
        {business.orgnr && (
          <p className="mt-0.5 text-xs text-muted">Org.nr. {business.orgnr}</p>
        )}
        <p className="mt-1.5 text-xs text-muted">
          Navn, org.nr. og BRREG-data oppdateres automatisk fra Brønnøysundregistrene og kan ikke redigeres her.
        </p>
      </div>

      {/* Slagord */}
      <div>
        <label className={lbl}>Slagord / kort beskrivelse</label>
        <input
          name="tagline"
          className={inp}
          defaultValue={business.tagline ?? ''}
          placeholder="Én setning om bedriften"
          maxLength={160}
        />
      </div>

      {/* Beskrivelse */}
      <div>
        <label className={lbl}>Beskrivelse</label>
        <textarea
          name="description"
          rows={7}
          className={inp}
          defaultValue={descriptionText}
          placeholder="Fortell om bedriften, produkter og tjenester…"
        />
      </div>

      {/* Logo */}
      <div>
        <label className={lbl}>Logo</label>
        {logo && (
          <div className="mb-3 inline-flex items-center gap-3">
            <div className="rounded-xl border border-ink/10 bg-white p-2">
              <img src={logo.url} alt="Nåværende logo" className="h-20 w-auto max-w-[160px] object-contain" />
            </div>
            <p className="text-xs text-muted">Nåværende logo</p>
          </div>
        )}
        <input
          name="logo"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-sea file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-fjord"
        />
        <p className="mt-1 text-xs text-muted">
          {logo ? 'Last opp nytt bilde for å erstatte nåværende logo.' : 'Last opp logo.'} Maks 8 MB.
        </p>
      </div>

      {/* Galleri */}
      <div>
        <label className={lbl}>Bildegalleri</label>
        {gallery.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {gallery.map((item: any) => (
              <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-fog">
                <img src={item.image.url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <input
          name="gallery"
          type="file"
          multiple
          accept="image/*"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-sea file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-fjord"
        />
        <p className="mt-1 text-xs text-muted">
          Velg ett eller flere bilder som legges til galleriet. Maks 8 MB per bilde.
        </p>
      </div>

      {/* Kontakt */}
      <div className="space-y-4">
        <p className={lbl} style={{ marginBottom: 0 }}>Kontaktinformasjon</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Telefon</label>
            <input name="phone" type="tel" className={inp} defaultValue={business.phone ?? ''} placeholder="+47 xxx xx xxx" />
          </div>
          <div>
            <label className={lbl}>E-post</label>
            <input name="email" type="email" className={inp} defaultValue={business.email ?? ''} placeholder="post@bedrift.no" />
          </div>
        </div>
        <div>
          <label className={lbl}>Nettside (URL)</label>
          <input name="website" type="url" className={inp} defaultValue={business.website ?? ''} placeholder="https://www.bedrift.no" />
        </div>
      </div>

      {/* Video */}
      <div>
        <label className={lbl}>Video-URL</label>
        <input name="video" type="url" className={inp} defaultValue={business.video ?? ''} placeholder="https://www.youtube.com/watch?v=…" />
        <p className="mt-1 text-xs text-muted">YouTube- eller Vimeo-lenke.</p>
      </div>

      {/* Sosiale medier */}
      <div className="space-y-3">
        <p className={lbl} style={{ marginBottom: 0 }}>Sosiale medier</p>
        {[
          { name: 'social_facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/…' },
          { name: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
          { name: 'social_linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/…' },
          { name: 'social_tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@…' },
          { name: 'social_youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@…' },
        ].map(f => (
          <div key={f.name} className="grid grid-cols-[110px_1fr] items-center gap-3">
            <span className="text-sm text-muted">{f.label}</span>
            <input
              name={f.name}
              type="url"
              className={inp}
              defaultValue={business.social?.[f.name.replace('social_', '')] ?? ''}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      {/* Åpningstider */}
      <div>
        <div className="flex items-center justify-between">
          <p className={lbl} style={{ marginBottom: 0 }}>Åpningstider</p>
          <button
            type="button"
            onClick={addHour}
            disabled={hours.length >= 7}
            className="text-xs font-medium text-sea hover:underline disabled:opacity-40"
          >
            + Legg til dag
          </button>
        </div>
        {hours.length === 0 && (
          <p className="mt-1.5 text-xs text-muted">Ingen åpningstider lagt til ennå.</p>
        )}
        <div className="mt-2 space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={h.day}
                onChange={e => setField(i, 'day', e.target.value)}
                className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-sea"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
              <input
                type="time"
                value={h.opens}
                onChange={e => setField(i, 'opens', e.target.value)}
                className="w-28 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-sea"
              />
              <span className="text-xs text-muted">–</span>
              <input
                type="time"
                value={h.closes}
                onChange={e => setField(i, 'closes', e.target.value)}
                className="w-28 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-sea"
              />
              <button
                type="button"
                onClick={() => removeHour(i)}
                className="ml-auto text-xs text-muted hover:text-red-500"
              >
                Fjern
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
      )}

      <div className="flex gap-3 border-t border-ink/5 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sea px-7 py-3 text-sm font-semibold text-white transition hover:bg-fjord disabled:opacity-60"
        >
          {saving ? 'Lagrer …' : 'Lagre endringer'}
        </button>
        <Link
          href="/min-side"
          className="rounded-full border border-ink/15 px-7 py-3 text-sm font-medium text-ink transition hover:bg-fog"
        >
          Avbryt
        </Link>
      </div>
    </form>
  )
}
