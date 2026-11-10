import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import ImportFichierClient from '@/components/pro/ImportFichierClient'
import { H1 } from '@/lib/proui'

export const dynamic = 'force-dynamic'

/** IMPORTER VOTRE FICHIER CLIENT (registre L13) : carrousel en 4 ecrans. */
export default async function Page({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="donnees">
      <h1 style={{ ...H1, marginBottom: 10 }}>Importer votre fichier client</h1>
      <ImportFichierClient proId={proId} />
    </ProShell>
  )
}
