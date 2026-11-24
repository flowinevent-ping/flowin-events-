'use client'

/**
 * CARROUSEL DES ÉCRANS COMMERCE (maquettes lot 5 E et lot 6 C validées par Romain, 24/11/2026) :
 * bandeau orange avec pictogramme, titre, sous-titre et « n/N » ; points ; un écran = une idée ;
 * glisser du doigt ou flèches ; pied avec l'action principale. Cibles 44 px, aucun défilement vertical voulu.
 * Orange = couleur des maquettes validées (#B5471E vers #E8872F), pas de violet.
 */
import { useState, type ReactNode } from 'react'
import { useGlisser } from '@/components/pro/Carrousel'
import { Ico } from '@/lib/proicons'

export const ORANGE = '#B5471E'
export const ORANGE2 = '#E8872F'
export const ENCRE = '#1B3A5C'
export const BLEU = '#3B5CC4'
export const VERT = '#15803D'
export const GRIS = '#52647A'

export interface EcranOrange {
  cle: string
  titre: string
  sous: string
  /** Pictogramme du bandeau (clé de lib/proicons). */
  picto: string
  corps: ReactNode
  pied?: ReactNode
}

const fleche = (actif: boolean) => ({
  width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', color: actif ? ORANGE : '#B8C0CC',
  cursor: actif ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900,
} as const)

export default function CarrouselOrange({ ecrans, nom, depart = 0 }: { ecrans: EcranOrange[]; nom: string; depart?: number }) {
  const [i, setI] = useState(Math.min(Math.max(depart, 0), ecrans.length - 1))
  const n = ecrans.length
  const e = ecrans[i]
  const g = useGlisser(s => { const k = i + s; if (k >= 0 && k < n) setI(k) })
  return (
    <div data-carrousel data-carrousel-commerce role="region" aria-roledescription="carrousel" aria-label={nom} {...g}
      style={{ maxWidth: 520, margin: '0 auto', background: '#F4F1EC', borderRadius: 26, overflow: 'hidden', border: '1px solid #E6DED4' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 16px', color: '#fff', borderRadius: '0 0 24px 24px', background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, minHeight: 76 }}>
        <span style={{ flex: 'none', width: 48, height: 48, borderRadius: 14, background: '#fff', color: ORANGE, display: 'grid', placeItems: 'center' }}><Ico k={e.picto} size={24} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.1, overflowWrap: 'anywhere' }}>{e.titre}</div>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: .95, marginTop: 2 }}>{e.sous}</div>
        </div>
        <span style={{ flex: 'none', background: '#fff', color: ORANGE, fontWeight: 900, fontSize: 15, borderRadius: 14, padding: '6px 10px' }}>{i + 1}/{n}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button type="button" aria-label="Écran précédent" disabled={i === 0} onClick={() => setI(i - 1)} style={fleche(i > 0)}>‹</button>
        {ecrans.map((x, k) => (
          <button key={x.cle} type="button" aria-label={`Écran ${k + 1} sur ${n} : ${x.titre}`} aria-current={k === i} onClick={() => setI(k)}
            style={{ height: 44, minWidth: 28, border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ display: 'block', height: 9, width: k === i ? 26 : 9, borderRadius: 9, background: k === i ? ORANGE : '#D1D5DB', transition: 'width .2s' }} />
          </button>
        ))}
        <button type="button" aria-label="Écran suivant" disabled={i === n - 1} onClick={() => setI(i + 1)} style={fleche(i < n - 1)}>›</button>
      </div>
      <div data-ecran={e.cle} aria-live="polite" style={{ padding: '4px 16px 14px', minHeight: 330, color: ENCRE }}>{e.corps}</div>
      {e.pied && <div style={{ padding: '12px 16px 16px', background: '#fff', borderRadius: '24px 24px 0 0', boxShadow: '0 -6px 16px -10px rgba(27,58,92,.35)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>{e.pied}</div>}
    </div>
  )
}

/** Bouton principal orange (≥ 44 px) ; `href` pour un lien, `onClick` pour une action. */
export const boutonOrange = (secondaire = false) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, minWidth: 140, minHeight: 52, borderRadius: 26,
  fontSize: 16, fontWeight: 800, textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'inherit',
  ...(secondaire
    ? { background: '#fff', color: ORANGE, border: '2px solid #F3D3BC', boxShadow: 'none' }
    : { background: `linear-gradient(135deg, ${ORANGE}, #D2631F)`, color: '#fff', border: 0, boxShadow: '0 6px 14px rgba(181,71,30,.35)' }),
} as const)

/** Carte blanche de la maquette. */
export const carteBlanche = { background: '#fff', border: '1.5px solid #E2E7EE', borderRadius: 18, padding: 14, marginBottom: 10 } as const

/** Étiquette « Exemple · démo » : les chiffres d'exemple ne passent jamais pour des vrais. */
export function EtiquetteDemo() {
  return <div data-etiquette-demo style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 800, color: ORANGE, background: '#FFF4EA', border: '1px solid #F3D3BC', borderRadius: 99, padding: '3px 10px', margin: '2px 0 8px' }}>Exemple · démo</div>
}

export function Bientot({ texte = 'Ce chiffre arrive bientôt.' }: { texte?: string }) {
  return (
    <div data-bientot style={{ ...carteBlanche, textAlign: 'center', padding: '34px 14px', marginTop: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE }}>Bientôt</div>
      <div style={{ fontSize: 14, color: GRIS, marginTop: 4 }}>{texte}</div>
    </div>
  )
}
