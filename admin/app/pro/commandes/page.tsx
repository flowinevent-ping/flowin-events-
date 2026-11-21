import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { lireFichePro } from '@/lib/proFiche'
import ProShell from '@/components/pro/ProShell'
import HistoriqueCommandes from '@/components/pro/HistoriqueCommandes'
import { H1, SUB } from '@/lib/proui'

export const metadata: Metadata = { title: 'Mes commandes et factures — Flowin Pro' }
export const dynamic = 'force-dynamic'

/** MES COMMANDES ET FACTURES (31/10) : historique, contrat signe et facture en PDF, rappel de virement. */
export default async function Page({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  let nom = 'Mon établissement'
  if (proId) {
    /* Sécurité pros (21/11) : nom par la fiche publique (RPC) ; RPC absente : lecture directe. */
    const { fiche, repli } = await lireFichePro(proId)
    if (repli) {
      const { data } = await supabase.from('pros').select('nom').eq('id', proId).maybeSingle()
      if (data?.nom) nom = data.nom
    } else if (fiche?.nom) nom = fiche.nom
  }
  return (
    <ProShell proName={nom} proId={proId} active="commandes">
      <h1 style={H1}>Mes commandes et factures</h1>
      <div style={{ ...SUB, marginBottom: 14 }}>Vos commandes, vos bons de commande et vos factures, avec leur état de paiement.</div>
      {proId ? <HistoriqueCommandes proId={proId} /> : null}
    </ProShell>
  )
}
