import { fetchProDashboard } from '@/lib/pro'
import { fetchTrackQr, libelleSource } from '@/lib/nds'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB, ACC, kpiGrid } from '@/lib/proui'

export default async function ProTrackingPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, t] = await Promise.all([fetchProDashboard(proId), fetchTrackQr()])
  const origines = (t?.origines ?? []).slice().sort((a, b) => b.visiteurs - a.visiteurs)
  const max = Math.max(1, ...origines.map(o => o.visiteurs))
  const totalVis = t?.total_visiteurs ?? origines.reduce((s, o) => s + o.visiteurs, 0)
  const direct = origines.find(o => o.source === 'direct')?.visiteurs ?? 0
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="tracking">
      <h1 style={H1}>Tracking liens &amp; QR</h1><div style={SUB}>D&apos;où viennent vos joueurs — quel canal rapporte le plus.</div>
      <div style={{ ...kpiGrid(), marginTop: 16 }}>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900, color: ACC }}>{totalVis}</div><div style={{ fontSize: 12, ...MUTED }}>visiteurs uniques</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{direct}</div><div style={{ fontSize: 12, ...MUTED }}>accès direct (QR / lien)</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{origines.filter(o => o.source.startsWith('reseaux')).length}</div><div style={{ fontSize: 12, ...MUTED }}>canaux partenaires</div></div>
      </div>
      <div style={CARD}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 14 }}>Par source</div>
        {origines.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune donnée de trafic.</div> : origines.map((o, i) => (
          <div key={o.source} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11, fontSize: 13 }}>
            <span style={{ flex: 1, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? ACC : 'inherit' }}>{libelleSource(o.source)}</span>
            <span style={{ width: 120, height: 8, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.max(3, Math.round(o.visiteurs / max * 100))}%`, background: `linear-gradient(90deg,#A855F7,${ACC})`, borderRadius: 99 }} /></span>
            <span style={{ fontWeight: 800, minWidth: 40, textAlign: 'right' }}>{o.visiteurs}</span>
          </div>
        ))}
      </div>
    </ProShell>
  )
}
