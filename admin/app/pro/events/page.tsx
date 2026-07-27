import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB } from '@/lib/proui'
import type { FlowinEvent } from '@/lib/types'

function statut(e: FlowinEvent): 'a_venir' | 'en_cours' | 'passe' {
  if (!e.date_d) return 'a_venir'
  const j = new Date(); j.setHours(0, 0, 0, 0)
  const d = new Date(e.date_d); d.setHours(0, 0, 0, 0)
  const f = new Date(e.date_f ?? e.date_d); f.setHours(23, 59, 59, 999)
  if (f < j) return 'passe'; if (d > j) return 'a_venir'; return 'en_cours'
}
const COLS = [{ k: 'a_venir', label: 'À venir', dot: '#4F5BD5' }, { k: 'en_cours', label: 'En cours', dot: '#15803D' }, { k: 'passe', label: 'Terminé', dot: '#CBD5E1' }] as const

export default async function ProEventsPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const m: Record<string, FlowinEvent[]> = { a_venir: [], en_cours: [], passe: [] }
  data.events.forEach(e => m[statut(e)].push(e))
  const fmt = (e: FlowinEvent) => {
    if (!e.date_d) return '—'
    const o: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
    const s = new Date(e.date_d).toLocaleDateString('fr-FR', o)
    return e.date_f && e.date_f !== e.date_d ? `${s} → ${new Date(e.date_f).toLocaleDateString('fr-FR', o)}` : s
  }
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="events">
      <h1 style={H1}>Mes events</h1><div style={{ ...SUB, marginBottom: 18 }}>Vos campagnes classées par période.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        {COLS.map(c => (
          <div key={c.k} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 12, minHeight: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} /> {c.label} <span style={{ marginLeft: 'auto' }}>{m[c.k].length}</span>
            </div>
            {m[c.k].length === 0 ? <div style={{ fontSize: 12, ...MUTED }}>—</div> : m[c.k].map(e => (
              <div key={e.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 11, padding: '11px 12px', marginBottom: 9 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.nom || 'Sans nom'}{e.super_event_id ? <span style={{ fontSize: 10, fontWeight: 800, color: '#EA580C', marginLeft: 6 }}>SUPER</span> : null}</div>
                <div style={{ fontSize: 11.5, ...MUTED, marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{String(e.module ?? '')}</span><span>{fmt(e)}</span>{e.participants ? <span>{e.participants} joueurs</span> : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ProShell>
  )
}
