'use client'

/**
 * Dashboard Pro — Mes events (kanban par date).
 * Branche sur les vrais events (fetchAllEvents). Statut deduit des dates (comme super-events SA) :
 * À venir / En cours / Terminé. Lecture seule.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { fetchAllEvents } from '@/lib/dashboard'
import type { FlowinEvent } from '@/lib/types'

function statutReel(e: FlowinEvent): 'a_venir' | 'en_cours' | 'passe' {
  if (!e.date_d) return 'a_venir'
  const j = new Date(); j.setHours(0, 0, 0, 0)
  const d = new Date(e.date_d); d.setHours(0, 0, 0, 0)
  const f = new Date(e.date_f ?? e.date_d); f.setHours(23, 59, 59, 999)
  if (f < j) return 'passe'
  if (d > j) return 'a_venir'
  return 'en_cours'
}

const COLS = [
  { k: 'a_venir' as const, label: 'À venir', dot: '#4F5BD5' },
  { k: 'en_cours' as const, label: 'En cours', dot: '#15803D' },
  { k: 'passe' as const, label: 'Terminé', dot: '#CBD5E1' },
]

export default function ProEventsPage() {
  const [events, setEvents] = useState<FlowinEvent[]>([])
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    fetchAllEvents().then(setEvents).catch(() => setEvents([])).finally(() => setCharge(false))
  }, [])

  const parCol = useMemo(() => {
    const m: Record<string, FlowinEvent[]> = { a_venir: [], en_cours: [], passe: [] }
    events.forEach(e => { m[statutReel(e)].push(e) })
    return m
  }, [events])

  const fmt = (e: FlowinEvent) => {
    if (!e.date_d) return '—'
    const d = new Date(e.date_d)
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
    const s = d.toLocaleDateString('fr-FR', opts)
    if (e.date_f && e.date_f !== e.date_d) return `${s} → ${new Date(e.date_f).toLocaleDateString('fr-FR', opts)}`
    return s
  }

  const kcol: React.CSSProperties = { background: 'var(--sa-subtle,#F8FAFC)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 14, padding: 12, minHeight: 200 }
  const kcard: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 11, padding: '11px 12px', marginBottom: 9 }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Mes events" subtitle="Vos campagnes classées par période — À venir / En cours / Terminé (données réelles)" />

        {charge ? <div className="sa-muted" style={{ fontSize: 13 }}>Chargement des events…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
            {COLS.map(c => (
              <div key={c.k} style={kcol}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sa-muted,#64748B)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} /> {c.label} <span style={{ marginLeft: 'auto' }}>{parCol[c.k].length}</span>
                </div>
                {parCol[c.k].length === 0 ? <div className="sa-muted" style={{ fontSize: 12 }}>—</div> : parCol[c.k].map(e => (
                  <div key={e.id} style={kcard}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{e.nom || 'Sans nom'}{e.super_event_id ? <span style={{ fontSize: 10, fontWeight: 800, color: '#EA580C', marginLeft: 6 }}>SUPER</span> : null}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--sa-muted,#64748B)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{String(e.module ?? '')}</span>
                      <span>{fmt(e)}</span>
                      {e.participants ? <span>{e.participants} joueurs</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
