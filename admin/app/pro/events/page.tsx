import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB } from '@/lib/proui'
import type { FlowinEvent } from '@/lib/types'

/**
 * Mes events — classement par etat REEL.
 *
 * Correction d audit (28/07/2026) : le classement se faisait uniquement sur les dates.
 * Consequence constatee en base : les events sans date (status = 'archived') tombaient
 * tous dans la colonne « A venir ». Le pro voyait 6 campagnes fantomes annoncees comme
 * a venir alors qu elles sont archivees, et l event principal etait noye dans le tas.
 *
 * Regle : `status` fait foi quand il vaut 'archived'. Sinon on classe par dates.
 *
 * Second point d audit : un event porteur d un `super_event_id` est une STATION
 * rattachee a un super event, pas un super event. Le badge affichait « SUPER » sur les
 * stations, ce qui inversait la lecture. Les events autonomes (sans super_event_id)
 * sont desormais affiches en premier dans chaque colonne et distingues visuellement :
 * c est ce qui rend a nouveau visible l event principal du pro.
 *
 * Generique : aucun identifiant ni nom d event code en dur.
 */

type Etat = 'a_venir' | 'en_cours' | 'passe' | 'archive'

function etat(e: FlowinEvent): Etat {
  if (String(e.status) === 'archived') return 'archive'
  if (!e.date_d) return 'a_venir'
  const j = new Date(); j.setHours(0, 0, 0, 0)
  const d = new Date(e.date_d); d.setHours(0, 0, 0, 0)
  const f = new Date(e.date_f ?? e.date_d); f.setHours(23, 59, 59, 999)
  if (f < j) return 'passe'
  if (d > j) return 'a_venir'
  return 'en_cours'
}

const COLS = [
  { k: 'a_venir', label: 'À venir', dot: '#4F5BD5' },
  { k: 'en_cours', label: 'En cours', dot: '#15803D' },
  { k: 'passe', label: 'Terminé', dot: '#94A3B8' },
  { k: 'archive', label: 'Archivé', dot: '#CBD5E1' },
] as const

export default async function ProEventsPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)

  const m: Record<Etat, FlowinEvent[]> = { a_venir: [], en_cours: [], passe: [], archive: [] }
  data.events.forEach(e => m[etat(e)].push(e))
  /* Events autonomes d abord, stations ensuite : l event principal remonte en tete. */
  ;(Object.keys(m) as Etat[]).forEach(k => {
    m[k].sort((a, b) => Number(!!a.super_event_id) - Number(!!b.super_event_id))
  })

  const nStations = data.events.filter(e => e.super_event_id).length
  const nAutonomes = data.events.length - nStations

  const fmt = (e: FlowinEvent) => {
    if (!e.date_d) return 'sans date'
    const o: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
    const s = new Date(e.date_d).toLocaleDateString('fr-FR', o)
    return e.date_f && e.date_f !== e.date_d ? `${s} → ${new Date(e.date_f).toLocaleDateString('fr-FR', o)}` : s
  }

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="events">
      <h1 style={H1}>Mes events</h1>
      <div style={{ ...SUB, marginBottom: 14 }}>
        {data.events.length} au total — {nAutonomes} event{nAutonomes > 1 ? 's' : ''} autonome{nAutonomes > 1 ? 's' : ''} et {nStations} station{nStations > 1 ? 's' : ''} rattachée{nStations > 1 ? 's' : ''} à un super event.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
        {COLS.map(c => (
          <div key={c.k} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 12, minHeight: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} /> {c.label} <span style={{ marginLeft: 'auto' }}>{m[c.k].length}</span>
            </div>
            {m[c.k].length === 0 ? <div style={{ fontSize: 12, ...MUTED }}>—</div> : m[c.k].map(e => {
              const station = !!e.super_event_id
              return (
                <div key={e.id} style={{ background: '#fff', border: station ? '1px solid #E2E8F0' : '1.5px solid rgba(168,85,247,.45)', borderRadius: 11, padding: '11px 12px', marginBottom: 9 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                    <span>{e.nom || 'Sans nom'}</span>
                    {station
                      ? <span style={{ fontSize: 9.5, fontWeight: 800, color: '#EA580C', background: 'rgba(234,88,12,.09)', borderRadius: 5, padding: '1px 5px' }}>STATION</span>
                      : <span style={{ fontSize: 9.5, fontWeight: 800, color: '#7C2D92', background: 'rgba(168,85,247,.11)', borderRadius: 5, padding: '1px 5px' }}>EVENT</span>}
                  </div>
                  <div style={{ fontSize: 11.5, ...MUTED, marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{String(e.module ?? '')}</span>
                    <span>{fmt(e)}</span>
                    {e.participants ? <span>{e.participants} joueurs</span> : null}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 3, fontFamily: 'ui-monospace,monospace' }}>{e.id}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ ...CARD, marginTop: 14, background: '#F8FAFC', fontSize: 12.5, ...MUTED, lineHeight: 1.6 }}>
        <b>STATION</b> — point de jeu rattaché à un super event : le QR porte son propre <code>ev=</code>, mais le bilan est mutualisé.
        {' '}<b>EVENT</b> — campagne autonome, avec ses propres lots et son propre tirage.
        {' '}Les events <b>archivés</b> ne sont plus jouables : ils restent listés pour l&apos;historique et n&apos;apparaissent plus comme « à venir ».
      </div>
    </ProShell>
  )
}
