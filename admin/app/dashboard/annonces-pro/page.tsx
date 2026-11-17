'use client'

/** Annonces des commerces (super admin, 18/11/2026) : liste simple des annonces envoyées dans l'application. */
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { listerAnnonces, type AnnonceEnvoyee } from '@/lib/annoncesPro'
import { estDemo } from '@/lib/demo'

const DEMO: AnnonceEnvoyee[] = [
  { id: 'demo-1', pro_id: 'demo', commerce: 'Commerce Démo', titre: 'Nouveau jeu ce week-end', message: 'Venez jouer et tenter de gagner un lot.', lien: null, date_fin: null, nb_destinataires: 128, created_at: new Date().toISOString() },
]

export default function PageAnnoncesPro() {
  const [l, setL] = useState<AnnonceEnvoyee[] | null>(null)
  const [indispo, setIndispo] = useState(false)
  useEffect(() => {
    if (estDemo()) { setL(DEMO); return }
    listerAnnonces(null).then(r => { setL(r.liste); setIndispo(r.indisponible) }).catch(() => { setL([]); setIndispo(true) })
  }, [])
  const cell = { padding: '10px 12px', borderBottom: '1px solid #E2E8F0', fontSize: 13, verticalAlign: 'top' as const }
  return (
    <div>
      <PageHeader title="Annonces des commerces" subtitle="Envoyées dans l’application aux contacts qui ont accepté. Jamais par e-mail." />
      {l === null && <div style={{ fontSize: 13, color: '#5a6b80' }}>Chargement…</div>}
      {l !== null && indispo && <div data-annonces-indispo style={{ fontSize: 14, color: '#5a6b80' }}>Bientôt disponible : activation en cours</div>}
      {l !== null && !indispo && !l.length && <div style={{ fontSize: 14, color: '#5a6b80' }}>Aucune annonce envoyée.</div>}
      {l !== null && !indispo && l.length > 0 && (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
          <table data-annonces-sa style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Date', 'Commerce', 'Annonce', 'Contacts', 'Fin'].map(h => <th key={h} style={{ ...cell, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: '#64748B' }}>{h}</th>)}</tr></thead>
            <tbody>
              {l.map(a => (
                <tr key={a.id}>
                  <td style={cell}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={cell}>{a.commerce}</td>
                  <td style={cell}><b>{a.titre}</b><div style={{ color: '#64748B' }}>{a.message}</div></td>
                  <td style={cell}>{a.nb_destinataires}</td>
                  <td style={cell}>{a.date_fin ? new Date(a.date_fin + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
