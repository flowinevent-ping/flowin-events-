'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import { CENTRE_VENCE, STYLE_CARTE, chargerMapLibre, itineraires } from '@/components/carte/maplibre'
import { separerReperes } from '@/lib/seReperes'
import { creerRepere, marquerChoisi } from '@/components/carte/repere'

export type Lieu = {
  id: string
  nom: string
  lat: number | null
  lng: number | null
  module?: string | null
  couleur?: string | null
  joue?: boolean
  gain_immediat?: string | null
  gain_ticket?: boolean | null
  adresse?: string | null
  description?: string | null
  categorie?: string | null
  tel?: string | null
  site_web?: string | null
  photo_url?: string | null
  horaires?: string | null
  /** Logo du commerce (partenaires.image_url) pour les repères en mode `reperes`. */
  logo?: string | null
}

interface Props {
  lieux: Lieu[]
  mode?: 'vitrine' | 'jeu'
  height?: number | string
  showPosition?: boolean
  onSelect?: (id: string) => void
  /** Marqueurs deplacables a la souris/au doigt -- combine a `onMove`, ecrit la
      nouvelle position au lacher plutot que de se contenter de l afficher. */
  editable?: boolean
  onMove?: (id: string, lat: number, lng: number) => void
  /** Repères = logo du commerce dans un rond à anneau orange (page publique Super Event). */
  reperes?: boolean
  /** Commerce sélectionné : sa pastille grossit et la carte s'y recentre (flyTo). */
  selId?: string | null
  /** Hauteur (px) de la feuille du bas : le commerce est centré dans la partie visible. */
  decalageBas?: number
  /** Position du bouton « Autour de moi » (sinon en bas à gauche). */
  geoHaut?: number
  /** Rempli par la carte : renvoie [lat, lng] du centre affiché (pour « Placer » un point sans position). */
  centreRef?: { current: (() => [number, number] | null) | null }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]))
}

