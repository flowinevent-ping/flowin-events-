'use client'

/**
 * Carte NDS — deux couches SEPAREES : stations du festival et commerces partenaires.
 *
 * Les deux couches ne se melangent jamais. Une station n est pas un commerce : elles
 * n ont ni le meme role, ni le meme public, ni les memes horaires. Les afficher
 * ensemble sans distinction produirait une carte illisible et des comptages faux.
 *
 * Un point sans coordonnees n est PAS affiche au centre par defaut : il est listee
 * comme « à placer ». Poser un marqueur a une position inventee revient a fabriquer
 * de la donnee.
 *
 * Le glisser-deposer enregistre immediatement la position.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { supabase } from '@/lib/supabase'

/* Vence, centre de la carte par defaut */
const CENTRE: [number, number] = [43.7229, 7.1116]

interface Point {
  id: string
  nom: string
  latitude: number | null
  longitude: number | null
  ville?: string | null
}

type Couche = 'stations' | 'partenaires'

async function fetchStations(): Promise<Point[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id,nom,lat,lng,lieu')
    .not('super_event_id', 'is', null)
    .order('nom')
  if (error) { console.error('[carte stations]', error.message); return [] }
  return ((data ?? []) as { id: string; nom: string | null; lat: number | null; lng: number | null; lieu: string | null }[])
    .map(e => ({ id: e.id, nom: e.nom ?? e.id, latitude: e.lat, longitude: e.lng, ville: e.lieu }))
}

async function fetchCommerces(): Promise<Point[]> {
  const { data, error } = await supabase
    .from('partenaires')
    .select('id,nom,latitude,longitude,ville')
    .order('nom')
  if (error) { console.error('[carte partenaires]', error.message); return [] }
  return ((data ?? []) as { id: string; nom: string | null; latitude: number | null; longitude: number | null; ville: string | null }[])
    .map(p => ({ id: p.id, nom: p.nom ?? p.id, latitude: p.latitude, longitude: p.longitude, ville: p.ville }))
}

async function enregistrerPosition(couche: Couche, id: string, lat: number, lng: number) {
  /* Les deux tables ne nomment PAS leurs colonnes de la meme facon :
     events porte lat/lng, partenaires porte latitude/longitude. */
  const table = couche === 'stations' ? 'events' : 'partenaires'
  const champs = couche === 'stations' ? { lat, lng } : { latitude: lat, longitude: lng }
  const { error } = await supabase.from(table).update(champs).eq('id', id)
  if (error) console.error('[carte enregistrement]', error.message)
  return !error
}

