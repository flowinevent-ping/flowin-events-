'use client'

/**
 * FICHE PRO (SA) — referentiel 39, 45, 46.
 *   - « Voir son espace » : l espace pro tel que le pro le voit ;
 *   - « Écrire au pro » : email prerempli (Gmail), avec le lien de son espace
 *     et son code de validation ;
 *   - code PIN de validation en caisse, modifiable ici. Seule colonne PIN :
 *     partenaires.code_pin (la fiche commerce du pro).
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FlowinPro } from '@/lib/types'

const BASE = 'https://flowin-events.vercel.app'

export default function ActionsFichePro({ pro }: { pro: FlowinPro }) {
  const [pin, setPin] = useState<string | null>(null)
  const [saisie, setSaisie] = useState('')
  const [edition, setEdition] = useState(false)
  const [etat, setEtat] = useState<'' | 'ok' | 'ko'>('')
  const ptId = pro.partenaire_id ?? null

  useEffect(() => {
    setPin(null); setEdition(false); setEtat('')
    if (!ptId) return
    supabase.from('partenaires').select('code_pin').eq('id', ptId).maybeSingle()
      .then(({ data }) => setPin(((data as { code_pin: string | null } | null)?.code_pin) ?? null))
  }, [ptId])

  const espace = `${BASE}/pro?pro=${encodeURIComponent(pro.id)}`
  const corps = [
    `Bonjour${pro.contact ? ` ${pro.contact}` : ''},`, '',
    '', '',
    `Votre espace Flowin : ${espace}`,
    ...(pin ? [`Votre code de validation des lots en caisse : ${pin}`] : []), '',
    'L’équipe Flowin',
    'flowinevent@gmail.com · 04 93 59 91 37',
  ].join('\n')
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1${pro.email ? `&to=${encodeURIComponent(pro.email)}` : ''}&su=${encodeURIComponent(`Flowin — ${pro.nom}`)}&body=${encodeURIComponent(corps)}`

  async function enregistrer() {
    if (!ptId || !/^\d{4}$/.test(saisie)) { setEtat('ko'); return }
    const { error } = await supabase.from('partenaires').update({ code_pin: saisie }).eq('id', ptId)
    if (error) { setEtat('ko'); return }
    setPin(saisie); setEdition(false); setEtat('ok')
  }

  return (
    <div style={{ margin: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <a className="sa-btn sm" href={espace} target="_blank" rel="noopener noreferrer">👁 Voir son espace</a>
      <a className="sa-btn sm" href={gmail} target="_blank" rel="noopener noreferrer">✉️ Écrire au pro</a>
      {!pro.email && <span style={{ fontSize: 11, color: '#B45309' }}>email non renseigné</span>}
      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <span className="sa-muted">PIN caisse</span>
        {!ptId && <span className="sa-muted">— (pas de fiche commerce)</span>}
        {ptId && !edition && (
          <>
            <code className="sa-code" style={{ letterSpacing: 3, fontWeight: 800 }}>{pin ?? '—'}</code>
            <button className="sa-btn sm" onClick={() => { setSaisie(pin ?? ''); setEdition(true); setEtat('') }}>Modifier</button>
          </>
        )}
        {ptId && edition && (
          <>
            <input className="sa-input" style={{ width: 80, letterSpacing: 3, textAlign: 'center' }} inputMode="numeric"
              value={saisie} onChange={e => setSaisie(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" />
            <button className="sa-btn sm primary" disabled={saisie.length !== 4} onClick={enregistrer}>✓</button>
            <button className="sa-btn sm" onClick={() => setEdition(false)}>✕</button>
          </>
        )}
        {etat === 'ok' && <span style={{ color: '#2f7d4f', fontWeight: 700 }}>Enregistré</span>}
        {etat === 'ko' && <span style={{ color: '#B45309', fontWeight: 700 }}>4 chiffres</span>}
      </span>
    </div>
  )
}
