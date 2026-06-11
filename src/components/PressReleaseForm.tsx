'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const input = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-sea'
const label = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-muted'

export function PressReleaseForm() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setStatus('sending')
    const form = e.currentTarget
    try {
      const r = await fetch('/innsending/pressemelding', { method: 'POST', body: new FormData(form) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Noe gikk galt.')
      form.reset(); setStatus('sent'); router.refresh()
    } catch (err: any) { setError(err.message); setStatus('idle') }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl bg-sea/5 p-6 text-center ring-1 ring-sea/15">
        <p className="font-medium text-fjord">Takk! Pressemeldingen er sendt inn.</p>
        <p className="mt-1 text-sm text-muted">Den publiseres så snart redaksjonen har godkjent den.</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-medium text-sea hover:underline">Send inn en til</button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label className={label}>Tittel *</label><input name="title" required className={input} /></div>
      <div><label className={label}>Avsender/organisasjon</label><input name="organization" className={input} /></div>
      <div><label className={label}>Ingress</label><textarea name="excerpt" rows={3} className={input} /></div>
      <div><label className={label}>Innhold *</label><textarea name="content" required rows={8} className={input} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={label}>Kontaktperson</label><input name="contactName" className={input} /></div>
        <div><label className={label}>E-post</label><input name="contactEmail" type="email" className={input} /></div>
        <div><label className={label}>Telefon</label><input name="contactPhone" type="tel" className={input} /></div>
      </div>
      <div><label className={label}>Bilde (maks 8 MB)</label><input name="image" type="file" accept="image/*" className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-sea file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-fjord" /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={status === 'sending'} className="rounded-full bg-sea px-7 py-3 font-medium text-white transition hover:bg-fjord disabled:opacity-60">
        {status === 'sending' ? 'Sender …' : 'Send inn til godkjenning'}
      </button>
    </form>
  )
}
