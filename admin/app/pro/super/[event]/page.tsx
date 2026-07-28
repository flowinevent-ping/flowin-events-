import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { fetchJours, fetchStations, fetchRapportPoints } from '@/lib/nds'
import { fetchEventSuperEventStats } from '@/lib/dashboard'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import { CARD, TH, TD, MUTED, H1, SUB, ACC } from '@/lib/proui'

const fr = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d }

export default async function ProStationPage({ params, searchParams }: { params: { event: string }, searchParams: { pro?: string; jour?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const ev = data.events.find(e => e.id === params.event)
  const seId = data.events.find(e => e.super_event_id)?.super_event_id ?? null
  const q = proId ? `&pro=${encodeURIComponent(proId)}` : ''

  if (!ev) {
    return <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="super">
      <h1 style={H1}>Station introuvable</h1>
      <div style={SUB}>Cette station n'appartient pas à votre espace.</div>
    </ProShell>
  }

  const jours = seId ? await fetchJours(seId) : []
  const jourSel = searchParams.jour ?? jours[jours.length - 1]?.jour ?? null
  const stationsJour = seId ? await fetchStations(jourSel, seId) : []
  const stat = stationsJour.find(s => s.event_id === ev.id)

  /* Bilan sur TOUTE la periode du festival (pas seulement le jour selectionne) : reutilise le RPC
   * super_event_rapport_points deja cable cote SA (rapport-points/page.tsx). PointJeu contient deja
   * score_moyen, ont_rejoue, optin, avec_coordonnees, repondants_bonus/rse/bv, heure_pic -- rien de
   * recalcule ici, on filtre juste au point de cette station. */
  const rapport = seId ? await fetchRapportPoints(seId) : null
  const pointStation = rapport?.points.find(p => p.event_id === ev.id) ?? null

  /* Tickets/gains emis sur cette station : fonction deja cablee cote SA (ProClient.tsx, onglet tirage). */
  const ticketsGains = await fetchEventSuperEventStats(ev.id)

  /* Courbe d'evolution : parties commencees par jour, memes appels fetchStations() que le selecteur de
   * jour ci-dessus, juste rejoues pour chaque jour au lieu d'un seul. Generique, aucun jour code en dur. */
  const parJour = seId
    ? await Promise.all(jours.map(async j => {
        const s = await fetchStations(j.jour, seId)
        const st = s.find(x => x.event_id === ev.id)
        return { jour: j.jour, parties: st?.commencees ?? 0 }
      }))
    : []
  const maxParJour = Math.max(1, ...parJour.map(p => p.parties))

  /* Reponses reelles : score + bonus_answers, filtres event + jour, cles decouvertes dynamiquement (aucun nom de question code en dur) */
  let scoreDist: Record<string, number> = {}
  let bonusTally: Record<string, Record<string, number>> = {}
  let nbReponses = 0
  {
    let query = supabase.from('participations').select('score,bonus_answers,played_date').eq('event_id', ev.id)
    if (jourSel) query = query.eq('played_date', jourSel)
    const { data: parts } = await query
    ;(parts ?? []).forEach((p: any) => {
      const s = String(p.score ?? '—')
      scoreDist[s] = (scoreDist[s] ?? 0) + 1
      const ba = p.bonus_answers
      if (ba && typeof ba === 'object') {
        const keys = Object.keys(ba)
        if (keys.length) nbReponses++
        keys.forEach(k => {
          const v = Array.isArray(ba[k]) ? ba[k].join(', ') : String(ba[k])
          bonusTally[k] = bonusTally[k] ?? {}
          bonusTally[k][v] = (bonusTally[k][v] ?? 0) + 1
        })
      }
    })
  }

  /* Ouverture / finition / coupures reseau : source reelle visites.etape (etape='quiz'/'resultats'/'err:reprise-reseau') */
  let ontOuvert = 0, ontFini = 0, coupures = 0
  {
    let vq = supabase.from('visites').select('etape,visiteur_id,created_at').eq('event_id', ev.id)
    const { data: vis } = await vq
    const filtered = jourSel ? (vis ?? []).filter((v: any) => (v.created_at ?? '').slice(0, 10) === jourSel) : (vis ?? [])
    ontOuvert = new Set(filtered.filter((v: any) => v.etape === 'quiz').map((v: any) => v.visiteur_id)).size
    ontFini = new Set(filtered.filter((v: any) => v.etape === 'resultats').map((v: any) => v.visiteur_id)).size
    coupures = filtered.filter((v: any) => v.etape === 'err:reprise-reseau').length
  }
  const finitionPct = ontOuvert ? Math.round((ontFini / ontOuvert) * 100) : null

  const kpi = (v: React.ReactNode, k: string) => <div style={{ ...CARD, flex: 1, minWidth: 130 }}><div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>{v}</div><div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{k}</div></div>

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="super">
      <div style={{ fontSize: 13, marginBottom: 6 }}><Link href={`/pro/super?pro=${encodeURIComponent(proId)}`} style={{ color: ACC, textDecoration: 'none', fontWeight: 700 }}>← Mes stations</Link></div>
      <h1 style={H1}>{ev.nom}</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>Activité par jour — sélectionnez une date.</div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {jours.map(j => (
          <Link key={j.jour} href={`/pro/super/${ev.id}?jour=${j.jour}${q}`}
            style={{
              textDecoration: 'none', fontSize: 12.5, fontWeight: 700, borderRadius: 20, padding: '6px 12px',
              border: `1.5px solid ${j.jour === jourSel ? ACC : '#E2E8F0'}`,
              background: j.jour === jourSel ? 'rgba(124,45,146,.08)' : '#fff',
              color: j.jour === jourSel ? ACC : '#0F172A',
            }}>
            {fr(j.jour)}{j.hors_periode ? ' ⚠' : ''}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {kpi(stat?.joueurs ?? 0, 'joueurs ce jour')}
        {kpi(stat?.commencees ?? 0, 'parties commencées')}
        {kpi(stat?.terminees ?? 0, 'parties terminées')}
        {kpi(stat?.scans ?? 0, 'flashs QR')}
        {kpi(stat?.visiteurs ?? 0, 'visiteurs')}
      </div>

      {pointStation && (
        <div style={{ ...CARD, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>
            Bilan sur toute la période du festival
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {kpi(pointStation.score_moyen != null ? pointStation.score_moyen.toFixed(1) : '—', 'score moyen')}
            {kpi(pointStation.ont_rejoue, 'ont rejoué')}
            {kpi(pointStation.joueurs ? `${Math.round((pointStation.optin / pointStation.joueurs) * 100)}%` : '—', 'opt-in')}
            {kpi(pointStation.avec_coordonnees, 'avec coordonnées')}
            {kpi(pointStation.heure_pic != null ? `${pointStation.heure_pic}h` : '—', 'heure de pic')}
          </div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 8 }}>
            Borné aux dates du super event — même source que le rapport détaillé du Super Admin (<code>super_event_rapport_points</code>), aucun recalcul.
          </div>
        </div>
      )}

      <div style={{ ...CARD, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>
          Tickets &amp; gains émis sur cette station
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {kpi(ticketsGains.tickets, 'tickets émis')}
          {kpi(ticketsGains.gains, 'gains émis')}
          {kpi(ticketsGains.gainsUtilises, 'gains retirés')}
        </div>
      </div>

      {parJour.length > 1 && (
        <div style={{ ...CARD, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 12 }}>
            Évolution — parties commencées par jour
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
            {parJour.map(p => (
              <Link
                key={p.jour}
                href={`/pro/super/${ev.id}?jour=${p.jour}${q}`}
                title={`${fr(p.jour)} — ${p.parties} partie${p.parties > 1 ? 's' : ''}`}
                style={{
                  flex: 1, minWidth: 8, borderRadius: '4px 4px 0 0', textDecoration: 'none',
                  height: `${Math.max(3, Math.round((p.parties / maxParJour) * 100))}%`,
                  background: p.jour === jourSel ? ACC : '#E2E8F0',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 9.5, color: '#94A3B8' }}>
            {parJour.map(p => <div key={p.jour} style={{ flex: 1, minWidth: 8, textAlign: 'center' }}>{fr(p.jour)}</div>)}
          </div>
        </div>
      )}

      <div style={{ ...CARD, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Taux de finition du quiz</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {kpi(ontOuvert, 'ont ouvert')}
          {kpi(ontFini, 'ont fini')}
          {kpi(finitionPct !== null ? `${finitionPct}%` : '—', 'finition')}
          {kpi(coupures, 'coupures réseau')}
        </div>
        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 8 }}>Coupures réseau = reprises après perte de connexion pendant le jeu (source : suivi de parcours réel).</div>
      </div>

      <div style={{ ...CARD, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Scores obtenus (quiz)</div>
        {Object.keys(scoreDist).length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune partie ce jour-là.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={TH}>Score</th><th style={TH}>Joueurs</th></tr></thead>
            <tbody>{Object.entries(scoreDist).sort((a, b) => Number(b[0]) - Number(a[0])).map(([s, n]) => (
              <tr key={s}><td style={TD}>{s}</td><td style={TD}>{n}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Réponses aux questions bonus{nbReponses ? ` (${nbReponses} joueurs ont répondu)` : ''}</div>
        {Object.keys(bonusTally).length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune réponse bonus ce jour-là.</div> : (
          Object.entries(bonusTally).map(([question, vals]) => (
            <div key={question} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{question}</div>
              {Object.entries(vals).sort((a, b) => b[1] - a[1]).map(([v, n]) => (
                <div key={v} style={{ display: 'flex', gap: 8, fontSize: 12.5, padding: '3px 0', color: '#334155' }}>
                  <span style={{ flex: 1 }}>{v}</span><span style={{ fontWeight: 800 }}>{n}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </ProShell>
  )
}
