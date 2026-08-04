'use client'
import { useState } from 'react'

interface Props {
  kompakt?: boolean
  fra?: string
}

export function NyhetsbrevPaamelding({ kompakt = false, fra = '' }: Props) {
  const [epost, setEpost] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/nyhetsbrev/paamelding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epost, fra }),
      })
      if (res.status === 429) {
        setState('error')
        setErrorMsg('For mange forsøk — vent litt og prøv igjen.')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setState('error')
        setErrorMsg((data as any).error || 'Noe gikk galt. Prøv igjen.')
        return
      }
      setState('success')
    } catch {
      setState('error')
      setErrorMsg('Noe gikk galt. Sjekk internettforbindelsen og prøv igjen.')
    }
  }

  if (state === 'success') {
    return (
      <p className={kompakt ? 'text-sm text-white/90' : 'text-sm text-green-700 font-medium'}>
        Takk! Sjekk e-posten din og klikk bekreftelseslenken.
      </p>
    )
  }

  if (kompakt) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={epost}
          onChange={e => setEpost(e.target.value)}
          placeholder="din@epost.no"
          disabled={state === 'loading'}
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sea transition hover:bg-fog disabled:opacity-60"
        >
          {state === 'loading' ? '…' : 'Meld på'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={epost}
          onChange={e => setEpost(e.target.value)}
          placeholder="din@epost.no"
          disabled={state === 'loading'}
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-sea/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="shrink-0 rounded-xl bg-fjord px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sea disabled:opacity-60"
        >
          {state === 'loading' ? '…' : 'Meld meg på'}
        </button>
      </div>
      <p className="text-xs text-muted">
        Ukentlig e-post med det som skjer på Helgeland. Avmelding i hver utsendelse.
      </p>
      {state === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </form>
  )
}
