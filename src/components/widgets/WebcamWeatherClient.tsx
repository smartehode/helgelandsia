'use client'
import { useState, useEffect, useRef } from 'react'
import type { WidgetVariant } from './PowerPriceWidget'

export interface Camera {
  url: string
  title: string
  source: string
}

export interface Location {
  name: string
  lat: number
  lng: number
  cameras: Camera[]
}

interface WeatherData {
  temp: number
  code: number
}

interface Props {
  title: string
  locations: Location[]
  variant: WidgetVariant
}

function addCacheBuster(url: string, ts: number): string {
  try {
    const u = new URL(url)
    u.searchParams.set('t', String(ts))
    return u.toString()
  } catch {
    return url + (url.includes('?') ? '&' : '?') + 't=' + ts
  }
}

function weatherInfo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Klart', emoji: '☀️' }
  if (code === 1) return { label: 'Stort sett klart', emoji: '🌤️' }
  if (code === 2) return { label: 'Lettskyet', emoji: '⛅' }
  if (code === 3) return { label: 'Overskyet', emoji: '☁️' }
  if (code >= 45 && code <= 48) return { label: 'Tåke', emoji: '🌫️' }
  if (code >= 51 && code <= 55) return { label: 'Yr', emoji: '🌦️' }
  if (code >= 56 && code <= 57) return { label: 'Isende yr', emoji: '🌨️' }
  if (code >= 61 && code <= 65) return { label: 'Regn', emoji: '🌧️' }
  if (code >= 66 && code <= 67) return { label: 'Isende regn', emoji: '🌨️' }
  if (code >= 71 && code <= 75) return { label: 'Snø', emoji: '❄️' }
  if (code === 77) return { label: 'Kornet snø', emoji: '🌨️' }
  if (code >= 80 && code <= 82) return { label: 'Regnbyger', emoji: '🌦️' }
  if (code >= 85 && code <= 86) return { label: 'Snøbyger', emoji: '🌨️' }
  if (code === 95) return { label: 'Torden', emoji: '⛈️' }
  if (code >= 96) return { label: 'Torden med hagl', emoji: '⛈️' }
  return { label: 'Variabelt', emoji: '🌡️' }
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

