import { supabase } from '@/lib/supabase'
import SuperEventClient from './SuperEventClient'

export const revalidate = 60

interface Props { params: { se: string } }

const NOTFOUND = (
  <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#888' }}>
    Super event introuvable.
  </div>
)

export default async function Page({ params }: Props) {
  const seId = params.se

  const [seRes, lotsRes, lieuxRes, sponsorsRes] = await Promise.all([
    supabase.from('super_events').select('id,nom,description,date_d,date_f').eq('id', seId).single(),
    supabase.from('se_lots').select('id,rang,valeur,libelle').eq('super_event_id', seId).order('rang'),
    supabase.from('events').select('id,nom,module,lat,lng,couleur,gain_immediat').eq('super_event_id', seId),
    supabase.from('partenaires').select('id,nom,image_url').eq('super_event_id', seId).eq('statut_paiement', 'valide'),
  ])

  if (!seRes.data) return NOTFOUND

  return (
    <SuperEventClient
      se={seRes.data}
      lots={lotsRes.data ?? []}
      lieux={lieuxRes.data ?? []}
      sponsors={sponsorsRes.data ?? []}
    />
  )
}
