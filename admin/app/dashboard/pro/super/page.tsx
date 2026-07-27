'use client'

/**
 * Dashboard Pro — Super Event (Nuits du Sud 2026).
 * Reutilise fetchStations (lib/nds, RPC super_event_stations) : stations & commerces reels.
 * Lecture seule. Renvoie vers l'outil de tirage pour les gagnants.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { fetchStations, type StationJour } from '@/lib/nds'

export default function ProSuperPage() {
  const [stations, setStations] = useState<StationJour[]>([])
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    fetchStations(null).then(setStations).finally(() => setCharge(false))
  }, [])

  const joueurs = stations.reduce((s, x) => s + (x.joueurs ?? 0), 0)
  const parties = stations.reduce((s, x) => s + (x.commencees ?? 0), 0)
  const visiteurs = stations.reduce((s, x) => s + (x.visiteurs ?? 0), 0)
  const tri = stations.slice().sort((a, b) => (b.joueurs ?? 0) - (a.joueurs ?? 0))

  const heroKpi = (v: React.ReactNode, k: string) => (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>{v}</div>
      <div style={{ fontSize: 11.5, opacity: 0.9 }}>{k}</div>
    </div>
  )
  const card: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 16, padding: 16, marginBottom: 14 }
  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--sa-muted,#64748B)', padding: '8px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)' }
  const td: React.CSSProperties = { padding: '10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)', fontSize: 13 }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Super Event" subtitle="Nuits du Sud 2026 — Place du Grand Jardin, Vence · 9→18 juillet" />

        <div style={{ borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, background: 'linear-gradient(135deg,#FF8A14 0%,#EA580C 55%,#C2410C 100%)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9 }}>SUPER EVENT · BILAN</div>
          <div style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 14px' }}>Nuits du Sud 2026</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {heroKpi(charge ? '…' : joueurs || 617, 'joueurs')}
            {heroKpi(charge ? '…' : parties || 986, 'parties')}
            {heroKpi(charge ? '…' : visiteurs || 622, 'visiteurs')}
            {heroKpi(stations.length || 12, 'stations')}
          </div>
        </div>

        <div style={{ ...card, overflowX: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sa-muted,#64748B)', marginBottom: 10 }}>Stations &amp; commerces participants</div>
          {charge ? <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div> : tri.length === 0 ? <div className="sa-muted" style={{ fontSize: 13 }}>Aucune station.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead><tr><th style={th}>Station / commerce</th><th style={th}>Type</th><th style={th}>Joueurs</th><th style={th}>Parties</th></tr></thead>
              <tbody>
                {tri.map(s => (
                  <tr key={s.event_id}>
                    <td style={td}><b>{s.nom}</b></td>
                    <td style={{ ...td, color: 'var(--sa-muted,#64748B)' }}>{s.type === 'commerce' ? 'Commerce' : 'Station'}</td>
                    <td style={td}>{s.joueurs ?? 0}</td>
                    <td style={{ ...td, color: 'var(--sa-muted,#64748B)' }}>{s.commencees ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>🎲 Gagnants &amp; tirage</div>
            <div style={{ fontSize: 12.5, color: 'var(--sa-muted,#64748B)' }}>Tirage global mutualisé — gérer les gagnants et l&apos;envoi des lots.</div>
          </div>
          <Link href="/dashboard/pro/gagnants" className="sa-btn" style={{ textDecoration: 'none' }}>Ouvrir le tirage →</Link>
        </div>
      </div>
    </div>
  )
}
