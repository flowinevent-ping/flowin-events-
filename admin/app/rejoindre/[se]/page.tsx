import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

interface Props { params: { se: string } }

const NOTFOUND = (
  <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#888' }}>
    Opération introuvable.
  </div>
)

export default async function Page({ params }: Props) {
  const { data: se } = await supabase
    .from('super_events')
    .select('id,nom,description,date_d,date_f,frais_pro,module,status,logo_url')
    .eq('id', params.se)
    .single()

  /* Un super event cree par un pro n est ouvert qu apres validation Flowin. */
  if (!se || se.status === 'pending') return NOTFOUND

  /* PARCOURS UNIQUE (03/11/2026) : ce formulaire creait un pro sans compte puis une demande. La demande a Flowin exige desormais un
     compte pro : tous les anciens liens /rejoindre/<id> menent au parcours unique, avec l'operation preselectionnee.
     RejoindreClient.tsx reste dans le depot (non supprime) mais n'est plus affiche. */
  redirect(`/rejoindre?se=${encodeURIComponent(se.id)}`)
}
