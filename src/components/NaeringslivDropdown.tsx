'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const ITEMS = [
  { href: '/bedrifter',       label: 'Bedrifter' },
  { href: '/stillinger',      label: 'Stillinger' },
  { href: '/anbud',           label: 'Anbud' },
  { href: '/pressemeldinger', label: 'Pressemeldinger' },
  { href: '/nyhetsbrev',      label: 'Nyhetsbrev' },
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

export function NaeringslivDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const toggleRef    = useRef<HTMLButtonElement>(null)
  const menuRef      = useRef<HTMLDivElement>(null)
  const focusFirst   = useRef(false)

  // Lukk ved klikk utenfor
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Flytt fokus til første menyrad etter åpning via tastatur
  useEffect(() => {
    if (open && focusFirst.current) {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
      focusFirst.current = false
    }
  }, [open])

  function openWithFocus() {
    focusFirst.current = true
    setOpen(true)
  }

  function handleToggleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        open ? setOpen(false) : openWithFocus()
        break
      case 'ArrowDown':
        e.preventDefault()
        open ? undefined : openWithFocus()
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    if (!menuRef.current) return
    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    )
    const idx = items.indexOf(document.activeElement as HTMLElement)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        items[(idx + 1) % items.length]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        items[(idx - 1 + items.length) % items.length]?.focus()
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        toggleRef.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Split: klikkbar lenke + toggle-knapp */}
      <div className="flex items-center gap-0.5">
        <Link
          href="/bedrifter"
          className="text-sm font-medium text-ink/70 transition hover:text-sea"
        >
          Næringsliv
        </Link>
        <button
          ref={toggleRef}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Åpne næringsliv-menyen"
          onKeyDown={handleToggleKeyDown}
          onClick={() => setOpen(v => !v)}
          className="rounded p-0.5 text-ink/40 transition hover:text-sea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea/50"
        >
          <Chevron open={open} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-ink/10 bg-white py-1.5 shadow-lg ring-1 ring-ink/5"
        >
          {ITEMS.map(item => (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-ink/70 transition hover:bg-fog hover:text-sea focus:bg-fog focus:text-sea focus:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
