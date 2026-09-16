'use client'

/**
 * EXPORT CSV — par operation.
 *
 * L export vivait dans l ancien ProClient (application mobile a barre
 * d onglets, famille J), sur l event choisi dans une liste. Il passe dans la
 * grammaire commune, un bouton par operation (rien a plat).
 *
 * Les participants sont lus dans `participations` (qui a REELLEMENT joue sur
 * les stations de l operation), pas dans `joueurs.events` (Pattern C).
 */
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { OperationsPro } from '@/lib/operations'
import { BlocOperation, AucuneOperation, btn } from '@/components/operations/BlocsOperations'

const COLS = 'id,prenom,nom,email,tel,ville,code_postal,optin,ticket_code,first_seen'

export default function ExportOperations({ ops }: { ops: OperationsPro }) {
  const [etat, setEtat] = useState<Record<string, string>>({})

  async function exporter(cle: string, nom: string, stationIds: string[]) {
    setEtat(e => ({ ...e, [cle]: 'Préparation…' }))
    const { data: parts } = await supabase.from('participations').select('joueur_id').in('event_id', stationIds).not('joueur_id', 'is', null)
    const ids = Array.from(new Set(((parts ?? []) as { joueur_id: string }[]).map(p => p.joueur_id)))
    if (!ids.length) { setEtat(e => ({ ...e, [cle]: 'Aucun participant sur cette opération.' })); return }
    const lignes: Record<string, unknown>[] = []
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await supabase.from('joueurs').select(COLS).in('id', ids.slice(i, i + 200))
      lignes.push(...((data ?? []) as unknown as Record<string, unknown>[]))
    }
    const entete = ['Prénom', 'Nom', 'Email', 'Tél', 'Ville', 'Code postal', 'Opt-in', 'Ticket', 'Première visite']
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = '﻿' + [entete.map(q).join(',')].concat(lignes.map(j => [
      j.prenom, j.nom, j.email, j.tel, j.ville, j.code_postal, j.optin ? 'oui' : 'non', j.ticket_code, j.first_seen,
    ].map(q).join(','))).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `flowin-${nom.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setEtat(e => ({ ...e, [cle]: `${lignes.length} participant${lignes.length > 1 ? 's' : ''} exporté${lignes.length > 1 ? 's' : ''}.` }))
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Exporter les participants</div>
      {ops.operations.length === 0 && <AucuneOperation />}
      {ops.operations.map(op => (
        <BlocOperation key={op.cle} op={op} droite={
          <button style={btn} onClick={() => exporter(op.cle, op.nom, op.stations.map(s => s.id))}>↓ CSV</button>
        }>
          <div style={{ fontSize: 12, color: '#64748B' }}>{etat[op.cle] ?? 'Prénom, nom, email, téléphone, ville, opt-in, ticket.'}</div>
        </BlocOperation>
      ))}
    </div>
  )
}
