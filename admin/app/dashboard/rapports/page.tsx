'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader } from '@/components/dashboard/DashboardUI'

export default function RapportsPage() {
  const { joueurs, events, partenaires, lots } = useDashboard()

  const stats = [
    { label: 'Total joueurs', value: joueurs.length },
    { label: 'Joueurs opt-in', value: joueurs.filter(j => j.optin).length },
    { label: 'Taux opt-in', value: joueurs.length ? Math.round(joueurs.filter(j => j.optin).length / joueurs.length * 100) + '%' : '—' },
    { label: 'Gagnants', value: joueurs.filter(j => j.gains > 0).length },
    { label: 'Total events', value: events.length },
    { label: 'Events live', value: events.filter(e => e.status === 'live').length },
    { label: 'Events passés', value: events.filter(e => e.status === 'past').length },
    { label: 'Partenaires actifs', value: partenaires.filter(p => p.actif !== false).length },
    { label: 'Lots disponibles', value: lots.filter(l => !l.retire).length },
    { label: 'Valeur lots', value: lots.reduce((s, l) => s + (l.valeur ?? 0) * (l.quantite ?? 1), 0) + ' €' },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="📊 Rapports" subtitle="Statistiques globales Flowin" />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} className="sa-kpi" style={{ borderRadius: 10, border: '1px solid var(--sa-border)' }}>
              <div className="sa-kpi-val">{s.value}</div>
              <div className="sa-kpi-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
