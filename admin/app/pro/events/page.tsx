import Link from 'next/link'
import { fetchOperationsPro, libelleModule, libelleDates } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import { BlocOperation, AucuneOperation } from '@/components/operations/BlocsOperations'
import { CARD, MUTED, H1, SUB, ACC } from '@/lib/proui'

/**
 * Mes events — un bloc par operation, la plus recente en tete.
 *
 * Remplace le classement en quatre colonnes (a venir / en cours / termine /
 * archive) : une station de super event et un event autonome s y melangeaient
 * a plat, et Charvolin y apparaissait deux fois (sa station du gabarit master,
 * famille B). Le gabarit est exclu par lib/operations.ts ; l etat reste lisible
 * sur chaque bloc.
 */
export default async function ProEventsPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const nSuper = ops.operations.filter(o => o.type === 'super').length
  const nEvents = ops.operations.length - nSuper

  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="events">
      <h1 style={H1}>Mes events</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>
        {nEvents} event{nEvents > 1 ? 's' : ''} autonome{nEvents > 1 ? 's' : ''} · {nSuper} super event{nSuper > 1 ? 's' : ''} — la plus récente en tête.
      </div>
      {ops.operations.length === 0 && <div style={CARD}><AucuneOperation /></div>}
      {ops.operations.map(op => (
        <BlocOperation key={op.cle} op={op}>
          {op.stations.map(e => (
            <Link key={e.id} href={`/pro/super/${e.id}${q}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #E2E8F0', textDecoration: 'none', color: 'inherit', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.nom || 'Sans nom'}</div>
                <div style={{ fontSize: 11.5, ...MUTED }}>
                  {libelleModule(e.module)}
                  {op.type === 'super' && e.date_d ? ` · ${libelleDates(e.date_d, e.date_f)}` : ''}
                  {e.participants ? ` · ${e.participants} joueurs` : ''}
                </div>
              </div>
              <span style={{ color: ACC, fontWeight: 800, fontSize: 12 }}>Voir l&apos;activité →</span>
            </Link>
          ))}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 12 }}>
            <span style={MUTED}>{op.lots.reduce((n, l) => n + l.quantite, 0)} lots · {op.gagnants.length} gagnants</span>
            {op.type === 'super' && (
              <Link href={`/pro/super${q}${q ? '&' : '?'}se=${encodeURIComponent(op.id)}`} style={{ color: ACC, fontWeight: 700, textDecoration: 'none' }}>Bilan du super event →</Link>
            )}
          </div>
        </BlocOperation>
      ))}
    </ProShell>
  )
}