interface LightboxProps {
  cam: Camera
  src: string
  camIdx: number
  camCount: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function Lightbox({ cam, src, camIdx, camCount, onClose, onPrev, onNext }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Focus close button on open
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Kamera: ${cam.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        ref={closeRef}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Lukk"
        onClick={e => { e.stopPropagation(); onClose() }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Position indicator — upper left */}
      <div className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1 text-sm tabular-nums text-white">
        {camIdx + 1}/{camCount}
      </div>

      {/* Image container — clicks here do NOT close the lightbox */}
      <div
        className="relative"
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={cam.title}
          className="max-h-[95vh] max-w-[95vw] object-contain"
        />
        {/* Bottom gradient with title + source */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-16">
          <p className="font-serif text-xl font-bold text-white">{cam.title}</p>
          <p className="text-sm text-white/70">{cam.source}</p>
        </div>
      </div>

      {/* Navigation arrows */}
      {camCount > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-2xl leading-none text-white backdrop-blur-sm hover:bg-white/25"
            aria-label="Forrige kamera"
            onClick={e => { e.stopPropagation(); onPrev() }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-2xl leading-none text-white backdrop-blur-sm hover:bg-white/25"
            aria-label="Neste kamera"
            onClick={e => { e.stopPropagation(); onNext() }}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function WebcamWeatherClient({ title, locations, variant }: Props) {
  const [locIdx, setLocIdx] = useState(0)
  const [camIdx, setCamIdx] = useState(0)
  const [ts, setTs] = useState(0)
  const [imgError, setImgError] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const isHovered = useRef(false)
  const isPaused = useRef(false)
  const isLightboxOpen = useRef(false)
  const imgButtonRef = useRef<HTMLButtonElement>(null)
  const weatherCache = useRef<Record<string, { data: WeatherData; fetchedAt: number }>>({})

  const currentLoc = locations[locIdx]
  const currentCam = currentLoc.cameras[camIdx]
  const camCount = currentLoc.cameras.length

  // Initialize ts client-side only — avoids hydration mismatch (server would get a different Date.now())
  useEffect(() => {
    setTs(Date.now())
  }, [])

  // Diagnostic: log all camera URLs for current location so dead feeds are visible in DevTools
  useEffect(() => {
    console.group(`[Kamera] ${currentLoc.name} — ${camCount} kameraer`)
    currentLoc.cameras.forEach((cam, i) => {
      console.log(`  ${i + 1}. "${cam.title}" (${cam.source})\n     ${cam.url}`)
    })
    console.groupEnd()
  }, [locIdx, currentLoc, camCount])

  // Pause auto-rotation when tab is hidden
  useEffect(() => {
    const handler = () => { isPaused.current = document.visibilityState !== 'visible' }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // Auto-rotation every 10 seconds — also paused while lightbox is open
  useEffect(() => {
    const timer = setInterval(() => {
      if (isHovered.current || isPaused.current || isLightboxOpen.current) return
      setCamIdx(prev => (prev + 1) % locations[locIdx].cameras.length)
      setTs(Date.now())
      setImgError(false)
    }, 10_000)
    return () => clearInterval(timer)
  }, [locIdx, locations])

  // Weather fetch with 30-minute client-side cache
  useEffect(() => {
    const loc = locations[locIdx]
    const key = `${loc.lat},${loc.lng}`
    const TTL = 30 * 60 * 1000
    const cached = weatherCache.current[key]
    if (cached && Date.now() - cached.fetchedAt < TTL) {
      setWeather(cached.data)
      return
    }
    let cancelled = false
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,weather_code&timezone=auto`,
    )
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.current) return
        const wd: WeatherData = {
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        }
        weatherCache.current[key] = { data: wd, fetchedAt: Date.now() }
        setWeather(wd)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [locIdx, locations])

  const handleLocChange = (idx: number) => {
    setLocIdx(idx)
    setCamIdx(0)
    setTs(Date.now())
    setImgError(false)
    setWeather(null)
  }

  const handlePrev = () => {
    setCamIdx(prev => (prev - 1 + camCount) % camCount)
    setTs(Date.now())
    setImgError(false)
  }

  const handleNext = () => {
    setCamIdx(prev => (prev + 1) % camCount)
    setTs(Date.now())
    setImgError(false)
  }

  const handleJumpTo = (idx: number) => {
    setCamIdx(idx)
    setTs(Date.now())
    setImgError(false)
  }

  const handleOpenLightbox = () => {
    setLightboxOpen(true)
    isLightboxOpen.current = true
  }

  const handleCloseLightbox = () => {
    setLightboxOpen(false)
    isLightboxOpen.current = false
    imgButtonRef.current?.focus()
  }

  const bustedUrl = ts === 0 ? currentCam.url : addCacheBuster(currentCam.url, ts)
  const isKompakt = variant === 'kompakt'
  const wi = weather ? weatherInfo(weather.code) : null

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-fjord">{title}</h2>

      {/* Main camera view */}
      <div
        className="relative mt-4 aspect-video overflow-hidden rounded-xl bg-fjord"
        onMouseEnter={() => { isHovered.current = true }}
        onMouseLeave={() => { isHovered.current = false }}
      >
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-fog/50">
            Kameraet er ikke tilgjengelig akkurat nå
          </div>
        ) : (
          /* Clickable image button — covers the full frame */
          <button
            ref={imgButtonRef}
            onClick={handleOpenLightbox}
            className="absolute inset-0 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50"
            aria-label="Vis kameraet i full størrelse"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={bustedUrl}
              src={bustedUrl}
              alt={currentCam.title}
              loading="lazy"
              onLoad={() => console.log(`[Kamera OK] "${currentCam.title}" → ${currentCam.url}`)}
              onError={() => {
                console.warn(`[Kamera FEIL] "${currentCam.title}" → ${currentCam.url}`)
                setImgError(true)
              }}
              className="h-full w-full object-cover"
            />
          </button>
        )}

        {/* Position indicator — upper right pill, above the button */}
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-black/40 px-2 py-0.5 text-xs tabular-nums text-white backdrop-blur-sm">
          {camIdx + 1}/{camCount}
        </div>

        {/* Prev / Next arrows — above the button */}
        {camCount > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1 text-xl leading-none text-white backdrop-blur-sm hover:bg-black/60"
              aria-label="Forrige kamera"
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1 text-xl leading-none text-white backdrop-blur-sm hover:bg-black/60"
              aria-label="Neste kamera"
            >
              ›
            </button>
          </>
        )}

        {/* Bottom gradient overlay with camera title + source */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
          <p className="truncate font-serif text-lg font-bold leading-tight text-white">
            {currentCam.title}
          </p>
          <p className="text-xs text-white/70">{currentCam.source}</p>
        </div>
      </div>

      {/* Location pills — below image */}
      <div className="mt-3 flex flex-wrap gap-2">
        {locations.map((loc, i) => (
          <button
            key={i}
            onClick={() => handleLocChange(i)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              i === locIdx
                ? 'bg-sun text-ink'
                : 'bg-fog text-muted hover:text-ink'
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Weather card */}
      {!isKompakt && wi && weather && (
        <div className="mt-3 flex items-center gap-4 rounded-xl bg-paper px-4 py-3 ring-1 ring-ink/5">
          <span className="text-4xl leading-none" aria-hidden>{wi.emoji}</span>
          <div className="min-w-0">
            <p className="text-xs text-muted">{currentLoc.name}</p>
            <p className="text-2xl font-bold tabular-nums text-ink">{weather.temp}°C</p>
            <p className="text-sm text-muted">{wi.label}</p>
          </div>
        </div>
      )}

      {/* Camera list */}
      {!isKompakt && (
        <div className="mt-4 divide-y divide-ink/5">
          {currentLoc.cameras.map((cam, i) => (
            <button
              key={i}
              onClick={() => handleJumpTo(i)}
              className={`flex w-full items-center gap-2.5 py-2 text-left text-sm transition-colors hover:text-sea ${
                i === camIdx ? 'font-semibold text-sea' : 'text-ink'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  i === camIdx ? 'bg-sea' : 'bg-ink/20'
                }`}
              />
              <span className="truncate">{cam.title}</span>
              <span className="ml-auto shrink-0 text-xs text-muted">({cam.source})</span>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          cam={currentCam}
          src={bustedUrl}
          camIdx={camIdx}
          camCount={camCount}
          onClose={handleCloseLightbox}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </>
  )
}
