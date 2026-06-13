'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CarouselItem {
  title: string
  link: string
  image: string
  source: string
  pubDate: string
}

const SOURCE_PILL: Record<string, string> = {
  'BAnett':          'bg-sea/25 text-sea',
  'Helgelendingen':  'bg-sea/40 text-sea',
  'Helgelands Blad': 'bg-fjord/20 text-fjord',
  'NRK Nordland':    'bg-fjord/35 text-fjord',
}

export function NewsCarousel({ items }: { items: CarouselItem[] }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback((next: number) => {
    setVisible(false)
    setTimeout(() => {
      setIdx(next)
      setVisible(true)
    }, 220)
  }, [])

  useEffect(() => {
    if (paused || items.length <= 1) return
    const id = setInterval(() => goTo((idx + 1) % items.length), 6000)
    return () => clearInterval(id)
  }, [paused, idx, items.length, goTo])

  if (!items.length) return null

  const item = items[idx]
  const hasImage = !!item.image
  const pillStyle = SOURCE_PILL[item.source] ?? 'bg-white/20 text-white'

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide: aspect-video container holds both <a> and dots */}
      <div className="relative aspect-video rounded-xl overflow-hidden">

        {/* Klikkbar flate */}
        <a
          href={item.link}
          target="_blank"
          rel="noopener"
          className="absolute inset-0 block"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.22s ease' }}
        >
          {/* Bakgrunn */}
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}

          {/* Overlay — gradient ved bilde, fjord→sea uten bilde */}
          <div className={`absolute inset-0 ${
            hasImage
              ? 'bg-gradient-to-t from-black/80 via-black/15 to-black/10'
              : 'bg-gradient-to-br from-fjord to-sea'
          }`} />

          {/* Kildenavn */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${pillStyle}`}>
              {item.source}
            </span>
          </div>

          {/* Tittel */}
          <div className={`absolute inset-0 z-10 flex p-5 ${
            hasImage ? 'items-end' : 'items-center justify-center'
          }`}>
            <p className={`font-serif font-semibold text-white leading-snug drop-shadow-sm ${
              hasImage ? 'text-lg line-clamp-3' : 'text-xl text-center line-clamp-4'
            }`}>
              {item.title}
            </p>
          </div>
        </a>

        {/* Prikkindikator — inne i overflow-hidden, over <a> (z-20) */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Sak ${i + 1} av ${items.length}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx
                    ? 'bg-white w-5'
                    : 'bg-white/40 w-1.5 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
