'use client'

/**
 * Gagnants — lisait auparavant joueurs.gains (colonne jamais alimentee par le
 * vrai systeme de tirage, d'ou le "0 resultat" constate en prod). Les vrais
 * gagnants vivent dans la table tirages (billet + QR + retrait_token), la
 * meme que lisent lot.html, valider_lot et billets-partenaires.html.
 *
 * MAJ 25/08 -- Romain signale : le statut brut actif/retire masquait l'info
 * utile (un gagnant "actif" peut etre soit jamais appele, soit confirme et
 * juste pas encore retire -- deux situations tres differentes en pratique).
 * Reprend le meme etat a 3 valeurs deja utilise partout ailleurs
 * (a_confirmer / confirme / retire, voir partenaire_gagnants() RPC).
 * Ajoute aussi la colonne + le filtre Pro (partenaire), absents jusqu'ici --
 * impossible jusque la de savoir a quel commerce un gagnant appartenait
 * depuis cette liste.
 */
import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchGagnants, type GagnantRow } from '@/lib/dashboard'

type Etat = 'a_confirmer' | 'confirme' | 'retire'
const LIB_ETAT: Record<Etat, string> = { a_confirmer: 'En attente', confirme: 'Confirmé', retire: 'Utilisé' }

const euros = (n: number | null) => (n == null ? '—' : `${n} €`)
const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')
const dateHeureFr = (s: string | null) => (s ? new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')

function etatDe(t: GagnantRow): Etat {
  if (t.retire_at) return 'retire'
  if (t.notifie_at) return 'confirme'
  return 'a_confirmer'
}

export default function Page() {
  const { openDrawer, partenaires } = useDashboard()
  const [list, setList] = useState<GagnantRow[] | null>(null)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<'tous' | Etat>('tous')
  const [pro, setPro] = useState('')

  useEffect(() => { fetchGagnants().then(setList) }, [])

  const nomPartenaire = (id: string | null) => partenaires.find(p => p.id === id)?.nom ?? (id ?? '—')

  const partenairesAvecGagnant = useMemo(() => {
    if (!list) return []
    const ids = Array.from(new Set(list.map(t => t.partenaire_id).filter((x): x is string => !!x)))
    return ids.map(id => ({ id, nom: nomPartenaire(id) })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, partenaires])

  const base = useMemo(() => {
    if (!list) return []
    let l = list
    if (filtre !== 'tous') l = l.filter(t => etatDe(t) === filtre)
    if (pro) l = l.filter(t => t.partenaire_id === pro)
    return l
  }, [list, filtre, pro])

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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un joueur, un lot, un ticket…" />
          {([['tous', 'Tous'], ['a_confirmer', 'En attente'], ['confirme', 'Confirmés'], ['retire', 'Utilisés']] as const).map(([k, l]) => (
            <button key={k} className={`sa-btn sm${filtre === k ? ' primary' : ''}`} onClick={() => setFiltre(k)}>
              {l}
            </button>
          ))}
          <select className="sa-input" style={{ marginLeft: 'auto', width: 'auto', fontSize: 12.5, padding: '6px 10px' }} value={pro} onChange={e => setPro(e.target.value)}>
            <option value="">Tous les pros</option>
            {partenairesAvecGagnant.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginBottom: 12 }}>
          <b>En attente</b> = jamais appelé · <b>Confirmé</b> = appelé, lot pas encore récupéré · <b>Utilisé</b> = billet scanné et lot remis en boutique
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sa-tbl" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Joueur</th><th>Pro</th><th>Lot</th><th>Valeur</th><th>Ticket</th><th>Statut</th><th>Tiré le</th>
              </tr>
            </thead>
            <tbody>
              {list !== null && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 0 }}><EmptyState title="Aucun résultat" /></td></tr>
              )}
              {filtered.map(t => {
                const etat = etatDe(t)
                return (
                  <tr key={t.id} onClick={() => t.joueur_id && openDrawer('joueur', t.joueur_id)} style={{ cursor: t.joueur_id ? 'pointer' : 'default' }}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{t.joueur_nom ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{t.joueur_email ?? '—'}</div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{nomPartenaire(t.partenaire_id)}</td>
                    <td>{t.lot_nom ?? '—'}</td>
                    <td>{euros(t.lot_valeur)}</td>
                    <td>{t.ticket_code ? <code className="sa-code">{t.ticket_code}</code> : '—'}</td>
                    <td>
                      <span className="sa-chip" style={{
                        fontSize: 10, fontWeight: 700,
                        color: etat === 'retire' ? 'var(--sa-muted)' : etat === 'confirme' ? '#2f7d4f' : '#b4791f',
                        borderColor: etat === 'retire' ? 'var(--sa-border)' : etat === 'confirme' ? '#2f7d4f' : '#b4791f',
                      }}>
                        {LIB_ETAT[etat]}
                      </span>
                      {etat === 'confirme' && t.notifie_at && <div style={{ fontSize: 10, color: 'var(--sa-muted)', marginTop: 2 }}>Notifié le {dateFr(t.notifie_at)}</div>}
                      {etat === 'retire' && t.retire_at && <div style={{ fontSize: 10, color: 'var(--sa-muted)', marginTop: 2 }}>Le {dateHeureFr(t.retire_at)}</div>}
                    </td>
                    <td style={{ fontSize: 12.5 }}>{dateFr(t.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
