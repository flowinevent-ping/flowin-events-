'use client'

import { CHARTE_PRO as C } from '@/lib/charte'

/** Liste deroulante des operations, rangees par type puis par date. Change ?op= dans l adresse. */
export default function ChoixOperation({ groupes, valeur }: {
  groupes: { titre: string; ops: { cle: string; nom: string; dates: string }[] }[]
  valeur: string
}) {
  return (
    <select
      value={valeur}
      onChange={e => {
        const u = new URL(window.location.href)
        if (e.target.value) u.searchParams.set('op', e.target.value)
        else u.searchParams.delete('op')
        window.location.href = u.toString()
      }}
      style={{ minWidth: 280, maxWidth: '100%', padding: '11px 14px', borderRadius: 14, border: `1.5px solid ${C.bordureChamp}`, background: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: C.texte, cursor: 'pointer' }}
    >
      <option value="">Toutes les opérations</option>
      {groupes.map(g => (
        <optgroup key={g.titre} label={g.titre}>
          {g.ops.map(o => <option key={o.cle} value={o.cle}>{o.nom} — {o.dates}</option>)}
        </optgroup>
      ))}
    </select>
  )
}
