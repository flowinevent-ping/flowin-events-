'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, ModuleChip, StatusChip } from '@/components/dashboard/DashboardUI'
import ParcoursMobil from '@/components/pro/ParcoursMobil'
import {
  GABARIT_MODULE, GABARIT_NOM, GABARIT_DESC,
  deroulePour, reglesPour, BLOCS_MULTISTATION,
} from '@/lib/gabarit'

const MODULES = [
  /* Le gabarit de reference, tire de NDS 2026 (voir lib/gabarit.ts). Il est en
     tete parce que c est celui a partir duquel on cree, plutot que de repartir
     de zero. Son identifiant en base est `nds2026` — inchange, ce sont les
     events du festival. */
  { id: GABARIT_MODULE, icon: '🎯', name: GABARIT_NOM, desc: GABARIT_DESC, gabarit: true },
  { id: 'tombola', icon: '🎟️', name: 'Tombola', desc: 'Inscription CRM + tirage au sort' },
  { id: 'quiz', icon: '🧠', name: 'Quiz', desc: 'QCM avec bonus + 2 tickets' },
  { id: 'quizmaster', icon: '🎮', name: 'Quiz Master', desc: 'Quiz en direct sur grand écran' },
  { id: 'quizsolo', icon: '⏱️', name: 'Quiz Solo', desc: 'Quiz timed en autonomie' },
  { id: 'spin', icon: '🎡', name: 'Roue', desc: 'Roue de la fortune' },
  { id: 'vote', icon: '⭐', name: 'Vote', desc: 'Vote artistes / produits' },
]

/* Le deroule et les regles du gabarit, aux deux portees. Une seule source :
   lib/gabarit.ts — la meme que lit le parcours de creation. */
function FicheGabarit() {
  const [portee, setPortee] = useState<'super' | 'event'>('super')
  const multi = portee === 'super'
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--sa-border)', paddingTop: 14 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          Portée
        </span>
        <button className={`sa-btn sm${multi ? ' primary' : ''}`} onClick={() => setPortee('super')}>Super event · multi-stations</button>
        <button className={`sa-btn sm${!multi ? ' primary' : ''}`} onClick={() => setPortee('event')}>Event · station seule</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)', gap: 18 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>Le déroulé</div>
          {deroulePour(multi).map((e, i) => (
            <div key={e.ecran} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
              <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: 'var(--sa-accent)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800 }}>{e.titre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', lineHeight: 1.45 }}>{e.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>Les règles</div>
          {reglesPour(multi).map(r => (
            <div key={r.titre} style={{ padding: '7px 0', borderBottom: '1px solid var(--sa-border)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>{r.titre}</div>
              <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', lineHeight: 1.45 }}>{r.texte}</div>
            </div>
          ))}
          {!multi && (
            <div className="sa-alert info" style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.5 }}>
              Une station seule n’a rien à cumuler : {BLOCS_MULTISTATION.join(', ')} ne
              font pas partie de son parcours. Tout le reste est identique.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JeuxPage() {
  const { events, openDrawer } = useDashboard()
  const [ouvert, setOuvert] = useState<string | null>(null)

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="🎮 Jeux" subtitle="Le gabarit de référence et les modules — cliquer une carte affiche son déroulé et ses events" />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {MODULES.map(m => {
            const moduleEvents = events.filter(e => e.module === m.id)
            const live = moduleEvents.filter(e => e.status === 'live')
            const actif = ouvert === m.id
            return (
              <div
                key={m.id}
                onClick={() => setOuvert(actif ? null : m.id)}
                style={{ background: 'var(--sa-subtle)', borderRadius: 12, padding: 20, border: actif ? '2px solid var(--sa-accent)' : '1px solid var(--sa-border)', cursor: 'pointer', gridColumn: actif ? 'span 3' : undefined }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 12 }}>{m.desc}</div>
                <div style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                  <ModuleChip module={m.id} />
                  {live.length > 0 && <StatusChip status="live" />}
                </div>
                {moduleEvents.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--sa-muted)' }}>
                    {moduleEvents.length} event{moduleEvents.length > 1 ? 's' : ''} associé{moduleEvents.length > 1 ? 's' : ''} — {actif ? 'toucher pour refermer' : 'toucher pour voir'}
                  </div>
                )}
                {actif && m.gabarit && (
                  <div onClick={e => e.stopPropagation()}><FicheGabarit /></div>
                )}
                {actif && (
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--sa-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {moduleEvents.length === 0 && <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>Aucun event sur ce module.</div>}
                    {moduleEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => openDrawer('event', ev.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 12.5 }}>{ev.nom}</span>
                        <StatusChip status={ev.status} />
                      </div>
                    ))}
                  </div>
                )}
                {actif && moduleEvents.length > 0 && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--sa-border)', paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
                      👁 Aperçu navigable — le vrai parcours joueur
                    </div>
                    <ParcoursMobil
                      events={moduleEvents.map(ev => ({ id: ev.id, module: ev.module, nom: ev.nom }))}
                      seId={moduleEvents.find(ev => ev.super_event_id)?.super_event_id ?? undefined}
                      showTitle={false}
                    />
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
