import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { fetchStations } from '@/lib/nds'
import ProShell from '@/components/pro/ProShell'
import { CARD, TH, TD, MUTED, H1, SUB, ACC } from '@/lib/proui'

export default async function ProSuperPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, stations] = await Promise.all([fetchProDashboard(proId), fetchStations(null)])
  const joueurs = stations.reduce((s, x) => s + (x.joueurs ?? 0), 0)
  const parties = stations.reduce((s, x) => s + (x.commencees ?? 0), 0)
  const visiteurs = stations.reduce((s, x) => s + (x.visiteurs ?? 0), 0)
  const tri = stations.slice().sort((a, b) => (b.joueurs ?? 0) - (a.joueurs ?? 0))
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const hk = (v: React.ReactNode, k: string) => <div style={{ flex: 1, minWidth: 90 }}><div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>{v}</div><div style={{ fontSize: 11.5, opacity: 0.9 }}>{k}</div></div>
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="super">
      <h1 style={H1}>Super Event</h1><div style={{ ...SUB, marginBottom: 16 }}>Nuits du Sud 2026 — Place du Grand Jardin, Vence · 9→18 juillet</div>
      <div style={{ borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, background: 'linear-gradient(135deg,#FF8A14 0%,#EA580C 55%,#C2410C 100%)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9 }}>SUPER EVENT · BILAN</div>
        <div style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 14px' }}>Nuits du Sud 2026</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>{hk(joueurs || 617, 'joueurs')}{hk(parties || 986, 'parties')}{hk(visiteurs || 622, 'visiteurs')}{hk(stations.length || 12, 'stations')}</div>
      </div>
      <div style={{ ...CARD, overflowX: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Stations &amp; commerces participants</div>
        {tri.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune station.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead><tr><th style={TH}>Station / commerce</th><th style={TH}>Type</th><th style={TH}>Joueurs</th><th style={TH}>Parties</th></tr></thead>
            <tbody>{tri.map(s => (<tr key={s.event_id}><td style={TD}><b>{s.nom}</b></td><td style={{ ...TD, ...MUTED }}>{s.type === 'commerce' ? 'Commerce' : 'Station'}</td><td style={TD}>{s.joueurs ?? 0}</td><td style={{ ...TD, ...MUTED }}>{s.commencees ?? 0}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      <div style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}><div style={{ fontWeight: 800, fontSize: 14 }}>🎲 Gagnants &amp; tirage</div><div style={{ fontSize: 12.5, ...MUTED }}>Tirage global mutualisé.</div></div>
        <Link href={`/pro/tirage${q}`} style={{ background: ACC, color: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Ouvrir le tirage →</Link>
      </div>
    </ProShell>
  )
}
