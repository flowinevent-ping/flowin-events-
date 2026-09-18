import { supabase } from './supabase'

/**
 * Gestion manuelle du stock physique d'un lot (`lots_stock`) — demande de
 * Romain : « gestion des lots, stockage et déstockage ». Le déstockage
 * AUTOMATIQUE existe déjà (valider_lot, au scan du billet en caisse) ; ceci
 * ajoute le geste MANUEL, cote pro ou SA : réapprovisionner (restock reçu),
 * ou retirer une unité perdue/cassée jamais destinée à un gagnant.
 *
 * Schema reel de `lots_stock` (sql/materialiser_stock_cycles963.sql,
 * sql/billet_par_operation.sql) : id, lot_id, code, statut, partenaire,
 * utilise, utilise_at, attribue_a. On ne touche JAMAIS une ligne deja
 * `utilise = true` : c'est un billet reellement remis a un gagnant.
 */

/** Ajoute `quantite` unites disponibles au stock d'un lot deja materialise.
 *  Reprend le `partenaire` d'une ligne existante du meme lot -- on ne
 *  l'invente jamais, un lot jamais materialise en stock ne peut pas l'etre
 *  depuis cet ecran (il n'y a pas de partenaire a rattacher avec certitude). */
export async function ajouterStock(lotId: string, quantite: number): Promise<boolean> {
  if (quantite <= 0) return false
  const { data: existant, error: eErr } = await supabase
    .from('lots_stock').select('partenaire').eq('lot_id', lotId).limit(1).maybeSingle()
  if (eErr || !existant) return false

  const { count } = await supabase
    .from('lots_stock').select('id', { count: 'exact', head: true }).eq('lot_id', lotId)
  const depart = (count ?? 0) + 1
  const horodatage = Date.now()
  const lignes = Array.from({ length: quantite }, (_, i) => ({
    id: `ls-${lotId}-${horodatage}-${i}`,
    lot_id: lotId,
    code: `${lotId}-${String(depart + i).padStart(3, '0')}`,
    statut: 'disponible',
    partenaire: existant.partenaire,
    utilise: false,
  }))
  const { error } = await supabase.from('lots_stock').insert(lignes)
  if (error) console.error('[ajouterStock]', error.message)
  return !error
}

/** Retire jusqu'a `quantite` unites DISPONIBLES (jamais deja remises) du
 *  stock d'un lot -- perte, casse, erreur de saisie. Renvoie le nombre
 *  reellement retire (peut etre < quantite si le stock disponible est plus
 *  bas). */
export async function retirerStock(lotId: string, quantite: number): Promise<number> {
  if (quantite <= 0) return 0
  const { data: dispo, error: dErr } = await supabase
    .from('lots_stock').select('id').eq('lot_id', lotId).eq('utilise', false).limit(quantite)
  if (dErr || !dispo?.length) return 0
  const { error } = await supabase.from('lots_stock').delete().in('id', dispo.map(d => d.id))
  if (error) { console.error('[retirerStock]', error.message); return 0 }
  return dispo.length
}
