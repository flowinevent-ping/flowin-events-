import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { fetchStations, fetchSondageLanding } from '@/lib/nds'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import StationsCarteGPS from '@/components/pro/StationsCarteGPS'
import { Camembert } from '@/components/dashboard/Camembert'
import SondageLandingPro from '@/components/pro/SondageLandingPro'
import { CARD, TH, TD, MUTED, H1, SUB, ACC } from '@/lib/proui'
import { Ico } from '@/lib/proicons'
import { grouperOperations, libelleDates, type SuperEventRef } from '@/lib/operations'
import { BlocOperation } from '@/components/operations/BlocsOperations'

/**
 * Super event — UNE operation a la fois, designee explicitement (`?se=`).
 *
 * La page prenait `data.events.find(e => e.super_event_id)` : le premier
 * super event venu (famille D), et titrait « Nuits du Sud 2026 » en dur.
 * Charvolin tient des stations dans deux super events : la page montrait
 * l un ou l autre selon l ordre de la requete.
 *
 * Sans `?se=` et avec plusieurs super events : la liste, un bloc chacun.
 * Avec un seul : son bilan directement.
 */
export default async function ProSuperPage({ searchParams }: { searchParams: { pro?: string; se?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  /* pro_id = pro organisateur (sql/06). Colonne absente : on relit sans elle (tolerant). */
  let { data: supersRes, error: errSup } = await supabase.from('super_events').select('id,nom,date_d,date_f,status,pro_id')
  if (errSup) supersRes = ((await supabase.from('super_events').select('id,nom,date_d,date_f,status')).data ?? []) as typeof supersRes
  const opsSE = grouperOperations(data.events, (supersRes ?? []) as SuperEventRef[]).filter(o => o.type === 'super')
  /* Audit promesse L4 (19/11) : l'organisateur voit SON super event, meme sans station a lui. */
  const organises = proId ? (supersRes ?? []).filter(x => (x as { pro_id?: string | null }).pro_id === proId) : []
  organises.forEach(x => {
    if (!opsSE.some(o => o.id === x.id)) opsSE.push({ cle: `se:${x.id}`, type: 'super', id: x.id, nom: x.nom, dateD: x.date_d, dateF: x.date_f, status: x.status ?? null, stations: [] })
  })

  /* Demandes "rejoindre un super event" pas encore actees (en_attente) ou
     refusees : sans ca, le pro qui a envoye une demande ne voit plus rien
     nulle part tant que le SA n a pas valide (audit UX 21/10, Romain). Une
     fois validee, event_id est rempli et l operation apparait via opsSE
     ci-dessus -- on exclut donc 'validee' pour ne pas doublonner. */
  const demandes = proId
    ? (await supabase
        .from('demandes_rattachement_super_event')
        .select('id,super_event_id,statut,created_at,note_sa')
        .eq('pro_id', proId)
        .neq('statut', 'validee')
        .order('created_at', { ascending: false })).data ?? []
    : []
  const nomSuper = (id: string) => (supersRes ?? []).find(s => s.id === id)?.nom ?? id
  const blocDemandes = demandes.length > 0 && (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {demandes.map(d => (
        <div key={d.id} style={{ ...CARD, margin: 0, padding: '12px 16px', borderLeft: `3px solid ${d.statut === 'refusee' ? '#C23B3B' : '#C2410C'}` }}>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>
            {d.statut === 'refusee' ? '✕ Demande refusée — ' : 'En attente de validation — '}{nomSuper(d.super_event_id)}
          </div>
          <div style={{ fontSize: 12, ...MUTED, marginTop: 2 }}>
            {d.statut === 'refusee'
              ? (d.note_sa || 'Votre demande de rattachement n’a pas été retenue.')
              : 'Votre demande a bien été envoyée, Flowin la valide avant qu’elle apparaisse ici.'}
          </div>
        </div>
      ))}
    </div>
  )
  const choisi = opsSE.find(o => o.id === searchParams.se) ?? (opsSE.length === 1 ? opsSE[0] : null)
  const seId = choisi?.id ?? null
  const qp = proId ? `?pro=${encodeURIComponent(proId)}` : '?'

  if (!choisi) {
    return (
      <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="super">
        <h1 style={H1}>Mes super events</h1>
        <div style={{ ...SUB, marginBottom: 16 }}>Les animations collectives auxquelles vous participez. Ouvrez-en une pour voir le bilan de vos stations.</div>
        {blocDemandes}
        {opsSE.length === 0 && demandes.length === 0 && <div style={{ ...CARD, fontSize: 13, ...MUTED }}>Vous ne participez à aucun super event.</div>}
        {opsSE.map(op => (
          <BlocOperation key={op.cle} op={op} droite={
            <Link href={`/pro/super${qp}&se=${encodeURIComponent(op.id)}`} style={{ color: ACC, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Voir le bilan →</Link>
          }>
            {op.stations.map(st => (
              <div key={st.id} style={{ fontSize: 13, padding: '4px 0' }}>
                <Link href={`/pro/super/${st.id}${qp}`} style={{ color: ACC, fontWeight: 700, textDecoration: 'none' }}>{st.nom} →</Link>
              </div>
            ))}
          </BlocOperation>
        ))}
      </ProShell>
    )
  }

  /* Tout ce qui suit est borne aux stations du pro DANS CE super event. */
  const evIds = new Set(choisi.stations.map(e => e.id))
  const { data: partsSe } = evIds.size
    ? await supabase.from('participations').select('joueur_id').in('event_id', Array.from(evIds))
    : { data: [] as { joueur_id: string }[] }
  const idsJoueursSe = new Set(((partsSe ?? []) as { joueur_id: string | null }[]).map(p => p.joueur_id).filter(Boolean) as string[])
  const joueursSe = data.joueurs.filter(j => idsJoueursSe.has(j.id))

  /* Même RPC que le SA (super_event_stations), filtrée aux seules stations du pro — parité garantie */
  const allStations = seId ? await fetchStations(null, seId) : []
  /* Canal de collecte hors parcours (landing) — meme RPC que le SA, filtre aux points du pro */
  const sondage = seId ? await fetchSondageLanding(seId) : null
  const nomsDuPro = new Set(choisi.stations.map(e => e.nom))
  const myStations = allStations.filter(s => evIds.has(s.event_id))
  const estOrganisateur = organises.some(x => x.id === seId)
  const toutes = allStations.slice().sort((a, b) => (b.scans ?? 0) - (a.scans ?? 0))
  const tri = myStations.slice().sort((a, b) => (b.commencees ?? 0) - (a.commencees ?? 0))

  let lieux: any[] = []
  /* Organisateur : carte de TOUS les commerces participants (promesse 8). */
  const idsCarte = estOrganisateur ? allStations.map(x => x.event_id) : Array.from(evIds)
  if (idsCarte.length) {
    const { data: lieuxRes } = await supabase
      .from('events')
      .select('id,nom,module,lat,lng,couleur,gain_immediat,gain_ticket,adresse,description,categorie,tel,site_web,photo_url,horaires')
      .in('id', idsCarte)
    lieux = lieuxRes ?? []
  }

  const joueurs = joueursSe.length
  const parties = myStations.reduce((s, x) => s + (x.commencees ?? 0), 0)
  const scans = myStations.reduce((s, x) => s + (x.scans ?? 0), 0)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const hk = (v: React.ReactNode, k: string) => <div style={{ flex: 1, minWidth: 90 }}><div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>{v}</div><div style={{ fontSize: 11.5, opacity: 0.9 }}>{k}</div></div>

  const nF = joueursSe.filter(j => (j as any).genre === 'F').length
  const nH = joueursSe.filter(j => (j as any).genre === 'H').length
  const sexeParts = [{ valeur: 'Femmes', n: nF }, { valeur: 'Hommes', n: nH }]

  const tranches = ['-18', '18-25', '26-35', '36-50', '51-65', '65+']
  const ageParts = tranches
    .map(t => ({ valeur: t, n: joueursSe.filter(j => (j as any).age_tranche === t).length }))
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
      {opsSE.length > 1 && (
        <div style={{ fontSize: 13, marginBottom: 6 }}><Link href={`/pro/super${qp}`} style={{ color: ACC, textDecoration: 'none', fontWeight: 700 }}>← Mes super events</Link></div>
      )}
      <h1 style={H1}>Ma participation — {choisi.nom}</h1>
      <div style={{ ...SUB }}>{libelleDates(choisi.dateD, choisi.dateF)}</div>
      <div style={{ ...SUB, marginBottom: 16, display: estOrganisateur ? 'none' : undefined }}>Vous ne voyez ici que vos propres stations. Le bilan global du super event est suivi par Flowin, organisateur de l'opération. Vos chiffres sont calculés de la même façon, limités à vos stations.</div>
      {blocDemandes}
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

      <StationsCarteGPS lieux={lieux as any} />
      <div style={{ ...CARD, overflowX: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#8a7e93', marginBottom: 10 }}>Mes stations</div>
        {tri.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune station.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead><tr><th style={TH}>Station</th><th style={TH}>Joueurs</th><th style={TH}>Parties</th><th style={TH}>Flashs QR</th></tr></thead>
            <tbody>{tri.map(s => (<tr key={s.event_id}><td style={TD}><Link href={`/pro/super/${s.event_id}${q ? `?${q.slice(1)}` : ''}`} style={{ color: ACC, fontWeight: 800, textDecoration: 'none' }}>{s.nom} →</Link></td><td style={TD}>{s.joueurs ?? 0}</td><td style={TD}>{s.commencees ?? 0}</td><td style={{ ...TD, ...MUTED }}>{s.scans ?? 0}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      {estOrganisateur && (
        <div data-organisateur style={{ ...CARD, overflowX: 'auto', borderLeft: '3px solid #C2410C' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#C2410C', marginBottom: 10 }}>Organisateur · passages par station</div>
          {toutes.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucune station pour l’instant.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead><tr><th style={TH}>Station</th><th style={TH}>Flashs QR</th><th style={TH}>Joueurs</th><th style={TH}>Parties</th></tr></thead>
              <tbody>{toutes.map(s => (<tr key={s.event_id}><td style={{ ...TD, fontWeight: 800 }}>{s.nom}</td><td style={TD}>{s.scans ?? 0}</td><td style={TD}>{s.joueurs ?? 0}</td><td style={TD}>{s.commencees ?? 0}</td></tr>))}</tbody>
            </table>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <Link href={`/pro/crm${q}`} style={{ background: '#C2410C', color: '#fff', borderRadius: 12, padding: '9px 14px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Contacts</Link>
            <Link href="/carte-commerces" style={{ border: '1.5px solid #C2410C', color: '#C2410C', borderRadius: 12, padding: '8px 14px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Carte des commerces</Link>
          </div>
        </div>
      )}
      {sondage ? <SondageLandingPro s={sondage} nomsDuPro={nomsDuPro} /> : null}

      <div style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: ACC }}><Ico k="dice" size={16} /></span><div><div style={{ fontWeight: 800, fontSize: 14 }}>Gagnants &amp; tirage</div><div style={{ fontSize: 12.5, ...MUTED }}>Tirage global mutualisé.</div></div></div>
        {/* Relaie le super event en cours (`op=se:<id>`) -- avant, ce lien
            perdait ce contexte et retombait sur la grille de toutes les
            operations (audit UX du 20/10). */}
        <Link href={`/pro/tirage${q}${seId ? `${q ? '&' : '?'}op=${encodeURIComponent(`se:${seId}`)}` : ''}`} style={{ background: ACC, color: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Ouvrir le tirage →</Link>
      </div>
    </ProShell>
  )
}
