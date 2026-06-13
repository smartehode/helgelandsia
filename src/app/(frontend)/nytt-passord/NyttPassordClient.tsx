'use client'

import { useState } from 'react'

const input = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-sea'

function ForgotForm() {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/members/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(fd.get('email')) }),
      })
      if (!res.ok) throw new Error('Noe gikk galt. Prøv igjen.')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-sea/10 p-6 text-center">
        <p className="font-medium text-fjord">Sjekk innboksen din</p>
        <p className="mt-2 text-sm text-ink/70">
          Hvis e-postadressen er registrert hos oss, har du nå mottatt en lenke for å sette nytt passord.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="email" type="email" required placeholder="Din e-postadresse" className={input} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="w-full rounded-full bg-sea px-6 py-3 font-medium text-white hover:bg-fjord disabled:opacity-60">
        {loading ? 'Sender …' : 'Send tilbakestillingslenke'}
      </button>
      <p className="text-center text-sm">
        <a href="/logg-inn" className="text-sea hover:underline">Tilbake til innlogging</a>
      </p>
    </form>
  )
}

function ResetForm({ token }: { token: string }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    const password = String(fd.get('password'))
    const confirm = String(fd.get('confirm'))
    if (password !== confirm) {
      setError('Passordene er ikke like.')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/members/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) throw new Error('Lenken er ugyldig eller utløpt. Be om en ny.')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-sea/10 p-6 text-center">
        <p className="font-medium text-fjord">Passordet er oppdatert!</p>
        <p className="mt-2 text-sm text-ink/70">Du kan nå logge inn med ditt nye passord.</p>
        <a href="/logg-inn" className="mt-4 inline-block rounded-full bg-sea px-6 py-2.5 text-sm font-medium text-white hover:bg-fjord">
          Gå til innlogging
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="password" type="password" required minLength={8} placeholder="Nytt passord (min. 8 tegn)" className={input} />
      <input name="confirm" type="password" required minLength={8} placeholder="Gjenta passordet" className={input} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="w-full rounded-full bg-sea px-6 py-3 font-medium text-white hover:bg-fjord disabled:opacity-60">
        {loading ? 'Lagrer …' : 'Sett nytt passord'}
      </button>
    </form>
  )
}

export default function NyttPassordClient({ token }: { token?: string }) {
  return token ? <ResetForm token={token} /> : <ForgotForm />
}
