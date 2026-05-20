'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, StatusChip, ModuleChip, EmptyState } from '@/components/dashboard/DashboardUI'
import type { FlowinJoueur } from '@/lib/types'

export default function Page() {
  const { joueurs, openDrawer, openDrawerEdit } = useDashboard()
  const [search, setSearch] = useState('')

  const base = joueurs.filter((j: FlowinJoueur) => (j as any).gains > 0)

  const list = useMemo(() => {
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter((item: FlowinJoueur) => ((item as any).prenom ?? "").toLowerCase().includes(q) || ((item as any).nom ?? "").toLowerCase().includes(q) || ((item as any).email ?? "").toLowerCase().includes(q))
  }, [base, search])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🏆 Gagnants"
          subtitle={`${list.length} résultat${list.length > 1 ? "s" : ""}`}
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher…" />
        <div style={{overflowX:'auto'}}>
          <table className="sa-tbl" style={{width:'100%'}}>
            <thead><tr>
              <th className="col-check"><input type="checkbox" /></th>
              <th>Joueur</th><th>Email</th><th>Ticket</th><th>Gains</th>
              <th className="col-actions"></th>
            </tr></thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={6} style={{padding:0}}>
                  <EmptyState title="Aucun résultat" />
                </td></tr>
              )}
              {list.map((item: FlowinJoueur) => (
                <tr key={(item as any).id} onClick={() => openDrawer('joueur', (item as any).id)}>
                  <td className="col-check" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  <td><div style={{fontWeight:700}}>{(item as FlowinJoueur).prenom} {(item as FlowinJoueur).nom}</div><div style={{fontSize:11,color:"var(--sa-muted)"}}>{(item as FlowinJoueur).email}</div></td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinJoueur & Record<string,unknown>)["email"] ?? "—")}</td><td>{(item as FlowinJoueur).ticket_code ? <code className="sa-code">{(item as FlowinJoueur).ticket_code}</code> : "—"}</td><td><strong>{(item as FlowinJoueur).gains ?? 0}</strong></td>
                  <td className="col-actions" onClick={e => e.stopPropagation()}>
                    <div className="sa-row-actions">
                      <button className="sa-btn icon sm" title="Éditer" onClick={(e) => { e.stopPropagation(); openDrawerEdit('joueur', (item as any).id) }}>✏</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
