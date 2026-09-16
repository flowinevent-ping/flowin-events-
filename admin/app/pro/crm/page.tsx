import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { H1, SUB } from '@/lib/proui'
import { fetchOperationsPro } from '@/lib/operations'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'

/**
 * MON CRM — referentiel 19 : rangé par opération.
 * La liste unique melangeait les joueurs de toutes les operations. Chaque
 * operation (event ou super event) a maintenant son bloc : ses contacts, son
 * opt-in, son export CSV.
 */
export default async function ProCrmPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, ops] = await Promise.all([fetchProDashboard(proId), fetchOperationsPro(proId)])
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="crm">
      <h1 style={H1}>Mon CRM</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>Vos contacts, opération par opération : qui a joué, où, combien de fois, et qui accepte d’être recontacté.</div>
      <OngletOperationsPro initial={ops} onglet="crm" />
    </ProShell>
  )
}
