'use client'

/**
 * Une liste filtree par super event doit le DIRE, sinon elle passe pour la
 * liste complete -- et une ligne absente passe pour une donnee perdue.
 * Bandeau commun aux pages qui lisent `?se=` (lib/filtreSuperEvent.ts).
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function BandeauFiltreSE({ seId, quoi, retour }: { seId: string; quoi: string; retour: string }) {
  const [nom, setNom] = useState<string>(seId)
  useEffect(() => {
    supabase.from('super_events').select('nom').eq('id', seId).maybeSingle()
      .then(({ data }) => { if (data?.nom) setNom(data.nom as string) })
  }, [seId])
  return (
    <div className="sa-alert info" style={{ marginBottom: 12, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span>{quoi} de l’opération <b>{nom}</b> uniquement.</span>
      <a className="sa-btn sm" href={retour} style={{ textDecoration: 'none' }}>Tout afficher</a>
    </div>
  )
}
