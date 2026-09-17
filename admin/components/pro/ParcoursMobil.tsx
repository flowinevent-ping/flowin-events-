'use client'

import { libelleModule } from '@/lib/operations'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Parcours mobil (30/07/2026, v2 — branchement du vrai contenu).
 * Affiche le VRAI parcours joueur en direct dans un cadre telephone (iframe), pas une maquette :
 *  - onglet Event : /parcours/<module>?ev=<id> (le parcours reel de l'animation choisie)
 *  - onglet Super event : /se/<seId> (la page publique du super event : carte des stations, lots)
 * Un selecteur permet de choisir quel evenement previsualiser. Reutilise cote profil partenaire
 * (/pro/parcours) et cote dashboard SA (/dashboard/parcours) via les memes props.
 */

const ACC = '#2563EB'
type Ev = { id: string; module: string; nom: string; super_event_id?: string | null }

export function Phone({ src, empty }: { src?: string; empty?: string }) {
  const W = 252, H = 505, SCALE = 0.64
  const IW = Math.round(W / SCALE)
  const IH = Math.round(H / SCALE)
  return (
    <div style={{ width: W + 20, flexShrink: 0 }}>
      <div style={{ borderRadius: 36, padding: 10, background: '#0F172A', boxShadow: '0 24px 60px rgba(15,23,42,.28)' }}>
        <div style={{ borderRadius: 28, overflow: 'hidden', background: '#fff', width: W, height: H, position: 'relative' }}>
          {src ? (
            <iframe
              src={src}
              title="Aperçu du parcours"
              loading="lazy"
              style={{ width: IW, height: IH, border: 0, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13.5, lineHeight: 1.5 }}>{empty}</div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * APERCU DU PARCOURS — regle unique (famille I) :
 *  - l apercu montre TOUJOURS le vrai parcours (iframe, preview=1), jamais une maquette ;
 *  - on choisit d abord l event, groupe par operation (rien a plat) ;
 *  - la vue « super event » est TOUJOURS proposee. Le parcours super event
 *    de NDS 2026 a ete decline en marque blanche pour tous (Romain, 16/09) :
 *      . station d un super event -> son propre ecran carte ;
 *      . event autonome -> le gabarit marque blanche (station du master), pour
 *        montrer ce que donnerait l event dans un super event.
 *    Le super event n est jamais devine par la page appelante (famille D).
 */
export default function ParcoursMobil({ events = [], showTitle = true }: { events?: Ev[]; showTitle?: boolean }) {
  /* Noms des super events, pour titrer les groupes du selecteur. */
  const [supers, setSupers] = useState<Record<string, string>>({})
  useEffect(() => {
    supabase.from('super_events').select('id,nom').then(({ data }) => {
      const m: Record<string, string> = {}
      ;((data ?? []) as { id: string; nom: string }[]).forEach(x => { m[x.id] = x.nom })
      setSupers(m)
    })
  }, [])
  const [tabDemande, setTab] = useState<'event' | 'super'>('event')
  const [evId, setEvId] = useState(events[0]?.id ?? '')
  const ev = events.find(e => e.id === evId) ?? events[0]
  const multistation = !!ev?.super_event_id
  const tab = tabDemande
  /* Une station du gabarit marque blanche, pour la vue super event d un event autonome. */
  const [stationGabarit, setStationGabarit] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('events').select('id').eq('super_event_id', 'se-master-superevent').eq('module', 'nds2026')
      .order('id').limit(1)
      .then(({ data }) => { const d = (data ?? []) as { id: string }[]; setStationGabarit(d[0]?.id ?? null) })
  }, [])
  const groupes = events.reduce<{ cle: string; nom: string; evs: Ev[] }[]>((acc, e) => {
    const cle = e.super_event_id ?? ''
    let g = acc.find(x => x.cle === cle)
    if (!g) { g = { cle, nom: cle ? (supers[cle] ?? cle) : 'Events autonomes', evs: [] }; acc.push(g) }
    g.evs.push(e)
    return acc
  }, [])

  const eventUrl = ev ? `/parcours/${ev.module}?ev=${encodeURIComponent(ev.id)}&preview=1` : ''
  const superUrl = ev && multistation
    ? `/parcours/${ev.module}?ev=${encodeURIComponent(ev.id)}&preview=1&screen=carte`
    : stationGabarit ? `/parcours/nds2026?ev=${encodeURIComponent(stationGabarit)}&preview=1&screen=carte` : ''
  const url = tab === 'event' ? eventUrl : superUrl
  const phoneUrl = url ? `${url}&bar=0` : ''
  const empty = 'Aucun événement à prévisualiser pour le moment.'

  const tabBtn = (t: 'event' | 'super', label: string, sous: string) => (
    <button onClick={() => setTab(t)} style={{ flex: 1, textAlign: 'left', padding: '13px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', border: tab === t ? `2px solid ${ACC}` : '2px solid #E2E8F0', background: tab === t ? 'rgba(37,99,235,.06)' : '#fff' }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: tab === t ? ACC : '#0F172A' }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{sous}</div>
    </button>
  )

  return (
    <div>
      {showTitle && (<>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Parcours mobil</div>
        <div style={{ fontSize: 13.5, color: '#64748B', marginTop: 2, marginBottom: 18 }}>Le vrai parcours joueur, en direct. Choisissez un événement et prévisualisez-le tel qu'il s'affiche sur mobile.</div>
      </>)}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {tabBtn('event', 'Parcours event', 'Votre animation, en direct')}
        {tabBtn('super', 'Parcours super event', multistation ? 'La carte des stations' : 'Le gabarit marque blanche')}
      </div>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start', flexWrap: 'wrap', paddingLeft: 4 }}>
        <div style={{ flex: '0 1 360px', minWidth: 260, maxWidth: 400, order: 1 }}>
          {events.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: '#64748B', marginBottom: 8 }}>Événement à prévisualiser</div>
              <select
                value={ev?.id ?? ''}
                onChange={e => setEvId(e.target.value)}
                style={{ width: '100%', maxWidth: 360, padding: '11px 12px', borderRadius: 12, border: '1px solid #CBD5E1', background: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
              >
                {groupes.map(g => (
                  <optgroup key={g.cle || 'autonomes'} label={g.nom}>
                    {g.evs.map(e => (
                      <option key={e.id} value={e.id}>{e.nom} — {libelleModule(e.module)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {url && (
            <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '11px 18px', borderRadius: 10, background: ACC, color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Ouvrir en plein écran ↗</a>
          )}

          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 14, lineHeight: 1.5, maxWidth: 360 }}>
            Le <b>vrai parcours</b> (pas une maquette). Le cadre ci-contre montre le <b>visuel réel</b>, sans barre d'admin.{' '}
            {tab === 'event'
              ? 'En plein écran, une barre en haut permet en plus de parcourir tous les écrans (accueil, quiz, résultats, bonus, inscription, fin, tickets, carte, partenaires, profil) — pratique pour la démo ou la comm.'
              : multistation
                ? 'Le même parcours, ouvert directement sur l\'écran carte — la seule différence avec un event seul : l\'accès aux autres stations et au multi-partenaire.'
                : 'Cet event n\'appartient à aucun super event : le cadre montre le parcours super event en marque blanche (gabarit tiré de NDS 2026), tel qu\'il se déclinerait pour une opération multi-stations.'}
          </p>
        </div>

        <div style={{ order: 2 }}>
          <Phone src={phoneUrl || undefined} empty={empty} />
        </div>
      </div>
    </div>
  )
}
