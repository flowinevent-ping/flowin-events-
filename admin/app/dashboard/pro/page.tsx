'use client'

/**
 * Dashboard Pro — espace professionnel (parcours complet navigable).
 * Cette page integre la maquette Pro VALIDEE (desktop + mobile) pour permettre la validation
 * de bout en bout de la navigation pro directement dans le dashboard SA.
 * Portage ecran par ecran en composants Next natifs = etapes suivantes
 * (voir docs/REFONTE-SA-tonalite-graphique.md et la maquette /schemas/flowin-dashboard-pro.html).
 */
import { useState } from 'react'

const DESKTOP = '/schemas/flowin-dashboard-pro.html'
const MOBILE = '/schemas/flowin-pro-mobile.html'

export default function ProDashboardPage() {
  const [vue, setVue] = useState<'desktop' | 'mobile'>('desktop')

  const bar: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '12px 16px', borderBottom: '1px solid var(--sa-border, #E2E8F0)',
    background: 'var(--sa-card, #fff)',
  }
  const seg: React.CSSProperties = {
    display: 'inline-flex', gap: 4, background: 'var(--sa-subtle, #F8FAFC)',
    border: '1px solid var(--sa-border, #E2E8F0)', borderRadius: 10, padding: 4,
  }
  const segBtn = (on: boolean): React.CSSProperties => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
    padding: '7px 14px', borderRadius: 7,
    background: on ? 'var(--sa-accent, #7C2D92)' : 'transparent',
    color: on ? '#fff' : 'var(--sa-muted, #64748B)',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 0px)', minHeight: '80vh' }}>
      <div style={bar}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Dashboard Pro</div>
        <span style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>Parcours pro validé — navigable de bout en bout</span>
        <div style={{ ...seg, marginLeft: 'auto' }}>
          <button style={segBtn(vue === 'desktop')} onClick={() => setVue('desktop')}>🖥️ Desktop</button>
          <button style={segBtn(vue === 'mobile')} onClick={() => setVue('mobile')}>📱 Mobile</button>
        </div>
        <a href={vue === 'desktop' ? DESKTOP : MOBILE} target="_blank" rel="noreferrer"
           style={{ fontSize: 12, fontWeight: 700, color: 'var(--sa-accent,#7C2D92)', textDecoration: 'none' }}>
          Ouvrir en plein écran ↗
        </a>
      </div>

      <div style={{ flex: 1, background: vue === 'mobile' ? '#0b1120' : 'var(--sa-bg,#F1F5F9)', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <iframe
          key={vue}
          src={vue === 'desktop' ? DESKTOP : MOBILE}
          title="Maquette Dashboard Pro"
          style={{
            border: 'none',
            width: vue === 'mobile' ? 430 : '100%',
            height: '100%', minHeight: 640,
            background: 'transparent',
          }}
        />
      </div>
    </div>
  )
}
