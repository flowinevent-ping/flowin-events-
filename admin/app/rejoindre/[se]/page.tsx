import { supabase } from '@/lib/supabase'
import RejoindreClient from './RejoindreClient'

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
    .select('id,nom,description,date_d,date_f,frais_pro,module,status')
    .eq('id', params.se)
    .single()

  /* Un super event cree par un pro n est ouvert qu apres validation Flowin. */
  if (!se || se.status === 'pending') return NOTFOUND

  return <RejoindreClient se={se} />
}
