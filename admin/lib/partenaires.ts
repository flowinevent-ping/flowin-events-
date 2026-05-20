import { supabase } from './supabase'
import type { FlowinPartenaire } from './types'

export async function fetchPartenaires(ids: string[]): Promise<FlowinPartenaire[]> {
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('partenaires')
    .select('id,nom,emoji,description,promo_text,site_web,url,instagram,facebook,image_url,actif,visible,en_avant,couleur,type,events')
    .in('id', ids)
    .eq('actif', true)

  if (error || !data) return []
  return data as FlowinPartenaire[]
}