export default function SuperEventMap({ lieux, mode = 'vitrine', height = 340, showPosition = false, onSelect, editable = false, onMove, reperes = false, selId = null, decalageBas = 0, geoHaut, centreRef }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  const onMoveRef = useRef(onMove)
  useEffect(() => { onMoveRef.current = onMove }, [onMove])

  const [geoBouton, setGeoBouton] = useState(false)
  const moiRef = useRef<any>(null)
  const ringsRef = useRef<Record<string, HTMLElement>>({})
  const posRef = useRef<Record<string, [number, number]>>({})
  const decRef = useRef(decalageBas)
  useEffect(() => { decRef.current = decalageBas }, [decalageBas])

  function localiser(recentrer: boolean) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current, ml = window.maplibregl
        if (!map || !ml) return
        const ll: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        if (!moiRef.current) {
          const el = document.createElement('div')
          el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#378ADD;border:3px solid #fff;box-shadow:0 0 0 5px rgba(55,138,221,.3);box-sizing:border-box'
          if (reperes) {
            el.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 8px rgba(37,99,235,.2);box-sizing:border-box;position:relative'
            const t = document.createElement('span')
            t.textContent = 'Vous êtes ici'
            t.style.cssText = 'position:absolute;top:24px;left:50%;transform:translateX(-50%);font:700 11px sans-serif;background:#2563EB;color:#fff;border-radius:8px;padding:2px 7px;white-space:nowrap'
            el.appendChild(t)
          }
          moiRef.current = new ml.Marker({ element: el }).setLngLat(ll).addTo(map)
        } else moiRef.current.setLngLat(ll)
        if (recentrer) map.easeTo({ center: ll, zoom: Math.max(map.getZoom(), 15.5), duration: 500 })
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  /* Éditable + repères : la clé ignore les positions, sinon chaque glisser-déposer reconstruirait la carte et la recadrerait. */
  useEffect(() => {
    let cancelled = false
    const pts = lieux.filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number') as Array<Lieu & { lat: number; lng: number }>

    chargerMapLibre().then((ml) => {
      if (cancelled || !ref.current || !ml) return
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; moiRef.current = null }

      const center: [number, number] = pts.length
        ? [pts.reduce((s, p) => s + p.lng, 0) / pts.length, pts.reduce((s, p) => s + p.lat, 0) / pts.length]
        : CENTRE_VENCE
      let map: any
      try {
        map = new ml.Map({ container: ref.current, style: STYLE_CARTE, center, zoom: 15, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, scrollZoom: false })
      } catch { return }
      map.touchZoomRotate.disableRotation()
      if (!reperes) map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
      mapRef.current = map
      if (centreRef) centreRef.current = () => { const c = map.getCenter(); return [c.lat, c.lng] }

      ringsRef.current = {}
      posRef.current = {}
      if (reperes) {
        /* Mode éditable (tableaux de bord) : chaque point reste individuel et déplaçable, jamais regroupé. */
        const sep = editable ? { commerces: pts, groupes: [] as Array<typeof pts> } : separerReperes(pts)
        sep.commerces.forEach((p) => {
          const { el, ring } = creerRepere({ id: p.id, nom: p.nom, logo: p.logo, joue: !!p.joue })
          ringsRef.current[p.id] = ring
          posRef.current[p.id] = [p.lng, p.lat]
          const m = new ml.Marker({ element: el, draggable: editable }).setLngLat([p.lng, p.lat]).addTo(map)
          let glisse = false
          if (editable) {
            m.on('dragstart', () => { glisse = true })
            m.on('dragend', () => {
              const { lat, lng } = m.getLngLat()
              posRef.current[p.id] = [lng, lat]
              if (onMoveRef.current) onMoveRef.current(p.id, lat, lng)
              window.setTimeout(() => { glisse = false }, 0)
            })
          }
          el.addEventListener('click', (e) => { e.stopPropagation(); if (!glisse && onSelectRef.current) onSelectRef.current(p.id) })
        })
        sep.groupes.forEach((g, i) => {
          const lng = g.reduce((s, x) => s + x.lng, 0) / g.length, lat = g.reduce((s, x) => s + x.lat, 0) / g.length
          const el = document.createElement('button')
          el.type = 'button'
          el.setAttribute('data-groupe-festival', String(g.length))
          el.setAttribute('aria-label', `${g.length} points du festival`)
          el.textContent = String(g.length)
          el.style.cssText = 'width:44px;height:44px;border-radius:50%;background:#B5471E;color:#fff;font:800 15px sans-serif;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;padding:0'
          new ml.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)
          el.addEventListener('click', (e) => { e.stopPropagation(); map.easeTo({ center: [lng, lat], zoom: Math.min(map.getZoom() + 2, 19), duration: 500 }) })
          void i
        })
      }
      if (!reperes) pts.forEach((p) => {
        const joue = mode === 'jeu' && !!p.joue
        const bg = joue ? '#1D9E75' : (mode === 'jeu' ? '#ffffff' : (p.couleur || '#3B5CC4'))
        const fg = joue ? '#ffffff' : (mode === 'jeu' ? '#BA7517' : '#ffffff')
        const border = mode === 'jeu' && !joue ? '2px solid #BA7517' : '2px solid #ffffff'
        const el = document.createElement('div')
        el.style.cssText = `width:28px;height:28px;border-radius:50%;background:${bg};border:${border};box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:${fg};font-size:14px;cursor:pointer;box-sizing:border-box`
        el.innerHTML = joue ? '&#10003;' : '&#9679;'
        el.title = p.nom
        const m = new ml.Marker({ element: el, draggable: editable }).setLngLat([p.lng, p.lat]).addTo(map)
        if (editable) {
          m.on('dragend', () => {
            const { lat, lng } = m.getLngLat()
            if (onMoveRef.current) onMoveRef.current(p.id, lat, lng)
          })
        } else if (onSelectRef.current) {
          el.addEventListener('click', (e) => { e.stopPropagation(); if (onSelectRef.current) onSelectRef.current(p.id) })
        } else {
          const liens = itineraires(p.lat, p.lng).slice(0, 2).map((i) =>
            `<a href="${i.url}"${i.cle === 'plans' ? '' : ' target="_blank"'} rel="noopener" style="display:inline-block;margin:6px 8px 0 0;padding:6px 10px;border-radius:8px;border:1.5px solid #C9D3DF;color:#1B3A5C;font-weight:700;text-decoration:none;">${i.libelle}</a>`).join('')
          m.setPopup(new ml.Popup({ offset: 16, closeButton: false }).setHTML(`<strong>${esc(p.nom)}</strong><br>${liens}`))
        }
      })

      if (pts.length > 1) {
        const b = new ml.LngLatBounds()
        pts.forEach((p) => b.extend([p.lng, p.lat]))
        map.fitBounds(b, reperes && !editable ? { padding: { top: 120, bottom: 260, left: 40, right: 40 }, maxZoom: 16, duration: 0 } : { padding: 50, maxZoom: 16, duration: 0 })
      }

      /* Géolocalisation : jamais de demande au chargement. Si l'autorisation est déjà
         donnée, on affiche la position ; sinon un bouton « Autour de moi » la demande. */
      if (showPosition && typeof navigator !== 'undefined' && navigator.geolocation) {
        const perm = (navigator as any).permissions
        if (perm && perm.query) {
          perm.query({ name: 'geolocation' }).then((r: any) => {
            if (cancelled) return
            if (r.state === 'granted') localiser(false)
            setGeoBouton(true)
          }).catch(() => setGeoBouton(true))
        } else setGeoBouton(true)
      }
    })

    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; moiRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable && reperes ? JSON.stringify(lieux.map((l) => [l.id, l.nom, l.logo, l.joue, typeof l.lat === 'number' && typeof l.lng === 'number'])) : JSON.stringify(lieux), mode, showPosition, editable, reperes])

  /* Sélection : la pastille grossit (anneau bleu) et la carte s'y recentre. */
  useEffect(() => {
    Object.keys(ringsRef.current).forEach((id) => {
      const r = ringsRef.current[id]
      const sel = id === selId
      marquerChoisi(r, sel)
    })
    const map = mapRef.current
    const c = selId ? posRef.current[selId] : null
    if (map && c) map.flyTo({ center: c, zoom: Math.max(map.getZoom(), 16.5), offset: [0, -decRef.current / 2], duration: 700, essential: true })
  }, [selId])

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 12, overflow: 'hidden', zIndex: 0, background: '#E9EEF3' }}>
      <div ref={ref} style={{ position: 'absolute', inset: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }} />
      {geoBouton && (
        <button type="button" onClick={() => localiser(true)} aria-label="Autour de moi"
          style={{ position: 'absolute', ...(geoHaut !== undefined ? { right: 12, top: geoHaut } : { left: 10, bottom: 34 }), zIndex: 2, minHeight: 44, padding: '9px 13px', borderRadius: 99, border: 0, background: '#1B3A5C', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 3px 10px rgba(27,58,92,.35)' }}>
          Autour de moi
        </button>
      )}
    </div>
  )
}
