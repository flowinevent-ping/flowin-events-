import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { fetchTracking, libelleSource } from '@/lib/nds'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB, ACC } from '@/lib/proui'

/**
 * Tracking liens & QR — CLOISONNE AU PRO (correction d'audit du 28/07/2026, inchangee).
 *
 * Refonte ergonomique (28/07/2026, meme jour) : la version precedente etait un tableau a
 * 8 colonnes, illisible et tronque sur mobile (Romain a signale une capture mobile montrant
 * 5 colonnes sur 8 -- verifie : ce n'etait pas une autre version, juste un tableau large sans
 * equivalent carte pour petit ecran). Remplace par des cartes cliquables, une par station,
 * qui ouvrent la fiche detail existante (/pro/super/[event]) -- demande de Romain : "pouvoir
 * rentrer dans chaque cellule". Style aligne sur le bandeau degrade de /pro/super.
 */
export default async function ProTrackingPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const seId = data.events.find(e => e.super_event_id)?.super_event_id ?? null
  const evIds = data.events.map(e => e.id)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  const t = seId ? await fetchTracking(seId, { proId }) : null
  const stations = (t?.stations ?? []).slice().sort((a, b) => b.flashs - a.flashs)
  const tot = t?.totaux ?? { flashs: 0, physique: 0, digital: 0, parties: 0, joueurs: 0, rejoue: 0 }
  const maxFlash = Math.max(1, ...stations.map(s => s.flashs))

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

  const hk = (v: React.ReactNode, k: string) => (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>{v}</div>
      <div style={{ fontSize: 11.5, opacity: 0.9 }}>{k}</div>
    </div>
  )

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="tracking">
      <h1 style={H1}>Tracking liens &amp; QR</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>D&apos;où viennent vos joueurs — vos points uniquement.</div>

      <div style={{ borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, background: 'linear-gradient(135deg,#7C2D92 0%,#A855F7 100%)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9 }}>TRACKING · BILAN</div>
        <div style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 14px' }}>{data.pro?.nom ?? 'Mon établissement'}</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {hk(tot.flashs, 'flashs QR')}{hk(tot.joueurs, 'joueurs')}{hk(tot.parties, 'parties')}{hk(tot.rejoue, 'ont rejoué')}
        </div>
      </div>

      <div style={{ ...CARD, background: '#F8FAFC', fontSize: 12, ...MUTED, lineHeight: 1.6 }}>
        <b>Flash</b> — une ouverture du QR, pas une personne. <b>Physique</b> — QR affiche/forex/écran. <b>Digital</b> — lien partagé.
        Chiffres bornés à vos propres points — le bilan complet du super event reste chez l&apos;organisateur.
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10 }}>Par point de jeu — cliquez pour ouvrir le détail</div>
        {stations.length === 0 ? (
          <div style={{ fontSize: 13, ...MUTED }}>{seId ? 'Aucun flash enregistré sur vos points.' : 'Aucun point rattaché à un super event.'}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
            {stations.map(s => (
              <Link key={s.event_id} href={`/pro/super/${s.event_id}${q ? `?${q.slice(1)}` : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ ...CARD, marginBottom: 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{s.station}</div>
                    <span style={{ fontSize: 11, color: ACC, fontWeight: 700 }}>Voir →</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: ACC }}>{s.flashs}</span>
                    <span style={{ fontSize: 11, ...MUTED }}>flashs QR</span>
                  </div>
                  <div style={{ width: '100%', height: 6, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${Math.max(3, Math.round(s.flashs / maxFlash * 100))}%`, background: `linear-gradient(90deg,#A855F7,${ACC})`, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 11.5, ...MUTED }}>
                    <span><b style={{ color: '#0F172A' }}>{s.joueurs}</b> joueurs</span>
                    <span><b style={{ color: '#0F172A' }}>{s.parties}</b> parties</span>
                    <span><b style={{ color: '#0F172A' }}>{s.physique}</b> physique</span>
                    <span><b style={{ color: '#0F172A' }}>{s.digital}</b> digital</span>
                    <span><b style={{ color: '#0F172A' }}>{s.rejoue}</b> ont rejoué</span>
                    {s.heure_pic != null && <span>pic à <b style={{ color: '#0F172A' }}>{s.heure_pic}h</b></span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
          Un visiteur n&apos;est compté qu&apos;une fois, sur sa première source. Les flashs sans identifiant ne sont pas comptés ici.
        </div>
      </div>
    </ProShell>
  )
}
