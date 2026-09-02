import { supabase } from '@/lib/supabase'
import OpsDetailClient from './OpsDetailClient'

export const revalidate = 15

export default async function SuperEventDetail({ params }: { params: { id: string } }) {
  const id = params.id
  const [se, com, par, land, pt] = await Promise.all([
    supabase.from('v_se_dashboard').select('*').eq('id', id).single(),
    supabase.from('v_se_commerces').select('*').eq('super_event_id', id).order('nom'),
    supabase.from('v_parrainage_commerce').select('*'),
    supabase.from('landings').select('id,pricing,nom').eq('id', 'ld-nds-2026').single(),
    // Les LOGOS vivent dans `partenaires`, pas dans v_se_commerces : sans cette
    // lecture, la vue vignettes n aurait que des initiales. Le rapprochement se
    // fait par event_id (9 fiches sur 11 le portent), avec repli sur le nom.
    supabase.from('partenaires').select('id,nom,image_url,emoji,event_id,description'),
  ])

  return (
    <OpsDetailClient
      se={se.data}
      commerces={com.data ?? []}
      parr={par.data ?? []}
      landing={id === 'se-nds-2026' ? (land.data ?? null) : null}
      fiches={pt.data ?? []}
    />
  )
}
