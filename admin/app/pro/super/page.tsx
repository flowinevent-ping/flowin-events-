import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import SuperEventMap from '@/app/se/_components/SuperEventMap'
import { CARD, TH, TD, MUTED, H1, SUB, ACC } from '@/lib/proui'

export default async function ProSuperPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const evIds = data.events.map(e => e.id)
  const seId = data.events.find(e => e.super_event_id)?.super_event_id ?? null

  let lieux: any[] = []
  if (evIds.length) {
    const { data: lieuxRes } = await supabase
      .from('events')
      .select('id,nom,module,lat,lng,couleur,gain_immediat,gain_ticket,adresse,description,categorie,tel,site_web,photo_url,horaires')
      .in('id', evIds)
    lieux = lieuxRes ?? []
  }

  const joueurs = data.joueurs.length
  const parties = data.events.reduce((s, e) => s + (e.participants ?? 0), 0)
  const stations = data.events
  const tri = data.events.slice().sort((a, b) => (b.participants ?? 0) - (a.participants ?? 0))
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const hk = (v: React.ReactNode, k: string) => <div style={{ flex: 1, minWidth: 90 }}><div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>{v}</div><div style={{ fontSize: 11.5, opacity: 0.9 }}>{k}</div></div>
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="super">
      <h1 style={H1}>Ma participation{seId ? ' — Nuits du Sud 2026' : ''}</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>Vous ne voyez ici que vos propres stations. Le bilan global du super event est réservé à l'organisateur (Super Admin).</div>
      <div style={{ borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, background: 'linear-gradient(135deg,#FF8A14 0%,#EA580C 55%,#C2410C 100%)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9 }}>MA PARTICIPATION · BILAN</div>
        <div style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 14px' }}>{data.pro?.nom ?? 'Mon établissement'}</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>{hk(joueurs, 'mes joueurs')}{hk(parties, 'parties')}{hk(stations.length, 'mes stations')}</div>
      </div>
      <style>{`@media (max-width:820px){.pro-map-wrap{display:none !important}}`}</style>
      <div className="pro-map-wrap" style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>Mes stations sur la carte</div>
          <div style={{ ...SUB, marginBottom: 10 }}>Même carte, même source que le Super Admin — vos points uniquement. Affichage ordinateur.</div>
        </div>
        <div style={{ height: 360 }}>
          <SuperEventMap lieux={lieux as any} mode="vitrine" height="100%" showPosition={false} />
        </div>
      </div>
      <div style={{ ...CARD, overflowX: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Mes stations</div>
        {tri.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune station.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead><tr><th style={TH}>Station</th><th style={TH}>Joueurs</th><th style={TH}>Parties</th></tr></thead>
            <tbody>{tri.map(e => (<tr key={e.id}><td style={TD}><b>{e.nom}</b></td><td style={TD}>{e.participants ?? 0}</td><td style={{ ...TD, ...MUTED }}>{e.participants ?? 0}</td></tr>))}</tbody>
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
