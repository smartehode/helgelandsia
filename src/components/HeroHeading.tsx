'use client'
import { useState, useEffect } from 'react'

const HEADINGS = [
  'Alt om Helgeland, samlet på ett sted',
  'Hva skjer på Helgeland i dag?',
  'Legg ut ditt eget arrangement',
  'Ledige stillinger — oppdatert hver dag',
  'Anbud som passer din bedrift',
  'Skrevet av Helgeland, for Helgeland',
  'Del et leserinnlegg med regionen',
  'Din bedrift. Din oppføring. Ta eierskap.',
]

const CLS = 'font-serif text-3xl font-semibold text-fjord sm:text-4xl'

// Span-stil: fyller hele gridcellen og sentrerer teksten vertikalt+horisontalt
// slik at korte og lange headinger alltid er visuelt midtstilte.
const SPAN_STYLE: React.CSSProperties = {
  gridArea: '1 / 1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.6s ease-in-out',
}

export function HeroHeading() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => {
      setActive(i => (i + 1) % HEADINGS.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  return (
    <h1 className={CLS} style={{ display: 'grid' }}>
      {HEADINGS.map((text, i) => (
        <span
          key={i}
          aria-hidden={i !== active ? true : undefined}
          style={{
            ...SPAN_STYLE,
            opacity: i === active ? 1 : 0,
            pointerEvents: i !== active ? 'none' : undefined,
          }}
        >
          {text}
        </span>
      ))}
    </h1>
  )
}
