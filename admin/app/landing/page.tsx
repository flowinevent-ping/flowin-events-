import { supabase } from '@/lib/supabase'
import LandingClient from './LandingClient'

export const revalidate = 60 // revalidation ISR toutes les 60s

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { source?: string }
}) {
  const { data } = await supabase
    .from('landings')
    .select('*')
    .eq('id', 'ld-flowin-demo')
    .single()

  return <LandingClient cfg={data} source={searchParams.source ?? ''} />
}
