'use client'

/**
 * Carte + correction manuelle du point GPS des stations du pro sur un super
 * event -- demande Romain : « il faut avoir un onglet carte afin de situer et
 * de pouvoir modifier le point gps ».
 *
 * Deux facons de corriger, complementaires plutot que redondantes :
 *  - glisser le marqueur sur la carte (ordinateur, la carte est masquee en
 *    dessous de 820px -- voir le CSS .pro-map-wrap de la page appelante) ;
 *  - saisir lat/lng a la main (marche partout, y compris sur le telephone du
 *    pro sur le terrain, ou l ecran est trop etroit pour une carte utilisable).
 *
 * Ecrit directement dans `events.lat/lng` -- memes colonnes, meme table que la
 * carte SA (app/dashboard/nds-carte). Seules les stations du pro sont visibles
 * ici (le `lieux` recu est deja filtre par la page appelante), donc aucune
 * ecriture possible en dehors de son propre perimetre.
 */
import { useState } from 'react'
import SuperEventMap, { type Lieu } from '@/app/se/_components/SuperEventMap'
import { supabase } from '@/lib/supabase'
import { CARD, CHAMP, LABEL, MUTED, ACC } from '@/lib/proui'
import { Ico } from '@/lib/proicons'

export default function StationsCarteGPS({ lieux }: { lieux: Lieu[] }) {
  const [points, setPoints] = useState(lieux)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [brouillon, setBrouillon] = useState<Record<string, { lat: string; lng: string }>>({})

  async function enregistrer(id: string, lat: number, lng: number) {
    setEnCours(id)
    const { error } = await supabase.from('events').update({ lat, lng }).eq('id', id)
    setEnCours(null)
    const nom = points.find(p => p.id === id)?.nom ?? ''
    if (error) { setMessage(`${nom} · échec de l'enregistrement`); return }
    setPoints(pts => pts.map(p => p.id === id ? { ...p, lat, lng } : p))
    setMessage(`${nom} · position enregistrée`)
    setTimeout(() => setMessage(null), 2600)
  }

  function valider(id: string) {
    const d = brouillon[id]
    if (!d) return
    const lat = parseFloat(d.lat.replace(',', '.'))
    const lng = parseFloat(d.lng.replace(',', '.'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) { setMessage('Coordonnées invalides.'); return }
    enregistrer(id, lat, lng)
  }

  return (
    <div>
      <style>{`@media (max-width:820px){.pro-map-wrap{display:none !important}}`}</style>
      <div className="pro-map-wrap" style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#8a7e93' }}>Mes stations sur la carte</div>
          <div style={{ fontSize: 13, ...MUTED, marginBottom: 10 }}>Glissez un point pour corriger sa position — enregistré immédiatement.</div>
        </div>
        <div style={{ height: 360 }}>
          <SuperEventMap lieux={points} mode="vitrine" height="100%" editable onMove={enregistrer} />
        </div>
      </div>

      {message && (
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: message.includes('échec') || message.includes('invalides') ? '#c0392b' : '#2f7d4f' }}>
          {message}
        </div>
      )}

      <div style={CARD}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#8a7e93', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ico k="pin" size={13} /> Corriger un point manuellement
        </div>
        {points.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Aucune station.</div>}
        {points.map(p => {
          const d = brouillon[p.id] ?? { lat: p.lat != null ? String(p.lat) : '', lng: p.lng != null ? String(p.lng) : '' }
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: 8, alignItems: 'end', marginBottom: 10 }}>
              <div>
                <div style={LABEL}>Station</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, padding: '10px 0' }}>{p.nom}</div>
              </div>
              <div>
                <div style={LABEL}>Latitude</div>
                <input style={CHAMP} inputMode="decimal" value={d.lat}
                  onChange={e => setBrouillon(b => ({ ...b, [p.id]: { lat: e.target.value, lng: d.lng } }))}
                  placeholder="43.7229" />
              </div>
              <div>
                <div style={LABEL}>Longitude</div>
                <input style={CHAMP} inputMode="decimal" value={d.lng}
                  onChange={e => setBrouillon(b => ({ ...b, [p.id]: { lat: d.lat, lng: e.target.value } }))}
                  placeholder="7.1116" />
              </div>
              <button
                onClick={() => valider(p.id)}
                disabled={enCours === p.id}
                style={{ border: 'none', borderRadius: 12, padding: '11px 16px', fontWeight: 800, fontSize: 13, color: '#fff', cursor: enCours === p.id ? 'default' : 'pointer', background: ACC }}
              >
                {enCours === p.id ? 'Envoi…' : 'Enregistrer'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
