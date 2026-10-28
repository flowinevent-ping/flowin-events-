import type { Metadata } from 'next'
import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import HistoriqueClient from '@/components/pro/HistoriqueClient'

export const metadata: Metadata = { title: 'Historique — Flowin Pro' }
export const dynamic = 'force-dynamic'

/**
 * HISTORIQUE D UNE OPERATION (Romain, 28/10) — l ecran que le pro retrouve
 * apres avoir cree un event ou un super event : son QR et son PIN a
 * telecharger/imprimer, le stock de ses lots (conditions et eligibilite),
 * ses gagnants (qui est venu, qui a retire son lot) et la relance de ceux
 * qui ne l ont pas encore fait -- pour CHAQUE operation, au meme endroit.
 *
 * Plusieurs operations -> kanban de cartes cliquables, meme code visuel que
 * /dashboard/planning cote SA (.sa-kb-*). Une seule operation -> vue detail
 * directe, sans kanban a une carte (HistoriqueClient decide).
 *
 * Rien n est reconstruit : le detail compose EncartPin, Diffusion (QR),
 * ContenuLots et BlocGagnants -- les memes briques deja utilisees par la
 * fiche d operation du pro (/pro/operation) et par le dashboard SA.
 */
export default async function Page({ searchParams }: { searchParams: { pro?: string; op?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchOperationsPro(proId)
  const cle = data.operations.some(o => o.cle === searchParams.op) ? (searchParams.op as string) : ''
  return (
    <ProShell proName={data.proNom ?? 'Mon établissement'} proId={proId} active="historique">
      <HistoriqueClient initial={data} cle={cle} />
    </ProShell>
  )
}
