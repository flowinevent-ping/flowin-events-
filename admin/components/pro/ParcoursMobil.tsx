'use client'

import { useState } from 'react'

/**
 * Parcours mobil (30/07/2026, v2 — branchement du vrai contenu).
 * Affiche le VRAI parcours joueur en direct dans un cadre telephone (iframe), pas une maquette :
 *  - onglet Event : /parcours/<module>?ev=<id> (le parcours reel de l'animation choisie)
 *  - onglet Super event : /se/<seId> (la page publique du super event : carte des stations, lots)
 * Un selecteur permet de choisir quel evenement previsualiser. Reutilise cote profil partenaire
 * (/pro/parcours) et cote dashboard SA (/dashboard/parcours) via les memes props.
 */

const ACC = '#7C2D92'
type Ev = { id: string; module: string; nom: string }

const MODULE_LABEL: Record<string, string> = {
  quiz: 'Quiz', quizmaster: 'Quiz Master', quizsolo: 'Quiz Solo',
  spin: 'Roue', tombola: 'Tombola', vote: 'Vote', paques: 'Chasse aux œufs',
}

function Phone({ src, empty }: { src?: string; empty?: string }) {
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

export default function ParcoursMobil({ events = [], seId, showTitle = true }: { events?: Ev[]; seId?: string; showTitle?: boolean }) {
  const [tab, setTab] = useState<'event' | 'super'>('event')
  const [evId, setEvId] = useState(events[0]?.id ?? '')
  const ev = events.find(e => e.id === evId) ?? events[0]

  const eventUrl = ev ? `/parcours/${ev.module}?ev=${encodeURIComponent(ev.id)}&preview=1` : ''
  const superUrl = seId ? `/se/${encodeURIComponent(seId)}` : ''
  const url = tab === 'event' ? eventUrl : superUrl
  const empty = tab === 'event'
    ? 'Aucun événement à prévisualiser pour le moment.'
    : 'Aucun super event associé à prévisualiser.'

  const tabBtn = (t: 'event' | 'super', label: string, sous: string) => (
    <button onClick={() => setTab(t)} style={{ flex: 1, textAlign: 'left', padding: '13px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', border: tab === t ? `2px solid ${ACC}` : '2px solid #E2E8F0', background: tab === t ? 'rgba(124,45,146,.06)' : '#fff' }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: tab === t ? ACC : '#0F172A' }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{sous}</div>
    </button>
  )

  return (
    <div>
      {showTitle && (<>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-.6px' }}>Parcours mobil</div>
        <div style={{ fontSize: 13.5, color: '#64748B', marginTop: 2, marginBottom: 18 }}>Le vrai parcours joueur, en direct. Choisissez un événement et prévisualisez-le tel qu'il s'affiche sur mobile.</div>
      </>)}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {tabBtn('event', 'Parcours event', 'Votre animation, en direct')}
        {tabBtn('super', 'Parcours super event', 'La carte des stations')}
      </div>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start', flexWrap: 'wrap', paddingLeft: 4 }}>
        <div style={{ flex: '0 1 360px', minWidth: 260, maxWidth: 400, order: 1 }}>
          {tab === 'event' && events.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: '#64748B', marginBottom: 8 }}>Événement à prévisualiser</div>
              <select
                value={ev?.id ?? ''}
                onChange={e => setEvId(e.target.value)}
                style={{ width: '100%', maxWidth: 360, padding: '11px 12px', borderRadius: 12, border: '1px solid #CBD5E1', background: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
              >
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.nom} — {MODULE_LABEL[e.module] ?? e.module}</option>
                ))}
              </select>
            </div>
          )}

          {url && (
            <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '11px 18px', borderRadius: 10, background: ACC, color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Ouvrir en plein écran ↗</a>
          )}

          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 14, lineHeight: 1.5, maxWidth: 360 }}>
            Le <b>vrai parcours</b> (pas une maquette), en <b>mode aperçu</b>.{' '}
            {tab === 'event'
              ? 'Une barre en haut permet de parcourir tous les écrans : accueil, quiz, résultats, bonus, inscription, fin, tickets, carte, partenaires, profil.'
              : 'La carte publique du festival, avec les stations et les lots.'}
          </p>
        </div>

        <div style={{ order: 2 }}>
          <Phone src={url || undefined} empty={empty} />
        </div>
      </div>
    </div>
  )
}
