import type { Metadata } from 'next'
import { fetchOperationsPro } from '@/lib/operations'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import GagnantsClient from '@/components/pro/GagnantsClient'

export const metadata: Metadata = { title: 'Gagnants & tirage — Flowin Pro' }

interface Props { searchParams: { pro?: string; ev?: string } }

/**
 * Gagnants & tirage — un bloc par operation (lib/operations.ts).
 * `?ev=` reste accepte pour retrouver le pro depuis un lien d event.
 */
export default async function ProTiragePage({ searchParams }: Props) {
  let proId = searchParams.pro ?? ''
  const evId = searchParams.ev ?? ''
  if (!proId && evId) {
    const { data: ev } = await supabase.from('events').select('pro_id').eq('id', evId).single()
    proId = ev?.pro_id ?? ''
  }
  const ops = await fetchOperationsPro(proId)
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="gagnants">
      <GagnantsClient initial={ops} />
    </ProShell>
  )
}
