import { fetchProDashboard } from '@/lib/pro'
import { fetchTracking, libelleSource } from '@/lib/nds'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import { CARD, TH, TD, MUTED, H1, SUB, ACC, kpiGrid } from '@/lib/proui'

/**
 * Tracking liens & QR — CLOISONNE AU PRO.
 *
 * Correction d audit (28/07/2026) — FUITE DE CLOISONNEMENT.
 * La page appelait `fetchTrackQr()` sans argument : ce RPC renvoie le trafic du super
 * event ENTIER, partenaires commerciaux compris. Un commerce connecte sur son espace
 * voyait donc le trafic de tous les autres. Verifie en base : 7 432 flashs affiches
 * alors que le pro n en porte que 2 501.
 *
 * On utilise desormais `fetchTracking(se, { proId })` -> RPC `station_tracking`, qui
 * accepte deja un `p_pro`. Fonction existante du SA, aucun recalcul maison.
 * Le detail par source est recalcule sur les seules visites des events du pro.
 *
 * Generique : le super event est deduit des events du pro, jamais code en dur.
 */
export default async function ProTrackingPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const seId = data.events.find(e => e.super_event_id)?.super_event_id ?? null
  const evIds = data.events.map(e => e.id)

  const t = seId ? await fetchTracking(seId, { proId }) : null
  const stations = (t?.stations ?? []).slice().sort((a, b) => b.flashs - a.flashs)
  const tot = t?.totaux ?? { flashs: 0, physique: 0, digital: 0, parties: 0, joueurs: 0, rejoue: 0 }

  /* Origines — recalculees sur les seules visites des events du pro (aucune fuite). */
  const { data: visites } = evIds.length
    ? await supabase.from('visites').select('source,visiteur_id').in('event_id', evIds).not('visiteur_id', 'is', null)
    : { data: [] as any[] }
  const vus = new Set<string>()
  const parSource = new Map<string, number>()
  ;(visites ?? []).forEach((v: any) => {
    if (vus.has(v.visiteur_id)) return
    vus.add(v.visiteur_id)
    const s = v.source || 'direct'
    parSource.set(s, (parSource.get(s) ?? 0) + 1)
  })
  const origines = Array.from(parSource.entries()).map(([source, visiteurs]) => ({ source, visiteurs })).sort((a, b) => b.visiteurs - a.visiteurs)
  const maxOrig = Math.max(1, ...origines.map(o => o.visiteurs))

  const kpi = (v: React.ReactNode, k: string, acc = false) => (
    <div style={CARD}>
      <div style={{ fontSize: 26, fontWeight: 900, color: acc ? ACC : '#0F172A' }}>{v}</div>
      <div style={{ fontSize: 12, ...MUTED }}>{k}</div>
    </div>
  )

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="tracking">
      <h1 style={H1}>Tracking liens &amp; QR</h1>
      <div style={SUB}>D&apos;où viennent vos joueurs — vos points uniquement.</div>

      <div style={{ ...kpiGrid(), marginTop: 16 }}>
        {kpi(tot.flashs, 'flashs QR', true)}
        {kpi(tot.joueurs, 'joueurs')}
        {kpi(tot.parties, 'parties')}
        {kpi(tot.rejoue, 'ont rejoué')}
      </div>

      <div style={{ ...CARD, background: '#F8FAFC', fontSize: 12.5, ...MUTED, lineHeight: 1.6 }}>
        <b>Flash</b> — une ouverture du QR, <b>pas une personne</b> : un joueur qui rescanne compte plusieurs fois.{' '}
        <b>Physique</b> — flash sans paramètre de source (QR de l&apos;affiche, du forex, de l&apos;écran).{' '}
        <b>Digital</b> — flash arrivé par un lien partagé (<code>source=reseaux-…</code>).{' '}
        Ces chiffres sont bornés à vos propres points : le bilan du super event entier reste chez l&apos;organisateur.
      </div>

      <div style={{ ...CARD, overflowX: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Par point de jeu</div>
        {stations.length === 0 ? (
          <div style={{ fontSize: 13, ...MUTED }}>{seId ? 'Aucun flash enregistré sur vos points.' : 'Aucun point rattaché à un super event.'}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead><tr>
              <th style={TH}>Point</th><th style={TH}>Flashs</th><th style={TH}>Physique</th><th style={TH}>Digital</th>
              <th style={TH}>Joueurs</th><th style={TH}>Parties</th><th style={TH}>Rejoué</th><th style={TH}>Heure de pic</th>
            </tr></thead>
            <tbody>
              {stations.map(s => (
                <tr key={s.event_id}>
                  <td style={TD}><b>{s.station}</b></td>
                  <td style={{ ...TD, fontWeight: 800 }}>{s.flashs}</td>
                  <td style={{ ...TD, ...MUTED }}>{s.physique}</td>
                  <td style={{ ...TD, ...MUTED }}>{s.digital}</td>
                  <td style={TD}>{s.joueurs}</td>
                  <td style={TD}>{s.parties}</td>
                  <td style={{ ...TD, ...MUTED }}>{s.rejoue}</td>
                  <td style={{ ...TD, ...MUTED }}>{s.heure_pic != null ? `${s.heure_pic}h` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 14 }}>Par source d&apos;arrivée — visiteurs identifiés</div>
        {origines.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune arrivée identifiée.</div> : origines.map((o, i) => (
          <div key={o.source} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11, fontSize: 13 }}>
            <span style={{ flex: 1, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? ACC : 'inherit' }}>{libelleSource(o.source)}</span>
            <span style={{ width: 120, height: 8, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.max(3, Math.round(o.visiteurs / maxOrig * 100))}%`, background: `linear-gradient(90deg,#A855F7,${ACC})`, borderRadius: 99 }} />
            </span>
            <span style={{ fontWeight: 800, minWidth: 40, textAlign: 'right' }}>{o.visiteurs}</span>
          </div>
        ))}
        <div style={{ fontSize: 11.5, ...MUTED, marginTop: 8, lineHeight: 1.5 }}>
          Un visiteur n&apos;est compté qu&apos;une fois, sur sa première source. Les flashs sans identifiant ne sont pas comptés ici — d&apos;où l&apos;écart avec le total de flashs.
        </div>
      </div>
    </ProShell>
  )
}
