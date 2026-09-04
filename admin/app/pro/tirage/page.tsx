import type { Metadata } from 'next'
import { fetchProDashboard } from '@/lib/pro'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import GagnantsClient from '@/components/pro/GagnantsClient'

export const metadata: Metadata = { title: 'Gagnants & tirage — Flowin Pro' }

interface Props { searchParams: { pro?: string; ev?: string } }

/**
 * Cette page rendait `ProClient` : une application MOBILE pleine page avec sa
 * propre barre d onglets en bas, quand toutes les autres pages de l espace pro
 * passent par ProShell. Romain, 04/09 : « ca ne correspond a rien dans la
 * logique visuelle de la gestion du dashboard ».
 *
 * ProClient n est PAS supprime : il porte encore Joueurs, Lots, QR et Export,
 * qui n ont pas encore d ecran dans la grammaire commune. Seuls les gagnants
 * passent ici pour l instant, le reste suivra ecran par ecran.
 */
export default async function ProTiragePage({ searchParams }: Props) {
  let proId = searchParams.pro ?? ''
  const evId = searchParams.ev ?? ''
  if (!proId && evId) {
    const { data: ev } = await supabase.from('events').select('pro_id').eq('id', evId).single()
    proId = ev?.pro_id ?? ''
  }
  const data = await fetchProDashboard(proId)
  const events = data.events
    .filter(e => e.super_event_id !== 'se-master-superevent')
    .map(e => ({ id: e.id, nom: e.nom, super_event_id: e.super_event_id ?? null }))

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="gagnants">
      <GagnantsClient proId={proId} events={events} />
    </ProShell>
  )
}
