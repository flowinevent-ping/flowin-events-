'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, StatusChip, ModuleChip, EmptyState } from '@/components/dashboard/DashboardUI'
import type { FlowinEvent } from '@/lib/types'

const ORDRE_STATUT: Record<string, number> = { live: 0, upcoming: 1, past: 2, archived: 3 }
const TITRES: Record<string, string> = { live: '🔴 En cours', upcoming: '📅 À venir', past: '✅ Passés', archived: '🗄️ Archivés' }

export default function Page() {
  const { events, openDrawer, openDrawerEdit, pros } = useDashboard()
  const [search, setSearch] = useState('')
  const [cacherDemo, setCacherDemo] = useState(true)

  const base = useMemo(() => {
    if (!cacherDemo) return events
    return events.filter((e: FlowinEvent & Record<string, unknown>) => !(e.pro_id === null && String(e.nom ?? '').startsWith('Démo')))
  }, [events, cacherDemo])

  const list = useMemo(() => {
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter((item: FlowinEvent) => ((item as any).nom ?? '').toLowerCase().includes(q))
  }, [base, search])

  const groupes = useMemo(() => {
    const g: Record<string, (FlowinEvent & Record<string, unknown>)[]> = {}
    for (const ev of list as (FlowinEvent & Record<string, unknown>)[]) {
      const s = String(ev.status ?? 'past')
      if (!g[s]) g[s] = []
      g[s].push(ev)
    }
    return Object.entries(g).sort((a, b) => (ORDRE_STATUT[a[0]] ?? 9) - (ORDRE_STATUT[b[0]] ?? 9))
  }, [list])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="📅 Events" subtitle={`${list.length} résultat${list.length > 1 ? 's' : ''}`} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher…" />
          <button className={`sa-btn sm${cacherDemo ? ' primary' : ''}`} onClick={() => setCacherDemo(v => !v)}>
            {cacherDemo ? '✓ Démos masquées' : 'Afficher les démos'}
          </button>
        </div>

        {list.length === 0 && <EmptyState title="Aucun résultat" />}

        {groupes.map(([statut, liste]) => (
          <div key={statut} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 10, color: 'var(--sa-muted)' }}>
              {TITRES[statut] ?? statut} ({liste.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {liste.map(ev => {
                const pro = pros.find(p => p.id === ev.pro_id)
                return (
                  <div
                    key={String(ev.id)}
                    onClick={() => openDrawer('event', String(ev.id))}
                    style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: 14, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <ModuleChip module={String(ev.module ?? '')} />
                      <button className="sa-btn icon sm" title="Éditer" onClick={e => { e.stopPropagation(); openDrawerEdit('event', String(ev.id)) }}>✏</button>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{String(ev.nom ?? '—')}</div>
                    {pro && <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginBottom: 6 }}>{pro.nom}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--sa-muted)' }}>
                      <span>👥 {String(ev.participants ?? 0)}</span>
                      <StatusChip status={String(ev.status ?? '')} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
