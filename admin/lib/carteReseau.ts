/**
 * Carte du réseau (SA, /dashboard/carte-reseau) et carte publique des commerces
 * (/carte-commerces). Données : RPC carte_reseau_sa (super admin seulement) et
 * carte_commerces_publique (sans login : nom, adresse, GPS, logo, type de jeu).
 * SQL : sql/2026-11-10-sa-carte-relance.sql.
 *
 * Couleurs de catégorie (DECISIONS) : Animation = bleu, Super Event = orange.
 * Le violet ne sert ici QUE de couleur de donnée : « les deux ».
 */
import { supabase } from '@/lib/supabase'
import { ACCENT_ANIM, ACCENT_SUPER } from '@/lib/charte'

export type TypeCommerce = 'animation' | 'super_event' | 'les_deux'
export type FiltreCarte = 'animation' | 'super_event' | 'les_deux'

export interface CommerceCarte {
  cle: string
  nom: string | null
  adresse: string | null
  lat: number
  lng: number
  logo: string | null
  type: TypeCommerce
  jeux: string[]
  nb_animations?: number
  nb_super_events?: number
  actif?: boolean
  pro_id?: string | null
  /** v2 publique (17/11) : lien du jeu en cours, lot à gagner, horaires, animation en cours. */
  lien_jeu?: string | null
  lot?: string | null
  horaires?: string | null
  en_cours?: boolean | null
}

export const COULEUR_TYPE: Record<TypeCommerce, string> = {
  animation: ACCENT_ANIM,
  super_event: ACCENT_SUPER,
  les_deux: '#1B3A5C',
}

export const LIBELLE_TYPE: Record<TypeCommerce, string> = {
  animation: 'Animation',
  super_event: 'Super Event',
  les_deux: 'Les deux',
}

/** Animation : commerces qui ont une animation (seule ou avec un super event) ; idem Super Event ; Les deux : tous. */
export function filtrer(l: CommerceCarte[], f: FiltreCarte): CommerceCarte[] {
  if (f === 'les_deux') return l
  return l.filter(c => c.type === f || c.type === 'les_deux')
}

/** Normalise la réponse RPC (audit 17/11 : erreur console `g.map` sur la carte SA quand la
 *  réponse n'est pas une liste, ou quand `jeux` / GPS sont nuls). */
function propre(data: unknown): CommerceCarte[] {
  if (!Array.isArray(data)) return []
  return (data as CommerceCarte[])
    .filter(c => c && typeof c.lat === 'number' && typeof c.lng === 'number' && isFinite(c.lat) && isFinite(c.lng))
    .map(c => ({ ...c, jeux: Array.isArray(c.jeux) ? c.jeux : [], type: (c.type === 'animation' || c.type === 'super_event' || c.type === 'les_deux') ? c.type : 'animation' }))
}

export async function fetchCarteReseauSA(): Promise<CommerceCarte[]> {
  const { data, error } = await supabase.rpc('carte_reseau_sa')
  if (error) { console.error('[carte_reseau_sa]', error.message); return [] }
  return propre(data)
}

export async function fetchCarteCommercesPublique(): Promise<CommerceCarte[]> {
  const v2 = await supabase.rpc('carte_commerces_publique_v2')
  if (!v2.error) return propre(v2.data)
  const { data, error } = await supabase.rpc('carte_commerces_publique')
  if (error) { console.error('[carte_commerces_publique]', error.message); return [] }
  return propre(data)
}
