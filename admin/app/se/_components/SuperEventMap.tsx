'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react'

export type Lieu = {
  id: string
  nom: string
  lat: number | null
  lng: number | null
  module?: string | null
  couleur?: string | null
  joue?: boolean
}

interface Props {
  lieux: Lieu[]
  mode?: 'vitrine' | 'jeu'
  height?: number
  showPosition?: boolean
}

declare global {
  interface Window {
    L?: any
    __leafletLoading?: Promise<void>
  }
}

function loadLeaflet(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.L) return Promise.resolve()
  if (window.__leafletLoading) return window.__leafletLoading
  window.__leafletLoading = new Promise<void>((resolve) => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(css)
    const js = document.createElement('script')
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    js.onload = () => resolve()
    document.body.appendChild(js)
  })
  return window.__leafletLoading
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]))
}

export default function SuperEventMap({ lieux, mode = 'vitrine', height = 340, showPosition = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    const pts = lieux.filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number') as Array<Lieu & { lat: number; lng: number }>

    loadLeaflet().then(() => {
      if (cancelled || !ref.current) return
      const L = window.L
      if (!L) return
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

      const cLat = pts.length ? pts.reduce((s, p) => s + p.lat, 0) / pts.length : 43.7228
      const cLng = pts.length ? pts.reduce((s, p) => s + p.lng, 0) / pts.length : 7.1116

      const map = L.map(ref.current, { scrollWheelZoom: false }).setView([cLat, cLng], 15)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      pts.forEach((p) => {
        const joue = mode === 'jeu' && !!p.joue
        const bg = joue ? '#1D9E75' : (mode === 'jeu' ? '#ffffff' : (p.couleur || '#3B5CC4'))
        const fg = joue ? '#ffffff' : (mode === 'jeu' ? '#BA7517' : '#ffffff')
        const border = mode === 'jeu' && !joue ? '2px solid #BA7517' : '2px solid #ffffff'
        const glyph = joue ? '&#10003;' : '&#9679;'
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${bg};border:${border};box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:${fg};font-size:14px;">${glyph}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        const m = L.marker([p.lat, p.lng], { icon }).addTo(map)
        const playLink = p.module
          ? `<br><a href="/parcours/${esc(p.module)}?ev=${esc(p.id)}" style="display:inline-block;margin-top:6px;color:#3B5CC4;font-weight:600;text-decoration:none;">Jouer &rarr;</a>`
          : ''
        m.bindPopup(`<strong>${esc(p.nom)}</strong>${playLink}`)
      })

      if (pts.length > 1) {
        map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng])), { padding: [30, 30] })
      }

      if (showPosition && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled || !mapRef.current) return
            const dot = L.divIcon({
              className: '',
              html: '<div style="width:16px;height:16px;border-radius:50%;background:#378ADD;border:3px solid #fff;box-shadow:0 0 0 4px rgba(55,138,221,.3);"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })
            L.marker([pos.coords.latitude, pos.coords.longitude], { icon: dot }).addTo(mapRef.current)
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        )
      }
    })

    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [JSON.stringify(lieux), mode, showPosition])

  return <div ref={ref} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', zIndex: 0 }} />
}
