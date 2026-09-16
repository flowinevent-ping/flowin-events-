import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import FicheOperationPro, { ONGLETS_OP, type OngletOp } from '@/components/pro/FicheOperationPro'

export const dynamic = 'force-dynamic'

/** Fiche d une operation : ?op=ev:<id> ou se:<id>, ?onglet=jeu|lots|diffusion|gagnants|trafic|crm|contrat. */
export default async function Page({ searchParams }: { searchParams: { pro?: string; op?: string; onglet?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  const onglet = (ONGLETS_OP.find(o => o.id === searchParams.onglet)?.id ?? 'jeu') as OngletOp
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="operation">
      <FicheOperationPro initial={ops} cle={searchParams.op ?? ''} onglet={onglet} />
    </ProShell>
  )
}
