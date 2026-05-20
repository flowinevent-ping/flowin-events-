'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, ModuleChip, StatusChip } from '@/components/dashboard/DashboardUI'

const MODULES = [
  { id: 'tombola', icon: '🎟️', name: 'Tombola', desc: 'Inscription CRM + tirage au sort' },
  { id: 'quiz', icon: '🧠', name: 'Quiz', desc: 'QCM avec bonus + 2 tickets' },
  { id: 'quizmaster', icon: '🎮', name: 'Quiz Master', desc: 'Quiz en direct sur grand écran' },
  { id: 'quizsolo', icon: '⏱️', name: 'Quiz Solo', desc: 'Quiz timed en autonomie' },
  { id: 'spin', icon: '🎡', name: 'Roue', desc: 'Roue de la fortune' },
  { id: 'vote', icon: '⭐', name: 'Vote', desc: 'Vote artistes / produits' },
]

export default function JeuxPage() {
  const { events, openDrawer } = useDashboard()

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="🎮 Jeux" subtitle="6 modules disponibles dans Flowin" />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {MODULES.map(m => {
            const moduleEvents = events.filter(e => e.module === m.id)
            const live = moduleEvents.filter(e => e.status === 'live')
            return (
              <div key={m.id} style={{ background: 'var(--sa-subtle)', borderRadius: 12, padding: 20, border: '1px solid var(--sa-border)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 12 }}>{m.desc}</div>
                <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                  <ModuleChip module={m.id} />
                  {live.length > 0 && <StatusChip status="live" />}
                </div>
                {moduleEvents.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--sa-muted)' }}>
                    {moduleEvents.length} event{moduleEvents.length > 1 ? 's' : ''} associé{moduleEvents.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
