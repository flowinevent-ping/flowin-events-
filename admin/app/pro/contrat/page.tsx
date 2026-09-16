import type { Metadata } from 'next'
import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { H1, SUB } from '@/lib/proui'

export const metadata: Metadata = { title: 'Contrat — Flowin Pro' }

/** Contrat — formule, paiement, bon de commande et facture, par operation. Lecture seule cote pro. */
export default async function ProContratPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="contrat">
      <h1 style={H1}>Contrat</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>Ce qui a été convenu pour chaque opération. Une question : flowinevent@gmail.com · 04 93 59 91 37.</div>
      <OngletOperationsPro initial={ops} onglet="contrat" />
    </ProShell>
  )
}
