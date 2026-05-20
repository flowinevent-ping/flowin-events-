'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, StatusChip, ModuleChip, EmptyState } from '@/components/dashboard/DashboardUI'
import type { FlowinEvent } from '@/lib/types'

export default function Page() {
  const { events, openDrawer, openDrawerEdit } = useDashboard()
  const [search, setSearch] = useState('')

  const base = events

  const list = useMemo(() => {
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter((item: FlowinEvent) => ((item as any).nom ?? "").toLowerCase().includes(q) || ((item as any).lieu ?? "").toLowerCase().includes(q))
  }, [base, search])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="📅 Events"
          subtitle={`${list.length} résultat${list.length > 1 ? "s" : ""}`}
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher…" />
        <div style={{overflowX:'auto'}}>
          <table className="sa-tbl" style={{width:'100%'}}>
            <thead><tr>
              <th className="col-check"><input type="checkbox" /></th>
              <th>Event</th><th>Module</th><th>Statut</th><th>Participants</th><th>Date</th>
              <th className="col-actions"></th>
            </tr></thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} style={{padding:0}}>
                  <EmptyState title="Aucun résultat" />
                </td></tr>
              )}
              {list.map((item: FlowinEvent) => (
                <tr key={(item as any).id} onClick={() => openDrawer('event', (item as any).id)}>
                  <td className="col-check" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  <td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinEvent & Record<string,unknown>)["nom"] ?? "—")}</td><td><ModuleChip module={(item as FlowinEvent).module} /></td><td><StatusChip status={(item as FlowinEvent).status} /></td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinEvent & Record<string,unknown>)["participants"] ?? "—")}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinEvent & Record<string,unknown>)["date_d"] ?? "—")}</td>
                  <td className="col-actions" onClick={e => e.stopPropagation()}>
                    <div className="sa-row-actions">
                      <button className="sa-btn icon sm" title="Éditer" onClick={(e) => { e.stopPropagation(); openDrawerEdit('event', (item as any).id) }}>✏</button>
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
