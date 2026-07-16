'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const input = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-sea'

export function AuthForm({ fra }: { fra?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email')); const password = String(fd.get('password')); const name = String(fd.get('name') || '')
    try {
      if (mode === 'register') {
        const r = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j?.errors?.[0]?.message || 'Kunne ikke registrere.')
        setRegistered(email)
        return
      }
      const loginRes = await fetch('/api/members/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!loginRes.ok) {
        const j = await loginRes.json().catch(() => ({}))
        const errName: string = j?.errors?.[0]?.name ?? ''
        const errMsg: string = j?.errors?.[0]?.message ?? ''
        const isUnverified =
          errName === 'UnverifiedEmail' ||
          loginRes.status === 403 ||
          errMsg.toLowerCase().includes('not verified') ||
          errMsg.toLowerCase().includes('not yet verified')
        if (isUnverified) { setUnverifiedEmail(email); return }
        throw new Error('Feil e-post eller passord.')
      }
      router.push(fra ?? '/min-side'); router.refresh()
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  function handleGoogleLogin() {
    if (fra) sessionStorage.setItem('authRedirect', fra)
    window.location.href = '/api/members/oauth/google'
  }

  if (unverifiedEmail) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-medium text-amber-800">E-posten er ikke bekreftet</p>
          <p className="mt-2 text-sm text-amber-700">
            Du må bekrefte e-posten din før du kan logge inn.
            Sjekk innboksen din for bekreftelseslenken vi sendte til <strong>{unverifiedEmail}</strong>.
          </p>
        </div>
        <button
          onClick={() => { setUnverifiedEmail(null); setError('') }}
          className="mt-4 w-full rounded-full border border-ink/15 py-3 text-sm font-medium text-ink/70 hover:bg-ink/5"
        >
          Tilbake til innlogging
        </button>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl bg-sea/10 p-6">
          <p className="font-medium text-fjord">Konto opprettet — sjekk innboksen din</p>
          <p className="mt-2 text-sm text-ink/70">
            Vi har sendt en bekreftelseslenke til <strong>{registered}</strong>.
            Klikk lenken i e-posten for å aktivere kontoen din.
          </p>
        </div>
        <button
          onClick={() => { setRegistered(null); setMode('login') }}
          className="mt-4 w-full rounded-full border border-ink/15 py-3 text-sm font-medium text-ink/70 hover:bg-ink/5"
        >
          Tilbake til innlogging
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-medium text-ink/80 transition hover:bg-ink/5"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16z"/><path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.3 0-11.7-3.7-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z"/></svg>
        Fortsett med Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-ink/10" /> eller <span className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="mb-5 flex rounded-full bg-ink/5 p-1 text-sm font-medium">
        <button onClick={() => setMode('login')} className={`flex-1 rounded-full py-2 ${mode === 'login' ? 'bg-white text-fjord shadow-sm' : 'text-muted'}`}>Logg inn</button>
        <button onClick={() => setMode('register')} className={`flex-1 rounded-full py-2 ${mode === 'register' ? 'bg-white text-fjord shadow-sm' : 'text-muted'}`}>Ny bruker</button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        {mode === 'register' && <input name="name" placeholder="Navn" className={input} />}
        <input name="email" type="email" required placeholder="E-post" className={input} />
        <input name="password" type="password" required minLength={8} placeholder="Passord (min. 8 tegn)" className={input} />
        {mode === 'login' && (
          <div className="text-right">
            <a href="/nytt-passord" className="text-xs text-sea hover:underline">Glemt passord?</a>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-sea px-6 py-3 font-medium text-white transition hover:bg-fjord disabled:opacity-60">
          {loading ? 'Vent …' : mode === 'login' ? 'Logg inn' : 'Opprett konto'}
        </button>
      </form>
    </div>
  )
}
