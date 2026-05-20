'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { KpiCard, StatusChip, ModuleChip } from '@/components/dashboard/DashboardUI'

export default function DashboardPage() {
  const { joueurs, events, partenaires, pros, lots } = useDashboard()

  const liveEvents    = events.filter(e => e.status === 'live')
  const upcomingEvents = events.filter(e => e.status === 'upcoming')
  const totalOptins   = joueurs.filter(j => j.optin).length
  const totalGagnants = joueurs.filter(j => j.gains > 0).length
  const totalLots     = lots.length

  return (
    <div className="sa-content">
      {/* KPIs globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="sa-kpi" style={{ borderRadius: 10, border: '1px solid var(--sa-border)' }}>
          <div className="sa-kpi-val">{joueurs.length}</div>
          <div className="sa-kpi-lbl">Joueurs CRM</div>
          <div className="sa-kpi-sub">{totalOptins} opt-in · {totalGagnants} gagnants</div>
        </div>
        <div className="sa-kpi" style={{ borderRadius: 10, border: '1px solid var(--sa-border)' }}>
          <div className="sa-kpi-val">{events.length}</div>
          <div className="sa-kpi-lbl">Events</div>
          <div className="sa-kpi-sub">{liveEvents.length} en cours · {upcomingEvents.length} à venir</div>
        </div>
        <div className="sa-kpi" style={{ borderRadius: 10, border: '1px solid var(--sa-border)' }}>
          <div className="sa-kpi-val">{partenaires.length}</div>
          <div className="sa-kpi-lbl">Partenaires</div>
          <div className="sa-kpi-sub">{totalLots} lots · {pros.length} pros</div>
        </div>
        <div className="sa-kpi" style={{ borderRadius: 10, border: '1px solid var(--sa-border)' }}>
          <div className="sa-kpi-val">{totalOptins}</div>
          <div className="sa-kpi-lbl">Opt-in newsletter</div>
          <div className="sa-kpi-sub">{joueurs.length ? Math.round(totalOptins / joueurs.length * 100) : 0}% de taux</div>
        </div>
      </div>

      {/* Events en cours */}
      {liveEvents.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            {liveEvents.length} event{liveEvents.length > 1 ? 's' : ''} en cours
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {liveEvents.map(ev => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        </div>
      )}

      {/* Events à venir */}
      {upcomingEvents.length > 0 && (
        <div>
          <div style={{ fontWeight: 800, marginBottom: 10, color: 'var(--sa-muted)' }}>
            📅 {upcomingEvents.length} event{upcomingEvents.length > 1 ? 's' : ''} à venir
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {upcomingEvents.slice(0, 4).map(ev => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        </div>
      )}

      {liveEvents.length === 0 && upcomingEvents.length === 0 && (
        <div className="sa-page" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun event actif</div>
          <div style={{ color: 'var(--sa-muted)', fontSize: 13 }}>
            Créez votre premier event depuis la section Events.
          </div>
        </div>
      )}
    </div>
  )
}

function EventCard({ ev }: { ev: { id: string; nom: string; status: string; module: string; date_d?: string | null; participants: number; couleur: string } }) {
  const { openDrawer } = useDashboard()
  return (
    <div
      className="sa-page"
      style={{ padding: 16, cursor: 'pointer', borderLeft: `4px solid ${ev.couleur ?? '#7C2D92'}` }}
      onClick={() => openDrawer('event', ev.id, 'infos')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <StatusChip status={ev.status} />
        <ModuleChip module={ev.module} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{ev.nom}</div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--sa-muted)' }}>
        <span>👥 {ev.participants} participants</span>
        {ev.date_d && <span>📅 {new Date(ev.date_d).toLocaleDateString('fr-FR')}</span>}
      </div>
    </div>
  )
}
