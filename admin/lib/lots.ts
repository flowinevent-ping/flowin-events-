import { supabase } from './supabase'
import type { FlowinLot } from './types'

export async function fetchLots(eventId: string): Promise<FlowinLot[]> {
  const { data, error } = await supabase
    .from('lots')
    .select('id,event_id,partenaire_id,nom,titre,valeur,quantite,retire,emoji,description')
    .eq('event_id', eventId)
    .eq('retire', false)

  if (error || !data) return []
  return data as FlowinLot[]
}
