'use client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await fetch('/api/members/logout', { method: 'POST' })
    router.push('/'); router.refresh()
  }
  return <button onClick={logout} className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink/80 hover:bg-ink/5">Logg ut</button>
}
