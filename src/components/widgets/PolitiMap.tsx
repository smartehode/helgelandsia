'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { kategoriData } from '@/lib/politi-kategorier'

export interface MapMarker {
  lat: number
  lng: number
  category: string
  label: string
  text: string
  time: string
}

function makeDivIconHtml(category: string): string {
  const { hex, svgPaths } = kategoriData(category)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"` +
    ` fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
    svgPaths +
    `</svg>`
  return (
    `<div style="width:30px;height:30px;border-radius:50%;background:${hex};` +
    `border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);` +
    `display:flex;align-items:center;justify-content:center;">` +
    svg +
    `</div>`
  )
}

export function PolitiMap({ markers }: { markers: MapMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let mounted = true
    ;(async () => {
      const L = (await import('leaflet')).default
      if (!mounted || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [66.05, 13.2],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      markers.forEach(m => {
        const icon = L.divIcon({
          html: makeDivIconHtml(m.category),
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -18],
          className: '',
        })
        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font:13px/1.4 sans-serif;max-width:200px">` +
            `<strong style="color:${kategoriData(m.category).hex}">${m.category}</strong><br>` +
            `<span style="color:#666;font-size:11px">${m.label} · ${m.time}</span><br>` +
            `<span>${m.text}</span></div>`,
            { maxWidth: 220 },
          )
      })
    })()

    return () => {
      mounted = false
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="border-b border-ink/5"
      style={{ height: '280px', width: '100%' }}
    />
  )
}
