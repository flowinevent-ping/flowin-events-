'use client'
import type { DemandeRappel } from '@/lib/demandesRappel'
import { origineLisible } from '@/lib/demandesRappel'

/** Une demande de rappel : coordonnées cliquables, message, bouton « Traité ». */
export default function CarteRappel({ d, onBascule, onPro }: { d: DemandeRappel; onBascule?: (d: DemandeRappel) => void; onPro?: (proId: string) => void }) {
  const nouvelle = d.statut === 'nouvelle'
  return (
    <div data-rappel={d.id} style={{ background: 'var(--sa-card)', border: `1px solid ${nouvelle ? '#F59E0B' : 'var(--sa-border)'}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 14.5 }}>
          {d.prenom} {d.nom} <span style={{ color: 'var(--sa-muted)', fontWeight: 600 }}>· {d.entreprise}, {d.ville}</span>
        </div>
        <span style={{ background: nouvelle ? '#FEF3C7' : '#DCFCE7', color: nouvelle ? '#92400E' : '#166534', fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 99, height: 'fit-content' }}>
          {nouvelle ? 'À rappeler' : 'Traité'}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--sa-muted)', margin: '2px 0 8px' }}>
        Reçue le {new Date(d.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · {origineLisible(d.origine)}{d.commercial ? ` · commercial ${d.commercial}` : ''}
      </div>
      <div style={{ fontSize: 13.5, display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
        <a href={`tel:${d.tel}`}><b>Tél</b> {d.tel}</a>
        <a href={`mailto:${d.email}`}><b>Email</b> {d.email}</a>
        <span><b>Créneau</b> {d.creneau || 'Indifférent'}</span>
      </div>
      {d.message && <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', background: 'var(--sa-bg, #F4F6F9)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{d.message}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {onBascule && (
          <button className={`sa-btn sm${nouvelle ? ' primary' : ''}`} onClick={() => onBascule(d)}>{nouvelle ? '✓ Marquer comme traité' : 'Remettre à rappeler'}</button>
        )}
        {d.pro_id && onPro && <button className="sa-btn sm" onClick={() => onPro(d.pro_id!)}>Ouvrir la fiche pro</button>}
        {!d.pro_id && <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>Pas encore de fiche pro avec cet email</span>}
        {!nouvelle && d.traitee_at && <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>traité le {new Date(d.traitee_at).toLocaleDateString('fr-FR')}{d.traitee_par ? ` par ${d.traitee_par}` : ''}</span>}
      </div>
    </div>
  )
}
