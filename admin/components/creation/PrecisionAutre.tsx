'use client'

import { SECTEUR_AUTRE, PRECISION_AUTRE_MAX } from '@/lib/proCreation'

/**
 * « Précisez votre activité » : champ qui apparaît quand le secteur / la catégorie choisie est « Autre ».
 * Partout où un sélecteur de secteur existe (inscription, fiche entreprise, rejoindre un super event, parcours SA).
 */
export default function PrecisionAutre({ secteur, valeur, onChange, style, id = 'precision-autre', erreur }: {
  secteur: string
  valeur: string
  onChange: (v: string) => void
  style?: React.CSSProperties
  id?: string
  erreur?: string | null
}) {
  if (secteur !== SECTEUR_AUTRE) return null
  return (
    <label data-precision-autre style={{ display: 'block', marginTop: 10 }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '.02em', marginBottom: 5 }}>Précisez votre activité <span aria-hidden>*</span></span>
      <input id={id} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #C9D4E3', fontSize: 16, fontFamily: 'inherit', ...style }}
        maxLength={PRECISION_AUTRE_MAX} value={valeur} placeholder="Ex. cave à bières, atelier de poterie…"
        onChange={e => onChange(e.target.value)} aria-invalid={erreur ? true : undefined} />
      {erreur && <span role="alert" style={{ display: 'block', fontSize: 12.5, color: '#B42318', fontWeight: 700, marginTop: 5 }}>{erreur}</span>}
    </label>
  )
}
