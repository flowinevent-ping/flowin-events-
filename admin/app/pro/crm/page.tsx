import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { CARD, TH, TD, MUTED, H1, SUB, ACC, kpiGrid } from '@/lib/proui'

export default async function ProCrmPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const j = data.joueurs
  const optin = j.filter(x => x.optin).length
  const rows = j.slice(0, 200)
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="crm">
      <h1 style={H1}>Mon CRM</h1><div style={SUB}>Vos contacts — chaque joueur devient un client.</div>
      <div style={{ ...kpiGrid(), marginTop: 16 }}>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900, color: ACC }}>{j.length}</div><div style={{ fontSize: 12, ...MUTED }}>contacts</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{optin}</div><div style={{ fontSize: 12, ...MUTED }}>opt-in (recontactables)</div></div>
      </div>
      <div style={{ ...CARD, overflowX: 'auto' }}>
        {rows.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucun contact pour ce compte.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead><tr><th style={TH}>Contact</th><th style={TH}>Email</th><th style={TH}>Ville</th><th style={TH}>Source</th><th style={TH}>Opt-in</th></tr></thead>
            <tbody>
              {rows.map((x: any, i: number) => (
                <tr key={x.id ?? i}>
                  <td style={TD}><b>{`${x.prenom ?? ''} ${x.nom ?? ''}`.trim() || '—'}</b></td>
                  <td style={{ ...TD, ...MUTED }}>{x.email || '—'}</td>
                  <td style={{ ...TD, ...MUTED }}>{x.ville || '—'}</td>
                  <td style={{ ...TD, ...MUTED }}>{x.decouverte || '—'}</td>
                  <td style={TD}>{x.optin ? <span style={{ color: '#15803D', fontWeight: 800 }}>✓</span> : <span style={MUTED}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ProShell>
  )
}
