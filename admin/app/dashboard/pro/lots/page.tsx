'use client'

/**
 * Dashboard Pro — Lots & distribution.
 * Branche sur les vrais lots (fetchAllLots). Catalogue + statut (à tirer / attribué / retiré).
 * Lecture seule. Le tirage/distribution se gère depuis l'écran Gagnants (outil câblé).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { fetchAllLots } from '@/lib/dashboard'

export default function ProLotsPage() {
  const [lots, setLots] = useState<any[]>([])
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    fetchAllLots().then(l => setLots(l as any[])).catch(() => setLots([])).finally(() => setCharge(false))
  }, [])

  const unites = lots.reduce((s, l) => s + (l.quantite ?? 1), 0)
  const valeur = lots.reduce((s, l) => s + ((l.valeur_euros ?? l.valeur ?? 0) * (l.quantite ?? 1)), 0)

  const card: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 16, padding: 16, marginBottom: 14 }
  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--sa-muted,#64748B)', padding: '8px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)' }
  const td: React.CSSProperties = { padding: '11px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)', fontSize: 13 }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Lots & distribution" subtitle="Votre catalogue de lots — données réelles" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900, color: 'var(--sa-accent,#7C2D92)' }}>{charge ? '…' : lots.length}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>lots au catalogue</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{charge ? '…' : unites}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>unités à distribuer</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{charge ? '…' : `${valeur} €`}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>valeur totale</div></div>
        </div>

        {charge ? <div className="sa-muted" style={{ fontSize: 13 }}>Chargement des lots…</div> : lots.length === 0 ? <div className="sa-muted" style={{ fontSize: 13 }}>Aucun lot.</div> : (
          <div style={{ ...card, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead><tr><th style={th}>Lot</th><th style={th}>Valeur</th><th style={th}>Quantité</th><th style={th}>Statut</th></tr></thead>
              <tbody>
                {lots.map((l, i) => {
                  const retire = !!l.retire
                  const assigne = !!l.assigne_a
                  return (
                    <tr key={l.id ?? i}>
                      <td style={td}><b>{l.emoji ? `${l.emoji} ` : ''}{l.titre ?? l.nom ?? '—'}</b></td>
                      <td style={td}>{(l.valeur_euros ?? l.valeur) != null ? `${l.valeur_euros ?? l.valeur} €` : '—'}</td>
                      <td style={td}>{l.quantite ?? 1}</td>
                      <td style={td}><span style={{ fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '3px 9px', background: retire ? 'rgba(34,197,94,.12)' : assigne ? 'rgba(245,158,11,.14)' : 'var(--sa-subtle,#F8FAFC)', color: retire ? '#15803D' : assigne ? '#B45309' : 'var(--sa-muted,#64748B)' }}>{retire ? 'retiré' : assigne ? 'attribué' : 'disponible'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, fontSize: 12.5, color: 'var(--sa-muted,#64748B)' }}>La distribution (tirage, envoi, remise) se gère depuis l&apos;écran Gagnants.</div>
          <Link href="/dashboard/pro/gagnants" className="sa-btn" style={{ textDecoration: 'none' }}>Aller au tirage →</Link>
        </div>
      </div>
    </div>
  )
}
