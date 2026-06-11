'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem { label: string; url: string; id?: string | null }

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} aria-label="Meny"
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-ink/5">
        <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
        <span className={`block h-0.5 w-5 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
        <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-ink/5 bg-fog shadow-lg">
          <nav className="mx-auto max-w-6xl px-4 py-3">
            {items.map((item) => (
              <Link key={item.id ?? item.url} href={item.url}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-ink/5 ${pathname === item.url ? 'text-sea' : 'text-ink/80'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
