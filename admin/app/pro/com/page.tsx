import type { Metadata } from 'next'
import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { H1, SUB } from '@/lib/proui'

export const metadata: Metadata = { title: 'Emails & com — Flowin Pro' }

/**
 * Emails & com — meme rubrique que la fiche pro SA (famille J : memes
 * rubriques des deux cotes), un bloc par operation.
 */
export default async function ProComPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="com">
      <h1 style={H1}>Emails &amp; com</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>Vos supports et vos liens de jeu, opération par opération.</div>
      <OngletOperationsPro initial={ops} onglet="comm" />
    </ProShell>
  )
}
