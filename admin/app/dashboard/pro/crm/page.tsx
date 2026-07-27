'use client'

/**
 * Dashboard Pro — Mon CRM.
 * Branche sur les VRAIS joueurs (fetchAllJoueurs). Recherche + tableau. Lecture seule.
 * (La segmentation par pro_id / compte se fera avec la couche auth ; ici vue globale demo.)
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, SearchBar } from '@/components/dashboard/DashboardUI'
import { fetchAllJoueurs } from '@/lib/dashboard'
import type { FlowinJoueur } from '@/lib/types'

export default function ProCrmPage() {
  const [joueurs, setJoueurs] = useState<FlowinJoueur[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchAllJoueurs().then(j => setJoueurs(j)).catch(() => setJoueurs([])).finally(() => setCharge(false))
  }, [])

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = t
      ? joueurs.filter(j => `${(j as any).prenom ?? ''} ${(j as any).nom ?? ''} ${(j as any).email ?? ''} ${(j as any).ville ?? ''}`.toLowerCase().includes(t))
      : joueurs
    return base.slice(0, 300)
  }, [joueurs, q])

  const optin = joueurs.filter(j => (j as any).optin).length
  const card: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 16, padding: 16, marginBottom: 14 }
  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--sa-muted,#64748B)', padding: '8px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)' }
  const td: React.CSSProperties = { padding: '10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)', fontSize: 13 }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Mon CRM" subtitle="Vos contacts — chaque joueur devient un client (données réelles)" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900, color: 'var(--sa-accent,#7C2D92)' }}>{charge ? '…' : joueurs.length}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>contacts</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{charge ? '…' : optin}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>opt-in (recontactables)</div></div>
        </div>

        <div style={{ marginBottom: 12, maxWidth: 380 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Rechercher un contact…" />
        </div>

        {charge ? <div className="sa-muted" style={{ fontSize: 13 }}>Chargement des contacts…</div> : (
          <div style={{ ...card, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead><tr><th style={th}>Contact</th><th style={th}>Email</th><th style={th}>Ville</th><th style={th}>Source</th><th style={th}>Opt-in</th></tr></thead>
              <tbody>
                {rows.map((j, i) => {
                  const x = j as any
                  return (
                    <tr key={x.id ?? i}>
                      <td style={td}><b>{`${x.prenom ?? ''} ${x.nom ?? ''}`.trim() || '—'}</b></td>
                      <td style={{ ...td, color: 'var(--sa-muted,#64748B)' }}>{x.email || '—'}</td>
                      <td style={{ ...td, color: 'var(--sa-muted,#64748B)' }}>{x.ville || '—'}</td>
                      <td style={{ ...td, color: 'var(--sa-muted,#64748B)' }}>{x.decouverte || '—'}</td>
                      <td style={td}>{x.optin ? <span style={{ fontSize: 11, fontWeight: 800, color: '#15803D' }}>✓</span> : <span style={{ color: 'var(--sa-muted,#64748B)' }}>—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length >= 300 && <div className="sa-muted" style={{ fontSize: 12, marginTop: 10 }}>300 premiers affichés — affinez la recherche.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
