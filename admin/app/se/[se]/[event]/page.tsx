import { supabase } from '@/lib/supabase'
import SuperEventClient from '../SuperEventClient'

export const revalidate = 60

interface Props { params: { se: string; event: string } }

const NOTFOUND = (
  <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#888' }}>
    Lieu introuvable.
  </div>
)

export default async function Page({ params }: Props) {
  const seId = params.se
  const evId = params.event

  const [seRes, lotsRes, lieuxRes, sponsorsRes, focusRes] = await Promise.all([
    supabase.from('super_events').select('id,nom,description,date_d,date_f').eq('id', seId).single(),
    supabase.from('se_lots').select('id,rang,valeur,libelle').eq('super_event_id', seId).order('rang'),
    supabase.from('events').select('id,nom,module,lat,lng,couleur,gain_immediat,gain_ticket').eq('super_event_id', seId),
    supabase.from('partenaires').select('id,nom,image_url').eq('super_event_id', seId).eq('statut_paiement', 'valide'),
    supabase.from('events').select('id,nom,module,gain_immediat').eq('id', evId).single(),
  ])

  if (!seRes.data) return NOTFOUND

  return (
    <SuperEventClient
      se={seRes.data}
      lots={lotsRes.data ?? []}
      lieux={lieuxRes.data ?? []}
      sponsors={sponsorsRes.data ?? []}
      focus={focusRes.data ?? null}
    />
  )
}
