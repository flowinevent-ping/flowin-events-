'use client'

/** Banque commune Flowin (lecture seule pour le pro) : bouton « Copier dans mes banques ». */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { copierBanque, type Banque } from '@/lib/banques'

export default function CopierCommune({ source, proId, lienBase, lienSuffixe = '' }: { source: Banque; proId: string; lienBase: string; lienSuffixe?: string }) {
  const router = useRouter()
  const [etat, setEtat] = useState<'idle' | 'busy' | 'fait' | 'echec'>('idle')
  const [id, setId] = useState('')
  async function copier() {
    setEtat('busy')
    const b = await copierBanque(source, proId)
    if (!b) { setEtat('echec'); return }
    setId(b.id); setEtat('fait'); router.refresh()
  }
  if (etat === 'fait') return <a href={lienBase + id + lienSuffixe} style={{ fontSize: 12.5, fontWeight: 800, color: '#15803D' }}>Copiée — ouvrir ma copie</a>
  return (
    <div>
      <button type="button" data-copier={source.id} disabled={etat === 'busy'} onClick={copier}
        style={{ border: '1.5px solid #E3E8EF', background: '#fff', color: '#3B5CC4', borderRadius: 9, padding: '6px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{etat === 'busy' ? 'Copie…' : 'Copier dans mes banques'}</button>
      {etat === 'echec' && <div role="alert" style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>Copie impossible (droit ou réseau).</div>}
    </div>
  )
}
