import { supabase } from '@/lib/supabase'
import OpsDetailClient from './OpsDetailClient'

export const revalidate = 15

export default async function SuperEventDetail({ params }: { params: { id: string } }) {
  const id = params.id
  const [se, com, par, land] = await Promise.all([
    supabase.from('v_se_dashboard').select('*').eq('id', id).single(),
    supabase.from('v_se_commerces').select('*').eq('super_event_id', id).order('nom'),
    supabase.from('v_parrainage_commerce').select('*'),
    supabase.from('landings').select('id,pricing,nom').eq('id', 'ld-nds-2026').single(),
  ])

  return (
    <OpsDetailClient
      se={se.data}
      commerces={com.data ?? []}
      parr={par.data ?? []}
      landing={id === 'se-nds-2026' ? (land.data ?? null) : null}
    />
  )
}
