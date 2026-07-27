import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { CARD, TH, TD, MUTED, H1, SUB, ACC, kpiGrid } from '@/lib/proui'

export default async function ProLotsPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const lots = data.lots as any[]
  const unites = lots.reduce((s, l) => s + (l.quantite ?? 1), 0)
  const valeur = lots.reduce((s, l) => s + ((l.valeur_euros ?? l.valeur ?? 0) * (l.quantite ?? 1)), 0)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="lots">
      <h1 style={H1}>Lots &amp; distribution</h1><div style={SUB}>Votre catalogue de lots.</div>
      <div style={{ ...kpiGrid(), marginTop: 16 }}>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900, color: ACC }}>{lots.length}</div><div style={{ fontSize: 12, ...MUTED }}>lots</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{unites}</div><div style={{ fontSize: 12, ...MUTED }}>unités</div></div>
        <div style={CARD}><div style={{ fontSize: 26, fontWeight: 900 }}>{valeur} €</div><div style={{ fontSize: 12, ...MUTED }}>valeur totale</div></div>
      </div>
      <div style={{ ...CARD, overflowX: 'auto' }}>
        {lots.length === 0 ? <div style={{ fontSize: 13, ...MUTED }}>Aucun lot pour ce compte.</div> : (
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
        <Link href={`/pro/tirage${q}`} style={{ background: ACC, color: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Aller au tirage →</Link>
      </div>
    </ProShell>
  )
}
