'use client'

import { useState } from 'react'

/**
 * Parcours mobil (30/07/2026, demande Romain).
 * Apercu du parcours joueur tel qu'il s'affiche sur telephone, pour l'event (animation seule)
 * et le super event (festival multi-stations). Deux onglets, chacun avec une sequence d'ecrans
 * dans un cadre telephone + navigation par etapes. Statique/preview : ne collecte rien, ne remplace
 * pas le vrai parcours en prod -- c'est une visualisation pour le pro de ce que vivent ses clients.
 * Identite visuelle alignee sur Flowin (accent violet/magenta).
 */

const ACC = '#7C2D92', ACC2 = '#E0218A'

type Ecran = { kick: string; titre: string; sous: string; corps: React.ReactNode; cta?: string }

function Ligne({ w = '100%', h = 10, c = 'rgba(255,255,255,.28)' }: { w?: string | number; h?: number; c?: string }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: c }} />
}

const PARCOURS_EVENT: Ecran[] = [
  {
    kick: 'Étape 1 · Scan',
    titre: 'Le client scanne le QR',
    sous: 'Affiche, sticker, vitrine ou écran',
    cta: 'Je joue',
    corps: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 8 }}>
        <div style={{ width: 96, height: 96, borderRadius: 18, background: '#fff', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 68, height: 68, background: `repeating-conic-gradient(${ACC} 0 25%, #fff 0 50%) 50%/16px 16px` }} />
        </div>
        <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 900, fontSize: 17 }}>Bienvenue !</div><div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>Jouez et tentez de gagner un lot</div></div>
      </div>
    ),
  },
  {
    kick: 'Étape 2 · Jeu',
    titre: 'Il joue à votre animation',
    sous: 'Quiz, roue, tombola ou vote',
    cta: 'Valider',
    corps: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.35 }}>Quelle est la spécialité de la maison&nbsp;?</div>
        {['Réponse A', 'Réponse B', 'Réponse C'].map((r, i) => (
          <div key={i} style={{ padding: '11px 13px', borderRadius: 12, background: i === 1 ? '#fff' : 'rgba(255,255,255,.14)', color: i === 1 ? ACC : '#fff', fontWeight: 700, fontSize: 13 }}>{r}</div>
        ))}
      </div>
    ),
  },
  {
    kick: 'Étape 3 · Coordonnées',
    titre: 'Il laisse ses infos',
    sous: 'Alimente votre CRM (opt-in RGPD)',
    cta: 'Je valide',
    corps: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, paddingTop: 6 }}>
        {['Prénom', 'Email', 'Téléphone'].map((f, i) => (
          <div key={i}><div style={{ fontSize: 10.5, opacity: .8, marginBottom: 5 }}>{f}</div><div style={{ height: 38, borderRadius: 10, background: 'rgba(255,255,255,.14)' }} /></div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, opacity: .85, marginTop: 2 }}><span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff' }} />J'accepte de recevoir les offres</div>
      </div>
    ),
  },
  {
    kick: 'Étape 4 · Résultat',
    titre: 'Il découvre son gain',
    sous: 'Billet nominatif + QR à présenter en caisse',
    cta: 'Télécharger mon billet',
    corps: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 8 }}>
        <div style={{ fontSize: 34 }}>🎉</div>
        <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 900, fontSize: 18 }}>Bravo, vous gagnez&nbsp;!</div><div style={{ fontSize: 12, opacity: .85, marginTop: 3 }}>Bon d'achat 20&nbsp;€</div></div>
        <div style={{ width: 72, height: 72, borderRadius: 12, background: '#fff', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 52, height: 52, background: `repeating-conic-gradient(${ACC} 0 25%, #fff 0 50%) 50%/12px 12px` }} />
        </div>
      </div>
    ),
  },
]

const PARCOURS_SUPER: Ecran[] = [
  {
    kick: 'Étape 1 · Station',
    titre: 'Scan à une station du festival',
    sous: 'Chaque commerce est un point de jeu',
    cta: 'Découvrir',
    corps: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 8 }}>
        <div style={{ fontWeight: 900, fontSize: 16, textAlign: 'center', lineHeight: 1.3 }}>Grand Jeu<br />des Nuits du Sud</div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Ligne w="70%" /><Ligne w="90%" /><Ligne w="55%" />
        </div>
      </div>
    ),
  },
  {
    kick: 'Étape 2 · Carte',
    titre: 'Il voit toutes les stations',
    sous: 'Progression et stations restantes',
    cta: 'Continuer',
    corps: (
      <div style={{ paddingTop: 6 }}>
        <div style={{ height: 118, borderRadius: 14, background: 'rgba(255,255,255,.12)', position: 'relative', overflow: 'hidden' }}>
          {[[20, 30], [60, 22], [40, 70], [78, 60]].map(([l, t], i) => (
            <span key={i} style={{ position: 'absolute', left: `${l}%`, top: `${t}%`, width: 14, height: 14, borderRadius: '50%', background: i < 2 ? ACC2 : '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,.25)' }} />
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700 }}>2 stations sur 6 jouées</div>
      </div>
    ),
  },
  {
    kick: 'Étape 3 · Jeu + cumul',
    titre: 'Il joue et cumule des tickets',
    sous: 'Plus il joue de stations, plus il a de chances',
    cta: 'Valider',
    corps: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>Question de la station</div>
        {['Réponse A', 'Réponse B'].map((r, i) => (
          <div key={i} style={{ padding: '11px 13px', borderRadius: 12, background: i === 0 ? '#fff' : 'rgba(255,255,255,.14)', color: i === 0 ? ACC : '#fff', fontWeight: 700, fontSize: 13 }}>{r}</div>
        ))}
        <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.14)', fontSize: 12, fontWeight: 700 }}>🎟️ 3 tickets cumulés</div>
      </div>
    ),
  },
  {
    kick: 'Étape 4 · Tirage',
    titre: 'Grand tirage à la clôture',
    sous: 'Un gagnant par commerce, dans sa boutique',
    cta: 'Voir mes chances',
    corps: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 10 }}>
        <div style={{ fontSize: 32 }}>🎲</div>
        <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 900, fontSize: 16 }}>Rendez-vous au tirage</div><div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>Restez attentif à vos emails</div></div>
      </div>
    ),
  },
]

