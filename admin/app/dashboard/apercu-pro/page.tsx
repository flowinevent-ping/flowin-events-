'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'

/**
 * Apercu Pro -- remplace le simulateur "Voir comme -> PRO" du monolithe (state.mode='pro' dans
 * public/dashboard.html), explicitement juge obsolete par Romain (design different, jamais a jour
 * avec le vrai travail, source de confusions repetees cette session).
 *
 * Deux blocs :
 * 1. Prototype de validation -- flowin-pro-navigation.html (deja construit et tenu a jour cette
 *    session), navigation en onglets, bascule desktop/tablette/mobile, pour valider une maquette
 *    AVANT de la porter dans le vrai code.
 * 2. Liste reelle des pros (table `pros`, deja chargee par le layout SA / DashboardContext) --
 *    chaque ligne ouvre directement le VRAI dashboard Next.js de ce pro (/pro?pro=<id>), pas une
 *    simulation.
 */
export default function Page() {
  const { pros } = useDashboard()
  const [search, setSearch] = useState('')

  const list = useMemo(() => {
    const base = [...pros].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(p => (p.nom ?? '').toLowerCase().includes(q) || (p.ville ?? '').toLowerCase().includes(q) || (p.id ?? '').toLowerCase().includes(q))
  }, [pros, search])

  return (
    <div className="sa-content">
      <div className="sa-page" style={{ marginBottom: 16 }}>
        <PageHeader title="👁 Aperçu Pro" subtitle="Prototype de validation + accès direct aux vrais dashboards partenaires" />
        <div style={{ padding: '0 24px 20px' }}>
          <a
            href="/schemas/flowin-pro-navigation.html"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
              background: 'linear-gradient(135deg,#FBEAF0,#fff)', border: '1px solid #F4C0D5',
              borderRadius: 12, padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: 22 }}>🧭</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#9F1A4D' }}>Prototype navigable — desktop / tablette / mobile</div>
              <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginTop: 2 }}>
                Onglets cliquables, données réelles, pour valider un parcours avant de le porter dans le code. Ne remplace pas les vrais dashboards ci-dessous.
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9F1A4D', flexShrink: 0 }}>Ouvrir →</span>
          </a>
        </div>
      </div>

      <div className="sa-page">
        <PageHeader title="🤝 Dashboards des pros" subtitle={`${list.length} compte${list.length > 1 ? 's' : ''} — ouvre le vrai dashboard Next.js, en direct`} />
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un pro (nom, ville, id)…" />
        <div style={{ padding: '0 24px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {list.length === 0 && <EmptyState title="Aucun résultat" />}
          {list.map(p => (
            <a
              key={p.id}
              href={`/pro?pro=${encodeURIComponent(p.id)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none', color: 'inherit', border: '1px solid var(--sa-border)',
                borderRadius: 12, padding: '13px 14px', background: 'var(--sa-card)',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13.5 }}>{p.nom || 'Sans nom'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>{p.ville || '—'} · {p.secteur || '—'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--sa-muted)', fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>{p.id}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7C2D92', marginTop: 6 }}>Ouvrir le dashboard →</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
