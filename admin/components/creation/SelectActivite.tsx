'use client'

import type { CSSProperties } from 'react'
import { FAMILLES_ACTIVITES, ACTIVITE_AUTRE, ANCIENNES_CATEGORIES, estActiviteConnue } from '@/lib/activites'

/**
 * Selecteur d'activite par familles (lib/activites : source unique). « Autre » est en dernier : le champ « Précisez votre activité »
 * (PrecisionAutre) s'affiche alors. Une valeur deja enregistree hors liste (ancienne categorie) reste selectionnable.
 */
export default function SelectActivite({ valeur, onChange, style, id, vide = '— Choisir —' }: { valeur: string; onChange: (v: string) => void; style?: CSSProperties; id?: string; vide?: string }) {
  const horsListe = valeur && !estActiviteConnue(valeur) && ANCIENNES_CATEGORIES.indexOf(valeur) < 0
  return (
    <select id={id} style={style} value={valeur} onChange={e => onChange(e.target.value)}>
      <option value="">{vide}</option>
      {horsListe && <option value={valeur}>{valeur}</option>}
      {FAMILLES_ACTIVITES.map(f => (
        <optgroup key={f.famille} label={f.famille}>
          {f.activites.map(a => <option key={a} value={a}>{a}</option>)}
        </optgroup>
      ))}
      <option value={ACTIVITE_AUTRE}>Autre (je précise)</option>
    </select>
  )
}
