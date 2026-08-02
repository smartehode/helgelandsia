'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NARINGSLIV_ITEMS = [
  { href: '/bedrifter',       label: 'Bedrifter' },
  { href: '/stillinger',      label: 'Stillinger' },
  { href: '/anbud',           label: 'Anbud' },
  { href: '/pressemeldinger', label: 'Pressemeldinger' },
  { href: '/nyhetsbrev',      label: 'Nyhetsbrev' },
]

const MAIN_ITEMS = [
  { href: '/',              label: 'Startside' },
  { href: '/leserinnlegg', label: 'Leserinnlegg' },
  // 'Næringsliv' rendres separat som expanderbar seksjon
  { href: '/arrangementer', label: 'Arrangementer' },
  { href: '/oppdrag',       label: 'Oppdrag' },
  { href: '/om',            label: 'Om oss' },
  { href: '/min-side',      label: 'Min side' },
]

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
      clipRule="evenodd"
    />
  </svg>
)

export function MobileNav() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [naringOpen, setNaringOpen] = useState(false)
  const pathname = usePathname()

  const close = () => setMenuOpen(false)
  const isActive = (href: string) => pathname === href

  // Næringslivs underlenker: aktiv hvis stien starter med noe av de
  const naringActive =
    pathname.startsWith('/bedrifter') ||
    pathname.startsWith('/stillinger') ||
    pathname.startsWith('/anbud') ||
    pathname.startsWith('/pressemeldinger') ||
    pathname.startsWith('/nyhetsbrev')

  return (
    <div className="md:hidden">
      {/* Hamburgerknagg */}
      <button
        onClick={() => setMenuOpen(v => !v)}
        aria-label={menuOpen ? 'Lukk meny' : 'Åpne meny'}
        aria-expanded={menuOpen}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-ink/5"
      >
        <span className={`block h-0.5 w-5 bg-ink transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
        <span className={`block h-0.5 w-5 bg-ink transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
        <span className={`block h-0.5 w-5 bg-ink transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
      </button>

      {menuOpen && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-ink/5 bg-fog shadow-lg">
          <nav className="mx-auto max-w-6xl px-4 py-3" aria-label="Mobilmeny">

            {/* Startside + Leserinnlegg */}
            {MAIN_ITEMS.slice(0, 2).map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-ink/5
                  ${isActive(item.href) ? 'text-sea' : 'text-ink/80'}`}
              >
                {item.label}
              </Link>
            ))}

            {/* Næringsliv — klikkbar lenke + pil-toggle */}
            <div>
              <div className={`flex items-center rounded-lg hover:bg-ink/5 ${naringActive ? 'text-sea' : 'text-ink/80'}`}>
                <Link
                  href="/bedrifter"
                  onClick={close}
                  className="flex-1 px-3 py-2.5 text-sm font-medium"
                >
                  Næringsliv
                </Link>
                <button
                  aria-expanded={naringOpen}
                  aria-haspopup="true"
                  aria-label="Vis næringsliv-undersider"
                  onClick={() => setNaringOpen(v => !v)}
                  className="px-3 py-2.5 text-ink/40"
                >
                  <Chevron open={naringOpen} />
                </button>
              </div>

              {naringOpen && (
                <div className="ml-3 border-l-2 border-ink/10 pl-2">
                  {NARINGSLIV_ITEMS.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-ink/5
                        ${isActive(item.href) ? 'text-sea' : 'text-ink/60'}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resten: Arrangementer, Oppdrag, Om oss, Min side */}
            {MAIN_ITEMS.slice(2).map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-ink/5
                  ${isActive(item.href) ? 'text-sea' : 'text-ink/80'}`}
              >
                {item.label}
              </Link>
            ))}

          </nav>
        </div>
      )}
    </div>
  )
}
