'use client'

/**
 * Animations (ex-"Events") — reorganise en kanban par pro, demande explicite
 * de Romain (25/08) : la liste plate groupee uniquement par statut etait
 * illisible (stations NDS et animations boutique melangees sans reperes).
 *
 * REGLE CONFIRMEE avec Romain (25/08, apres clarification explicite -- "ce
 * qui est bon dans Super Event n'existe pas dans Anim, point") : EXCLUSIVITE
 * STRICTE A L'AFFICHAGE. Un event rattache a un super event (super_event_id
 * non nul, ex. toutes les stations NDS 2026) n'apparait JAMAIS ici, seulement
 * dans /dashboard/super-events. Seuls les events SANS super_event_id (ex.
 * "Fetes de Paques 2026", animations boutique hors festival) apparaissent
 * dans cette page. La donnee en base reste inchangee (pro_id + super_event_id
 * peuvent toujours coexister sur un event) -- seul le FILTRE D'AFFICHAGE de
 * cette page applique l'exclusivite, pas une contrainte structurelle.
 */
import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'
import type { FlowinEvent } from '@/lib/types'

type EtatAnim = 'live' | 'upcoming' | 'past' | 'archived'
const COLONNES: { cle: EtatAnim; titre: string }[] = [
  { cle: 'live', titre: '🔴 Active' },
  { cle: 'upcoming', titre: '📅 À venir' },
  { cle: 'past', titre: '✅ Passée' },
  { cle: 'archived', titre: '🗄️ Archivée' },
]

export default function Page() {
  const { events, pros, openDrawer, openDrawerEdit } = useDashboard()
  const [search, setSearch] = useState('')
  const [cacherDemo, setCacherDemo] = useState(true)
  const [ouvert, setOuvert] = useState<string | null>(null)

  const base = useMemo(() => {
    let l = events.filter((e: FlowinEvent & Record<string, unknown>) => !e.super_event_id)
    if (cacherDemo) {
      l = l.filter((e: FlowinEvent & Record<string, unknown>) =>
        !(e.pro_id === null && String(e.nom ?? '').startsWith('Démo')))
    }
    return l
  }, [events, cacherDemo])

  const list = useMemo(() => {
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter((item: FlowinEvent) => ((item as any).nom ?? '').toLowerCase().includes(q))
  }, [base, search])

  /* Groupement par pro (vignette), animations de chaque pro triees par statut
     a l'interieur -- meme pattern que /dashboard/super-events (carte depliable
     -> mini-kanban), pour rester coherent avec ce qui existe deja. */
  const parPro = useMemo(() => {
    const g = new Map<string, (FlowinEvent & Record<string, unknown>)[]>()
    for (const ev of list as (FlowinEvent & Record<string, unknown>)[]) {
      const pid = String(ev.pro_id ?? '—')
      if (!g.has(pid)) g.set(pid, [])
      g.get(pid)!.push(ev)
    }
    return Array.from(g.entries())
      .map(([pid, animations]) => ({ pro: pros.find(p => p.id === pid), pid, animations }))
      .sort((a, b) => b.animations.length - a.animations.length)
  }, [list, pros])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="🎬 Animations" subtitle={`${list.length} animation${list.length > 1 ? 's' : ''} · ${parPro.length} pro${parPro.length > 1 ? 's' : ''} — hors super events (voir Super Events pour les stations NDS)`} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher…" />
          <button className={`sa-btn sm${cacherDemo ? ' primary' : ''}`} onClick={() => setCacherDemo(v => !v)}>
            {cacherDemo ? '✓ Démos & template masqués' : 'Afficher démos & template'}
          </button>
        </div>

        {list.length === 0 && <EmptyState title="Aucun résultat" />}

        {parPro.map(({ pro, pid, animations }) => {
          const parStatut = (statut: EtatAnim) => animations.filter(a => String(a.status ?? 'past') === statut)
          const enCours = parStatut('live').length
          return (
            <div key={pid} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 14.5 }}>{pro?.nom ?? pid}</b>
                {enCours > 0 && <span className="sa-chip live" style={{ fontSize: 10 }}>🔴 {enCours} en cours</span>}
                <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>{animations.length} animation{animations.length > 1 ? 's' : ''}</span>
                <button className="sa-btn sm" style={{ marginLeft: 'auto' }} onClick={() => setOuvert(ouvert === pid ? null : pid)}>
                  {ouvert === pid ? 'Masquer' : 'Voir le détail'}
                </button>
              </div>

              {ouvert === pid && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--sa-border)' }}>
                  {COLONNES.map(col => {
                    const cardsCol = parStatut(col.cle)
                    return (
                      <div key={col.cle}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--sa-muted)', marginBottom: 6 }}>{col.titre} ({cardsCol.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {cardsCol.length === 0 && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>—</div>}
                          {cardsCol.map(ev => (
                            <div
                              key={String(ev.id)}
                              onClick={() => openDrawer('event', String(ev.id))}
                              style={{ background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', position: 'relative' }}
                            >
                              <div style={{ fontWeight: 700, fontSize: 12 }}>{String(ev.nom ?? '—')}</div>
                              <div style={{ fontSize: 10, color: 'var(--sa-muted)' }}>👥 {String(ev.participants ?? 0)}</div>
                              <button
                                className="sa-btn icon sm"
                                title="Éditer"
                                onClick={e => { e.stopPropagation(); openDrawerEdit('event', String(ev.id)) }}
                                style={{ position: 'absolute', top: 5, right: 5, opacity: 0.6 }}
                              >✏</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
