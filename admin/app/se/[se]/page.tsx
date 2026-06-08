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
    supabase.from('super_events').select('id,nom,description,date_d,date_f,social').eq('id', seId).single(),
    supabase.from('se_lots').select('id,rang,valeur,libelle').eq('super_event_id', seId).order('rang'),
    supabase.from('events').select('id,nom,module,lat,lng,couleur,gain_immediat,gain_ticket,adresse,description,categorie,tel,site_web,photo_url,horaires').eq('super_event_id', seId).neq('status','pending'),
    supabase.from('partenaires').select('id,nom,image_url').eq('super_event_id', seId).eq('statut_paiement', 'valide'),
  ])

  if (!seRes.data) return NOTFOUND

  // Autres opérations en cours (annuaire multi-super-events)
  const autresRes = await supabase
    .from('super_events')
    .select('id,nom,date_d,date_f')
    .eq('status', 'actif')
    .neq('id', seId)
    .order('date_d')
  const autresIds = (autresRes.data ?? []).map((s) => s.id)
  const counts: Record<string, number> = {}
  if (autresIds.length) {
    const evs = await supabase.from('events').select('super_event_id').in('super_event_id', autresIds)
    ;(evs.data ?? []).forEach((e: { super_event_id: string }) => {
      counts[e.super_event_id] = (counts[e.super_event_id] || 0) + 1
    })
  }
  const autres = (autresRes.data ?? []).map((s) => ({ ...s, nb: counts[s.id] || 0 }))

  return (
    <SuperEventClient
      se={seRes.data}
      lots={lotsRes.data ?? []}
      lieux={lieuxRes.data ?? []}
      sponsors={sponsorsRes.data ?? []}
      autres={autres}
    />
  )
}
