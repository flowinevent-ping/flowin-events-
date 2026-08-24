'use client'

/**
 * Gagnants — lisait auparavant joueurs.gains (colonne jamais alimentee par le
 * vrai systeme de tirage, d'ou le "0 resultat" constate en prod). Les vrais
 * gagnants vivent dans la table tirages (billet + QR + retrait_token), la
 * meme que lisent lot.html, valider_lot et billets-partenaires.html.
 */
import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchGagnants, type GagnantRow } from '@/lib/dashboard'

const euros = (n: number | null) => (n == null ? '—' : `${n} €`)
const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

export default function Page() {
  const { openDrawer } = useDashboard()
  const [list, setList] = useState<GagnantRow[] | null>(null)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<'tous' | 'actifs' | 'retires'>('tous')

  useEffect(() => { fetchGagnants().then(setList) }, [])

  const base = useMemo(() => {
    if (!list) return []
    if (filtre === 'actifs') return list.filter(t => t.statut === 'actif')
    if (filtre === 'retires') return list.filter(t => t.statut === 'retire')
    return list
  }, [list, filtre])

  const filtered = useMemo(() => {
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(t =>
      (t.joueur_nom ?? '').toLowerCase().includes(q) ||
      (t.joueur_email ?? '').toLowerCase().includes(q) ||
      (t.lot_nom ?? '').toLowerCase().includes(q) ||
      (t.ticket_code ?? '').toLowerCase().includes(q))
  }, [base, search])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🏆 Gagnants"
          subtitle={list === null ? 'Chargement…' : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un joueur, un lot, un ticket…" />
          {([['tous', 'Tous'], ['actifs', 'Actifs'], ['retires', 'Retirés']] as const).map(([k, l]) => (
            <button key={k} className={`sa-btn sm${filtre === k ? ' primary' : ''}`} onClick={() => setFiltre(k)}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sa-tbl" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Joueur</th><th>Lot</th><th>Valeur</th><th>Ticket</th><th>Statut</th><th>Tiré le</th>
              </tr>
            </thead>
            <tbody>
              {list !== null && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 0 }}><EmptyState title="Aucun résultat" /></td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} onClick={() => t.joueur_id && openDrawer('joueur', t.joueur_id)} style={{ cursor: t.joueur_id ? 'pointer' : 'default' }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{t.joueur_nom ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{t.joueur_email ?? '—'}</div>
                  </td>
                  <td>{t.lot_nom ?? '—'}</td>
                  <td>{euros(t.lot_valeur)}</td>
                  <td>{t.ticket_code ? <code className="sa-code">{t.ticket_code}</code> : '—'}</td>
                  <td>
                    <span className="sa-chip" style={{ fontSize: 10, fontWeight: 700, color: t.statut === 'retire' ? 'var(--sa-muted)' : '#2f7d4f', borderColor: t.statut === 'retire' ? 'var(--sa-border)' : '#2f7d4f' }}>
                      {t.statut === 'retire' ? 'Retiré' : (t.statut ?? 'actif')}
                    </span>
                    {t.notifie_at && <div style={{ fontSize: 10, color: 'var(--sa-muted)', marginTop: 2 }}>Notifié le {dateFr(t.notifie_at)}</div>}
                  </td>
                  <td style={{ fontSize: 12.5 }}>{dateFr(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
