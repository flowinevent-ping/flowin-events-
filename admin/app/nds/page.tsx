import { supabase } from '@/lib/supabase'
import NdsClient from './NdsClient'

export const revalidate = 60 // ISR

export const metadata = {
  title: 'Nuits du Sud 2026 — Devenir partenaire',
  description: 'Devenez partenaire officiel visible des Nuits du Sud 2026. Votre QR perso, votre présence dans l\u2019appli du festival, vos statistiques.',
}

export default async function NdsPartnerPage() {
  const { data } = await supabase
    .from('landings')
    .select('*')
    .eq('id', 'ld-nds-2026')
    .single()

  return <NdsClient cfg={data ?? {}} />
}
