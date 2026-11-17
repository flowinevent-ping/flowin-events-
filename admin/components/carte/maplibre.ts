/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Carte Flowin (audit 17/11/2026) : MapLibre GL JS + tuiles vectorielles OpenFreeMap.
 * Gratuit, sans clé, usage commercial autorisé (openfreemap.org), attribution
 * OpenFreeMap / OpenMapTiles / OpenStreetMap affichée par le style.
 * Chargement paresseux depuis cdnjs (même principe que l'ancien Leaflet) : rien n'est
 * téléchargé tant qu'aucune carte n'est affichée.
 */

export const MAPLIBRE_VERSION = '4.7.1'
export const STYLE_CARTE = 'https://tiles.openfreemap.org/styles/liberty'
export const CENTRE_VENCE: [number, number] = [7.1116, 43.7228] // [lng, lat]

declare global {
  interface Window {
    maplibregl?: any
    __maplibreLoading?: Promise<any>
  }
}

export function chargerMapLibre(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.maplibregl) return Promise.resolve(window.maplibregl)
  if (window.__maplibreLoading) return window.__maplibreLoading
  window.__maplibreLoading = new Promise<any>((resolve) => {
    const base = `https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/${MAPLIBRE_VERSION}/`
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = base + 'maplibre-gl.min.css'
    document.head.appendChild(css)
    const js = document.createElement('script')
    js.src = base + 'maplibre-gl.min.js'
    js.async = true
    js.onload = () => resolve(window.maplibregl ?? null)
    js.onerror = () => { window.__maplibreLoading = undefined; resolve(null) }
    document.head.appendChild(js)
  })
  return window.__maplibreLoading
}

/** Distance en mètres (haversine). */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function libelleDistance(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`
}

/** Minutes à pied (5 km/h). */
export function minutesAPied(m: number): number {
  return Math.max(1, Math.round(m / 83))
}

export function estIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1)
}

export interface Itineraire { cle: 'waze' | 'google' | 'plans'; libelle: string; url: string }

/** Itinéraire en un geste : Waze + l'appli de cartes du téléphone (Plans sur iOS, Google Maps ailleurs). */
export function itineraires(lat: number, lng: number): Itineraire[] {
  const ll = `${lat.toFixed(6)},${lng.toFixed(6)}`
  const waze: Itineraire = { cle: 'waze', libelle: 'Waze', url: `https://waze.com/ul?ll=${ll}&navigate=yes` }
  const google: Itineraire = { cle: 'google', libelle: 'Google Maps', url: `https://www.google.com/maps/dir/?api=1&destination=${ll}` }
  if (estIOS()) return [{ cle: 'plans', libelle: 'Plans', url: `maps://?daddr=${ll}` }, waze, google]
  return [google, waze]
}
