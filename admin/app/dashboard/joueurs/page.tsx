'use client'

/**
 * Joueurs — vue "style tableur" demandee par Romain (on avait ca en juillet,
 * dashboard.html : xls-table avec en-tetes triables fleche ▲▼⇅ + colonnes
 * detaillees). Reprend le meme principe de tri par colonne, avec le jeu de
 * colonnes explicitement demande : date entree, nom, prenom, adresse, ville,
 * tel, email, event, source, optin. Scope volontairement plus reduit que
 * l'original : pas de selection groupee / export CSV / dropdowns de filtre
 * par valeur (ville/event/optin) -- a ajouter si demande separement.
 */
import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'
import type { FlowinJoueur } from '@/lib/types'

type Cle = 'date' | 'source' | 'nom' | 'prenom' | 'adresse' | 'ville' | 'tel' | 'email' | 'optin' | 'gains'
type Sens = 1 | -1

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

export default function Page() {
  const { joueurs, openDrawer, openDrawerEdit } = useDashboard()
  const [search, setSearch] = useState('')
  const [tri, setTri] = useState<{ cle: Cle; sens: Sens }>({ cle: 'date', sens: -1 })

  const base = joueurs

  const filtres = useMemo(() => {
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter((j: FlowinJoueur) =>
      (j.prenom ?? '').toLowerCase().includes(q) ||
      (j.nom ?? '').toLowerCase().includes(q) ||
      (j.email ?? '').toLowerCase().includes(q) ||
      (j.ville ?? '').toLowerCase().includes(q) ||
      (j.adresse ?? '').toLowerCase().includes(q) ||
      (j.code_postal ?? '').includes(q))
  }, [base, search])

  const list = useMemo(() => {
    const arr = [...filtres]
    const { cle, sens } = tri
    const val = (j: FlowinJoueur): string | number => {
      switch (cle) {
        case 'date': return j.first_seen ?? j.ts ?? ''
        case 'source': return (j.source ?? '').toLowerCase()
        case 'nom': return (j.nom ?? '').toLowerCase()
        case 'prenom': return (j.prenom ?? '').toLowerCase()
        case 'adresse': return (j.adresse ?? '').toLowerCase()
        case 'ville': return (j.ville ?? '').toLowerCase()
        case 'tel': return j.tel ?? ''
        case 'email': return (j.email ?? '').toLowerCase()
        case 'optin': return j.optin ? 1 : 0
        case 'gains': return j.gains ?? 0
      }
    }
    arr.sort((a, b) => {
      const va = val(a), vb = val(b)
      if (va < vb) return -1 * sens
      if (va > vb) return 1 * sens
      return 0
    })
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres, tri])

  function trier(cle: Cle) {
    setTri(prev => prev.cle === cle ? { cle, sens: (prev.sens * -1) as Sens } : { cle, sens: 1 })
  }

  function Th({ cle, label, width }: { cle: Cle; label: string; width?: number }) {
    const actif = tri.cle === cle
    const fleche = actif ? (tri.sens === 1 ? '▲' : '▼') : '⇅'
    return (
      <th style={{ width, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => trier(cle)}>
        {label} <span style={{ opacity: actif ? 1 : 0.35, fontSize: 10 }}>{fleche}</span>
      </th>
    )
  }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="👥 Joueurs"
          subtitle={`${list.length} résultat${list.length > 1 ? 's' : ''} — cliquer un en-tête pour trier`}
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher (nom, email, ville, adresse, code postal)…" />
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-tbl" style={{ width: '100%' }}>
            <thead><tr>
              <th className="col-check"><input type="checkbox" /></th>
              <Th cle="date" label="Date entrée" width={100} />
              <Th cle="source" label="Source" width={110} />
              <Th cle="nom" label="Nom" width={130} />
              <Th cle="prenom" label="Prénom" width={110} />
              <Th cle="adresse" label="Adresse" width={160} />
              <Th cle="ville" label="Ville" width={110} />
              <Th cle="tel" label="Tél." width={120} />
              <Th cle="email" label="Email" width={190} />
              <Th cle="optin" label="Opt-in" width={70} />
              <Th cle="gains" label="Gains" width={60} />
              <th className="col-actions"></th>
            </tr></thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={12} style={{ padding: 0 }}>
                  <EmptyState title="Aucun résultat" />
                </td></tr>
              )}
              {list.map((j: FlowinJoueur) => {
                return (
                  <tr key={j.id} onClick={() => openDrawer('joueur', j.id)}>
                    <td className="col-check" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                    <td style={{ color: 'var(--sa-muted)', fontSize: 12.5 }}>{fmtDate(j.first_seen ?? j.ts)}</td>
                    <td style={{ fontSize: 12, color: 'var(--sa-muted)' }}>{j.source || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{j.nom || '—'}</td>
                    <td>{j.prenom || '—'}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--sa-muted)' }}>{j.adresse || '—'}</td>
                    <td style={{ fontSize: 12.5 }}>{j.ville || '—'}{j.code_postal ? ` (${j.code_postal})` : ''}</td>
                    <td style={{ fontSize: 12.5 }}>
                      {j.tel
                        ? <a href={`tel:${j.tel}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{j.tel}</a>
                        : '—'}
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {j.email
                        ? <a href={`mailto:${j.email}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{j.email}</a>
                        : '—'}
                    </td>
                    <td>{j.optin ? <span className="sa-chip live">✅</span> : <span className="sa-chip">—</span>}</td>
                    <td><strong>{j.gains ?? 0}</strong></td>
                    <td className="col-actions" onClick={e => e.stopPropagation()}>
                      <div className="sa-row-actions">
                        <button className="sa-btn icon sm" title="Éditer" onClick={(e) => { e.stopPropagation(); openDrawerEdit('joueur', j.id) }}>✏</button>
                      </div>
                    </td>
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
