import { fetchOperationsPro } from '@/lib/operations'
import { lireOngletOp } from '@/lib/ongletsOperation'
import ProShell from '@/components/pro/ProShell'
import FicheOperationPro from '@/components/pro/FicheOperationPro'

export const dynamic = 'force-dynamic'

/** Fiche d une operation : ?op=ev:<id> ou se:<id>, ?onglet=jeu|lots|diffusion|gagnants|trafic|crm|bons. */
export default async function Page({ searchParams }: { searchParams: { pro?: string; op?: string; onglet?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="operation">
      <FicheOperationPro initial={ops} cle={searchParams.op ?? ''} onglet={lireOngletOp(searchParams.onglet)} />
    </ProShell>
  )
}
