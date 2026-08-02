'use client'
import { useState } from 'react'

interface Props {
  oppdragSlug: string
  bizId: number
}

export function MeldInteresseKnapp({ oppdragSlug, bizId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleClick() {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch(`/api/oppdrag/${oppdragSlug}/meld-interesse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bizId }),
      })
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
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Interesse meldt! Oppdragsgiveren mottar en e-post med bedriftens kontaktinfo og vil ta kontakt om de er interessert.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="rounded-xl bg-sea px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fjord disabled:opacity-60"
      >
        {status === 'loading' ? 'Sender…' : 'Meld interesse'}
      </button>
      <p className="text-[11px] text-muted">
        Oppdragsgiveren mottar din bedrifts navn og kontaktinfo. Du spam-beskyttes — du kan kun melde interesse én gang per oppdrag.
      </p>
      {status === 'error' && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
