import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import HistoriqueCommandes from '@/components/pro/HistoriqueCommandes'
import { H1, SUB } from '@/lib/proui'

export const metadata: Metadata = { title: 'Mes commandes et factures — Flowin Pro' }
export const dynamic = 'force-dynamic'

/** MES COMMANDES ET FACTURES (31/10) : historique, contrat signe et facture en PDF, rappel de virement. */
export default async function Page({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  let nom = 'Mon établissement'
  let enseigne: string | null = null
  if (proId) {
    let r = await supabase.from('pros').select('nom,nom_commercial').eq('id', proId).maybeSingle()
    if (r.error) r = (await supabase.from('pros').select('nom').eq('id', proId).maybeSingle()) as typeof r
    const d = r.data as { nom?: string; nom_commercial?: string } | null
    if (d?.nom) nom = d.nom
    enseigne = d?.nom_commercial || null
  }
  return (
    <ProShell proName={nom} proId={proId} active="commandes">
      <h1 style={H1}>Mes commandes et factures</h1>
      <div style={{ ...SUB, marginBottom: 14 }}>Vos commandes, vos contrats signés et vos factures, avec leur état de paiement.</div>
      {proId ? <HistoriqueCommandes proId={proId} identite={{ nom, enseigne }} /> : null}
    </ProShell>
  )
}
