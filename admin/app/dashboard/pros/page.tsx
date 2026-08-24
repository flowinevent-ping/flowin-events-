'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, StatusChip, ModuleChip, EmptyState } from '@/components/dashboard/DashboardUI'
import { upsertPro } from '@/lib/dashboard'
import type { FlowinPro } from '@/lib/types'

const STATUT_STYLE: Record<string, { bg: string; c: string; label: string }> = {
  en_attente: { bg: '#FEF3C7', c: '#92400E', label: 'En attente' },
  valide: { bg: '#DCFCE7', c: '#166534', label: 'Validé' },
  refuse: { bg: '#FEE2E2', c: '#991B1B', label: 'Refusé' },
}

export default function Page() {
  const { pros, setPros, openDrawer, openDrawerEdit } = useDashboard()
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<'tous' | 'en_attente'>('tous')
  const [enCours, setEnCours] = useState<string | null>(null)
  const [tri, setTri] = useState<{ champ: keyof FlowinPro; sens: 1 | -1 }>({ champ: 'nom', sens: 1 })

  function trierPar(champ: keyof FlowinPro) {
    setTri(t => t.champ === champ ? { champ, sens: t.sens === 1 ? -1 : 1 } : { champ, sens: 1 })
  }
  function Th({ champ, children }: { champ: keyof FlowinPro; children: React.ReactNode }) {
    const actif = tri.champ === champ
    return (
      <th onClick={() => trierPar(champ)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        {children} <span style={{ opacity: actif ? 1 : 0.25, fontSize: 10 }}>{actif && tri.sens === -1 ? '▲' : '▼'}</span>
      </th>
    )
  }

  const nbEnAttente = pros.filter((p: FlowinPro) => p.statut === 'en_attente').length

  const base = filtre === 'en_attente' ? pros.filter((p: FlowinPro) => p.statut === 'en_attente') : pros

  const list = useMemo(() => {
    let l = base
    if (search.trim()) {
      const q = search.toLowerCase()
      l = l.filter((item: FlowinPro) => ((item as any).nom ?? "").toLowerCase().includes(q) || ((item as any).ville ?? "").toLowerCase().includes(q) || ((item as any).secteur ?? "").toLowerCase().includes(q))
    }
    return [...l].sort((a: any, b: any) => {
      const va = String(a[tri.champ] ?? ''); const vb = String(b[tri.champ] ?? '')
      return va.localeCompare(vb, 'fr') * tri.sens
    })
  }, [base, search, tri])

  async function traiter(id: string, statut: 'valide' | 'refuse') {
    setEnCours(id)
    const ok = await upsertPro({ id, statut })
    if (ok) setPros(pros.map((p: FlowinPro) => p.id === id ? { ...p, statut } : p))
    setEnCours(null)
  }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🏢 Pros"
          subtitle={`${list.length} résultat${list.length > 1 ? "s" : ""}${nbEnAttente ? ` · ${nbEnAttente} en attente de validation` : ''}`}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className={filtre === 'tous' ? 'sa-btn sm primary' : 'sa-btn sm'} onClick={() => setFiltre('tous')}>Tous</button>
          <button className={filtre === 'en_attente' ? 'sa-btn sm primary' : 'sa-btn sm'} onClick={() => setFiltre('en_attente')}>
            En attente {nbEnAttente > 0 && `(${nbEnAttente})`}
          </button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher…" />
        <div style={{overflowX:'auto'}}>
          <table className="sa-tbl" style={{width:'100%'}}>
            <thead><tr>
              <th className="col-check"><input type="checkbox" /></th>
              <Th champ="nom">Pro</Th><Th champ="ville">Ville</Th><Th champ="secteur">Secteur</Th><Th champ="contact">Contact</Th><Th champ="email">Email</Th><Th champ="statut">Statut</Th>
              <th className="col-actions"></th>
            </tr></thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={8} style={{padding:0}}>
                  <EmptyState title="Aucun résultat" />
                </td></tr>
              )}
              {list.map((item: FlowinPro) => {
                const st = STATUT_STYLE[item.statut ?? 'valide'] ?? STATUT_STYLE.valide
                return (
                <tr key={(item as any).id} onClick={() => openDrawer('pro', (item as any).id)}>
                  <td className="col-check" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  <td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPro & Record<string,unknown>)["nom"] ?? "—")}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPro & Record<string,unknown>)["ville"] ?? "—")}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPro & Record<string,unknown>)["secteur"] ?? "—")}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPro & Record<string,unknown>)["contact"] ?? "—")}</td><td style={{color:"var(--sa-muted)",fontSize:13}}>{String((item as FlowinPro & Record<string,unknown>)["email"] ?? "—")}</td>
                  <td><span style={{ background: st.bg, color: st.c, fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>{st.label}</span></td>
                  <td className="col-actions" onClick={e => e.stopPropagation()}>
                    <div className="sa-row-actions" style={{ display: 'flex', gap: 6 }}>
                      {item.statut === 'en_attente' && (
                        <>
                          <button className="sa-btn sm" disabled={enCours === item.id} onClick={() => traiter(item.id, 'valide')} style={{ background: '#166534', color: '#fff' }}>Valider</button>
                          <button className="sa-btn sm" disabled={enCours === item.id} onClick={() => traiter(item.id, 'refuse')}>Refuser</button>
                        </>
                      )}
                      <button className="sa-btn icon sm" title="Éditer" onClick={(e) => { e.stopPropagation(); openDrawerEdit('pro', (item as any).id) }}>✏</button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