function Telephone({ ecran }: { ecran: Ecran }) {
  return (
    <div style={{ width: 268, flexShrink: 0 }}>
      <div style={{ borderRadius: 34, padding: 10, background: '#0F172A', boxShadow: '0 24px 60px rgba(15,23,42,.28)' }}>
        <div style={{ borderRadius: 26, overflow: 'hidden', background: `linear-gradient(170deg, ${ACC} 0%, ${ACC2} 100%)`, color: '#fff', minHeight: 468, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 26, display: 'grid', placeItems: 'center' }}><div style={{ width: 84, height: 5, borderRadius: 4, background: 'rgba(255,255,255,.35)' }} /></div>
          <div style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .8 }}>{ecran.kick}</div>
            <div style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-.3px', marginTop: 4, lineHeight: 1.15 }}>{ecran.titre}</div>
            <div style={{ fontSize: 11.5, opacity: .82, marginTop: 4 }}>{ecran.sous}</div>
            <div style={{ flex: 1, marginTop: 14 }}>{ecran.corps}</div>
            {ecran.cta && <div style={{ marginTop: 14, textAlign: 'center', background: '#fff', color: ACC, fontWeight: 800, fontSize: 13.5, padding: '12px', borderRadius: 12 }}>{ecran.cta}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ParcoursMobil({ eventNom, showTitle = true }: { eventNom?: string; showTitle?: boolean }) {
  const [tab, setTab] = useState<'event' | 'super'>('event')
  const [i, setI] = useState(0)
  const ecrans = tab === 'event' ? PARCOURS_EVENT : PARCOURS_SUPER
  const ecran = ecrans[Math.min(i, ecrans.length - 1)]

  const setTabReset = (t: 'event' | 'super') => { setTab(t); setI(0) }

  const tabBtn = (t: 'event' | 'super', label: string, sous: string) => (
    <button
      onClick={() => setTabReset(t)}
      style={{
        flex: 1, textAlign: 'left', padding: '13px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
        border: tab === t ? `2px solid ${ACC}` : '2px solid #E2E8F0',
        background: tab === t ? 'rgba(124,45,146,.06)' : '#fff',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 14, color: tab === t ? ACC : '#0F172A' }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{sous}</div>
    </button>
  )

  return (
    <div>
      {showTitle && (
        <>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-.6px' }}>Parcours mobil</div>
          <div style={{ fontSize: 13.5, color: '#64748B', marginTop: 2, marginBottom: 18 }}>
            Aperçu de ce que vivent vos clients sur leur téléphone{eventNom ? ` — ${eventNom}` : ''}. Cliquez pour dérouler les étapes.
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        {tabBtn('event', 'Parcours event', 'Votre animation, en 4 écrans')}
        {tabBtn('super', 'Parcours super event', 'Le festival multi-stations')}
      </div>

      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Telephone ecran={ecran} />

        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ecrans.map((e, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                  border: idx === i ? `2px solid ${ACC}` : '1px solid #E2E8F0',
                  background: idx === i ? 'rgba(124,45,146,.06)' : '#fff', display: 'flex', gap: 12, alignItems: 'center',
                }}
              >
                <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: idx === i ? ACC : '#EEF2F7', color: idx === i ? '#fff' : '#64748B', fontWeight: 800, fontSize: 12, display: 'grid', placeItems: 'center' }}>{idx + 1}</span>
                <span>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: idx === i ? ACC : '#0F172A' }}>{e.titre}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: '#64748B', marginTop: 1 }}>{e.sous}</span>
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', fontWeight: 700, fontSize: 13, cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? .4 : 1, fontFamily: 'inherit' }}>← Précédent</button>
            <button onClick={() => setI(Math.min(ecrans.length - 1, i + 1))} disabled={i === ecrans.length - 1}
              style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: ACC, color: '#fff', fontWeight: 800, fontSize: 13, cursor: i === ecrans.length - 1 ? 'default' : 'pointer', opacity: i === ecrans.length - 1 ? .4 : 1, fontFamily: 'inherit' }}>Suivant →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
