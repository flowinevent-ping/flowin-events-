import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import StatsPro from '@/components/pro/StatsPro'

export const metadata: Metadata = { title: 'Mes statistiques — Flowin Pro' }
export const dynamic = 'force-dynamic'

/** Statistiques du commerce (lot 5 E) : 5 écrans en carrousel. Les chiffres viennent de la RPC stats_pro_audience, lue côté navigateur avec la session. */
export default async function StatistiquesPage({ searchParams }: { searchParams: { pro?: string; ev?: string } }) {
  let proId = searchParams.pro ?? ''
  if (!proId && searchParams.ev) {
    const { data: ev } = await supabase.from('events').select('pro_id').eq('id', searchParams.ev).single()
    proId = ev?.pro_id ?? ''
  }
  const ops = await fetchOperationsPro(proId)
  const ids = ops.operations.flatMap(o => o.stations.map(s => s.id))
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="operations">
      <StatsPro eventIds={ids} nom={ops.proNom ?? 'Mon établissement'} proQuery={q} />
    </ProShell>
  )
}
