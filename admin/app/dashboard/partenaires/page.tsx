'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, StatusChip, ModuleChip, EmptyState, SortableTh, useTri } from '@/components/dashboard/DashboardUI'
import type { FlowinPartenaire } from '@/lib/types'

type Col = 'nom' | 'type' | 'ville' | 'tel' | 'email'

export default function Page() {
  const { partenaires, openDrawer, openDrawerEdit } = useDashboard()
  const [search, setSearch] = useState('')
  const { tri, onSort } = useTri<Col>('nom')

  const base = partenaires

  const list = useMemo(() => {
    let l = base
    if (search.trim()) {
      const q = search.toLowerCase()
      l = l.filter((item: FlowinPartenaire) => ((item as any).nom ?? "").toLowerCase().includes(q) || ((item as any).ville ?? "").toLowerCase().includes(q) || ((item as any).secteur ?? "").toLowerCase().includes(q))
    }
    return [...l].sort((a: any, b: any) => {
      const va = String(a[tri.col] ?? ''); const vb = String(b[tri.col] ?? '')
      return va.localeCompare(vb, 'fr') * (tri.asc ? 1 : -1)
    })
  }, [base, search, tri])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🤝 Partenaires"
          subtitle={`${list.length} résultat${list.length > 1 ? "s" : ""}`}
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher…" />
        <div style={{overflowX:'auto'}}>
          <table className="sa-tbl" style={{width:'100%'}}>
            <thead><tr>
              <th className="col-check"><input type="checkbox" /></th>
              <SortableTh col="nom" label="Partenaire" tri={tri} onSort={onSort} />
              <SortableTh col="type" label="Catégorie" tri={tri} onSort={onSort} />
              <SortableTh col="ville" label="Ville" tri={tri} onSort={onSort} />
              <SortableTh col="tel" label="Téléphone" tri={tri} onSort={onSort} />
              <SortableTh col="email" label="Email" tri={tri} onSort={onSort} />
              <th className="col-actions"></th>
            </tr></thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} style={{padding:0}}>
                  <EmptyState title="Aucun résultat" />
                </td></tr>
              )}
              {list.map((item: FlowinPartenaire) => (
                <tr key={(item as any).id} onClick={() => openDrawer('partenaire', (item as any).id)}>
                  <td className="col-check" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  <td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPartenaire & Record<string,unknown>)["nom"] ?? "—")}</td><td>{(item as FlowinPartenaire).type === "National" ? <span className="sa-chip purple">National</span> : <span className="sa-chip">{}</span>}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPartenaire & Record<string,unknown>)["ville"] ?? "—")}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPartenaire & Record<string,unknown>)["tel"] ?? "—")}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPartenaire & Record<string,unknown>)["email"] ?? "—")}</td>
                  <td className="col-actions" onClick={e => e.stopPropagation()}>
                    <div className="sa-row-actions">
                      <button className="sa-btn icon sm" title="Éditer" onClick={(e) => { e.stopPropagation(); openDrawerEdit('partenaire', (item as any).id) }}>✏</button>
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