export default function Page() {
  const [couche, setCouche] = useState<Couche>('stations')
  const [stations, setStations] = useState<Point[]>([])
  const [commerces, setCommerces] = useState<Point[]>([])
  const [charge, setCharge] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const conteneur = useRef<HTMLDivElement | null>(null)
  /* Types Leaflet volontairement larges : le module est charge dynamiquement cote client */
  const carte = useRef<any>(null)
  const marqueurs = useRef<any[]>([])

  const recharger = useCallback(() => {
    setCharge(true)
    Promise.all([fetchStations(), fetchCommerces()])
      .then(([s, c]) => { setStations(s); setCommerces(c) })
      .finally(() => setCharge(false))
  }, [])

  useEffect(recharger, [recharger])

  const points = couche === 'stations' ? stations : commerces
  const places = useMemo(() => points.filter(p => p.latitude != null && p.longitude != null), [points])
  const aPlacer = useMemo(() => points.filter(p => p.latitude == null || p.longitude == null), [points])

  /* Initialisation de la carte, une seule fois */
  useEffect(() => {
    let annule = false
    ;(async () => {
      if (!conteneur.current || carte.current) return
      const L = (await import('leaflet')).default
      if (annule || !conteneur.current) return
      carte.current = L.map(conteneur.current).setView(CENTRE, 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(carte.current)
    })()
    return () => { annule = true }
  }, [])

  /* Redessine les marqueurs a chaque changement de couche ou de donnees */
  useEffect(() => {
    let annule = false
    ;(async () => {
      if (!carte.current) return
      const L = (await import('leaflet')).default
      if (annule || !carte.current) return

      marqueurs.current.forEach(m => carte.current.removeLayer(m))
      marqueurs.current = []

      const couleur = couche === 'stations' ? '#5B79E0' : '#F5B544'

      places.forEach(p => {
        const icone = L.divIcon({
          className: '',
          html: `<div style="width:15px;height:15px;border-radius:50%;background:${couleur};border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
          iconSize: [15, 15],
          iconAnchor: [7.5, 7.5],
        })
        const m = L.marker([p.latitude as number, p.longitude as number], { icon: icone, draggable: true })
          .addTo(carte.current)
          .bindTooltip(p.nom, { direction: 'top', offset: [0, -8] })

        m.on('dragend', async () => {
          const { lat, lng } = m.getLatLng()
          const ok = await enregistrerPosition(couche, p.id, lat, lng)
          setMessage(ok ? `${p.nom} · position enregistrée` : `${p.nom} · échec de l'enregistrement`)
          setTimeout(() => setMessage(null), 2600)
          if (ok) {
            const maj = (l: Point[]) => l.map(x => (x.id === p.id ? { ...x, latitude: lat, longitude: lng } : x))
            if (couche === 'stations') setStations(maj); else setCommerces(maj)
          }
        })
        marqueurs.current.push(m)
      })

      if (places.length) {
        const bornes = L.latLngBounds(places.map(p => [p.latitude as number, p.longitude as number] as [number, number]))
        carte.current.fitBounds(bornes, { padding: [40, 40], maxZoom: 16 })
      }
    })()
    return () => { annule = true }
  }, [places, couche])

  return (
    <div className="sa-page">
      <PageHeader
        title="Carte NDS"
        subtitle="Deux couches séparées — stations du festival et commerces partenaires"
        actions={<button className="sa-btn" onClick={recharger}>Recharger</button>}
      />

      <div style={{ display: 'inline-flex', gap: 4, background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 4, marginBottom: 12 }}>
        {([['stations', `📍 Stations (${stations.length})`], ['partenaires', `🏪 Partenaires (${commerces.length})`]] as const).map(([k, l]) => (
          <button
            key={k}
            className={`sa-btn sm${couche === k ? ' primary' : ''}`}
            onClick={() => setCouche(k)}
            style={{ borderRadius: 7 }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        <b>{places.length} placé{places.length > 1 ? 's' : ''}</b> sur {points.length} ·{' '}
        <b>{aPlacer.length} à placer</b>. Glisse un point pour enregistrer sa position.
        Un point sans coordonnées n&apos;est pas affiché au centre par défaut — il resterait faux.
      </div>

      {message && (
        <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 8, color: '#2f7d4f' }}>{message}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 14, alignItems: 'start' }}>
        <div
          ref={conteneur}
          style={{ height: 540, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--sa-border)', position: 'relative', zIndex: 0 }}
        />

        <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 14, maxHeight: 540, overflow: 'auto' }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 9 }}>
            {couche === 'stations' ? 'Stations' : 'Partenaires'}
          </div>

          {charge && <div className="sa-muted" style={{ fontSize: 11.5 }}>Chargement…</div>}

          {!charge && !points.length && (
            <EmptyState icon="🗺️" title="Aucun point" desc="Aucun élément à afficher sur cette couche." />
          )}

          {!charge && points.map(p => {
            const place = p.latitude != null && p.longitude != null
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--sa-border)',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 9, height: 9, borderRadius: '50%', flex: 'none',
                    background: place ? (couche === 'stations' ? '#5B79E0' : '#F5B544') : 'var(--sa-border)',
                  }}
                />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{p.nom}</span>
                {!place && (
                  <span className="sa-muted" style={{ fontSize: 10, fontStyle: 'italic' }}>à placer</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
