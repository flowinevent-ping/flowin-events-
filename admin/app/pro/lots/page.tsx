import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { CARD, TH, TD, MUTED, H1, SUB, ACC, kpiGrid } from '@/lib/proui'

/**
 * Romain, 04/09 : « lots et distribution pareil, il faut selectionner l event
 * sinon bordel ».
 *
 * La page melangeait les lots de TOUS les evenements du pro en un seul
 * catalogue : les compteurs additionnaient des lots d operations differentes,
 * et rien ne disait a quel evenement chaque ligne appartenait. Le choix se
 * fait maintenant en tete, comme sur l ecran Gagnants, et tout ce qui suit ne
 * concerne que l evenement retenu.
 *
 * Le filtre est un lien, pas un etat React : la page est rendue cote serveur,
 * la garder ainsi evite d en faire un composant client pour un simple choix.
 */
export default async function ProLotsPage({ searchParams }: { searchParams: { pro?: string; ev?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)

  const events = data.events.filter(e => e.super_event_id !== 'se-master-superevent')
  /* Aucun choix explicite : on prend le premier evenement, jamais l ensemble --
     un total qui melange plusieurs operations ne veut rien dire. */
  const evId = searchParams.ev || events[0]?.id || ''
  const ev = events.find(e => e.id === evId) ?? null

  const tousLots = data.lots as any[]
  const lots = evId ? tousLots.filter(l => l.event_id === evId) : tousLots
  const unites = lots.reduce((s, l) => s + (l.quantite ?? 1), 0)
  const valeur = lots.reduce((s, l) => s + ((l.valeur_euros ?? l.valeur ?? 0) * (l.quantite ?? 1)), 0)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="lots">
      <h1 style={H1}>Lots &amp; distribution</h1>
      <div style={SUB}>Les lots mis en jeu sur l&apos;événement sélectionné.</div>

      <div style={{ ...CARD, marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Événement</div>
        {events.length === 0
          ? <div style={{ fontSize: 12.5, ...MUTED }}>Aucun événement pour ce compte.</div>
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {events.map(e => {
                const on = e.id === evId
                return (
                  <Link
                    key={e.id}
                    href={`/pro/lots?pro=${encodeURIComponent(proId)}&ev=${encodeURIComponent(e.id)}`}
                    style={{
                      textDecoration: 'none', fontSize: 12.5, fontWeight: 700, padding: '8px 13px',
                      borderRadius: 10, border: `1.5px solid ${on ? ACC : '#E2E8F0'}`,
                      background: on ? 'rgba(168,85,247,.06)' : '#fff', color: on ? ACC : '#0F172A',
                    }}
                  >{e.nom}{e.super_event_id ? ' · super event' : ''}</Link>
                )
              })}
            </div>
          )}
        {ev?.super_event_id && (
          <div style={{ fontSize: 11.5, ...MUTED, marginTop: 10 }}>
            Événement rattaché à un super event : les lots sont ceux que vous avez engagés dans l’opération.
          </div>
        )}
      </div>

      <div style={{ ...kpiGrid(), marginTop: 16 }}>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900, color: ACC }}>{lots.length}</div><div style={{ fontSize: 12, ...MUTED }}>lots</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{unites}</div><div style={{ fontSize: 12, ...MUTED }}>unités</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{valeur} €</div><div style={{ fontSize: 12, ...MUTED }}>valeur totale</div></div>
      </div>
      <div style={{ ...CARD, overflowX: 'auto' }}>
        {lots.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucun lot sur cet événement.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead><tr><th style={TH}>Lot</th><th style={TH}>Valeur</th><th style={TH}>Quantité</th><th style={TH}>Statut</th></tr></thead>
            <tbody>
              {lots.map((l, i) => { const ret = !!l.retire, ass = !!l.assigne_a; return (
                <tr key={l.id ?? i}>
                  <td style={TD}><b>{l.emoji ? `${l.emoji} ` : ''}{l.titre ?? l.nom ?? '—'}</b></td>
                  <td style={TD}>{(l.valeur_euros ?? l.valeur) != null ? `${l.valeur_euros ?? l.valeur} €` : '—'}</td>
                  <td style={TD}>{l.quantite ?? 1}</td>
                  <td style={TD}><span style={{ fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '3px 9px', background: ret ? 'rgba(34,197,94,.12)' : ass ? 'rgba(245,158,11,.14)' : '#F8FAFC', color: ret ? '#15803D' : ass ? '#B45309' : '#64748B' }}>{ret ? 'retiré' : ass ? 'attribué' : 'disponible'}</span></td>
                </tr>) })}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, fontSize: 12.5, ...MUTED }}>La distribution se gère depuis l&apos;écran Gagnants.</div>
        <Link href={`/pro/tirage${q}${evId ? `&ev=${encodeURIComponent(evId)}` : ''}`} style={{ background: ACC, color: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Aller au tirage →</Link>
      </div>
    </ProShell>
  )
}
