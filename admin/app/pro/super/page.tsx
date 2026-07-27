import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { fetchStations } from '@/lib/nds'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import SuperEventMap from '@/app/se/_components/SuperEventMap'
import { Camembert } from '@/components/dashboard/Camembert'
import { CARD, TH, TD, MUTED, H1, SUB, ACC } from '@/lib/proui'

export default async function ProSuperPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const evIds = new Set(data.events.map(e => e.id))
  const seId = data.events.find(e => e.super_event_id)?.super_event_id ?? null

  /* Même RPC que le SA (super_event_stations), filtrée aux seules stations du pro — parité garantie */
  const allStations = seId ? await fetchStations(null, seId) : []
  const myStations = allStations.filter(s => evIds.has(s.event_id))
  const tri = myStations.slice().sort((a, b) => (b.commencees ?? 0) - (a.commencees ?? 0))

  let lieux: any[] = []
  if (evIds.size) {
    const { data: lieuxRes } = await supabase
      .from('events')
      .select('id,nom,module,lat,lng,couleur,gain_immediat,gain_ticket,adresse,description,categorie,tel,site_web,photo_url,horaires')
      .in('id', Array.from(evIds))
    lieux = lieuxRes ?? []
  }

  const joueurs = data.joueurs.length
  const parties = myStations.reduce((s, x) => s + (x.commencees ?? 0), 0)
  const scans = myStations.reduce((s, x) => s + (x.scans ?? 0), 0)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const hk = (v: React.ReactNode, k: string) => <div style={{ flex: 1, minWidth: 90 }}><div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>{v}</div><div style={{ fontSize: 11.5, opacity: 0.9 }}>{k}</div></div>

  const nF = data.joueurs.filter(j => (j as any).genre === 'F').length
  const nH = data.joueurs.filter(j => (j as any).genre === 'H').length
  const sexeParts = [{ valeur: 'Femmes', n: nF }, { valeur: 'Hommes', n: nH }]

  const tranches = ['-18', '18-25', '26-35', '36-50', '51-65', '65+']
  const ageParts = tranches
    .map(t => ({ valeur: t, n: data.joueurs.filter(j => (j as any).age_tranche === t).length }))
    .filter(p => p.n > 0)

  const { data: visites } = evIds.size
    ? await supabase.from('visites').select('source, visiteur_id').in('event_id', Array.from(evIds)).not('visiteur_id', 'is', null)
    : { data: [] as any[] }
  const seen = new Set<string>()
  const origMap = new Map<string, number>()
  ;(visites ?? []).forEach((v: any) => {
    if (seen.has(v.visiteur_id)) return
    seen.add(v.visiteur_id)
    const lbl = v.source === 'parrainage' ? 'Parrainage' : 'Accès direct'
    origMap.set(lbl, (origMap.get(lbl) ?? 0) + 1)
  })
  const origParts = Array.from(origMap.entries()).map(([valeur, n]) => ({ valeur, n }))

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="super">
      <h1 style={H1}>Ma participation{seId ? ' — Nuits du Sud 2026' : ''}</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>Vous ne voyez ici que vos propres stations. Le bilan global du super event est réservé à l'organisateur (Super Admin). Chiffres calculés via la même fonction que le Super Admin (super_event_stations).</div>
      <div style={{ borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, background: 'linear-gradient(135deg,#FF8A14 0%,#EA580C 55%,#C2410C 100%)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9 }}>MA PARTICIPATION · BILAN</div>
        <div style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 14px' }}>{data.pro?.nom ?? 'Mon établissement'}</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>{hk(joueurs, 'mes joueurs')}{hk(parties, 'parties')}{hk(scans, 'flashs QR')}{hk(myStations.length, 'mes stations actives')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 16 }}>
        <Camembert titre="Sexe" parts={sexeParts} unite="joueurs" />
        <Camembert titre="Tranches d'âge" parts={ageParts} unite="joueurs" />
        <Camembert titre="Origine" parts={origParts} unite="visiteurs" />
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
            <thead><tr><th style={TH}>Station</th><th style={TH}>Joueurs</th><th style={TH}>Parties</th><th style={TH}>Flashs QR</th></tr></thead>
            <tbody>{tri.map(s => (<tr key={s.event_id}><td style={TD}><b>{s.nom}</b></td><td style={TD}>{s.joueurs ?? 0}</td><td style={TD}>{s.commencees ?? 0}</td><td style={{ ...TD, ...MUTED }}>{s.scans ?? 0}</td></tr>))}</tbody>
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
