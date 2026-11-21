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

/* ── Tickets édités (émission des lots) ─────────────────────────────────────
   Un ticket = une unité de `lots_stock` (code unique + numéro). L'émission
   passe par les RPC de sql/2026-10-29-emission-tickets-lots.sql : elles
   verrouillent le lot et ne comblent que l'écart avec sa quantité, donc
   rappeler l'émission ne crée jamais de doublon, et elles ne retirent jamais
   un ticket attribué ou remis. Tant que cette migration n'est pas appliquée,
   les appels renvoient `indisponible` et l'écran le dit, sans rien casser. */

export interface TicketLot {
  id: string; lot_id: string | null; code: string; numero?: number | null
  statut: string | null; utilise: boolean | null; attribue_a: string | null
  utilise_at: string | null; created_at: string | null
}
export type EtatTicket = 'emis' | 'attribue' | 'remis'
export const etatTicket = (t: TicketLot): EtatTicket =>
  t.utilise ? 'remis' : t.attribue_a ? 'attribue' : 'emis'

export interface ResultatEmission {
  ok: boolean
  raison?: 'indisponible' | 'lot_introuvable' | 'non_autorise' | 'erreur' | 'remis' | 'attribue' | 'introuvable'
  emis?: number; ajoutes?: number; retires?: number; bloques?: number; quantite?: number
}

function rpcIndisponible(err: { code?: string; message?: string } | null): boolean {
  return !!err && (err.code === 'PGRST202' || /could not find the function/i.test(err.message ?? ''))
}

export async function emettreTickets(lotId: string): Promise<ResultatEmission> {
  const { data, error } = await supabase.rpc('emettre_tickets_lot', { p_lot_id: lotId })
  if (rpcIndisponible(error)) return { ok: false, raison: 'indisponible' }
  if (error || !data) { if (error) console.error('[emettreTickets]', error.message); return { ok: false, raison: 'erreur' } }
  return data as ResultatEmission
}

export async function listerTickets(lotId: string): Promise<TicketLot[]> {
  const { data, error } = await supabase.from('lots_stock').select('*').eq('lot_id', lotId)
  if (error) { console.error('[listerTickets]', error.message); return [] }
  const num = (t: TicketLot) => t.numero ?? (parseInt((t.code.match(/(\d+)$/) ?? [])[1] ?? '', 10) || 0)
  return ((data ?? []) as TicketLot[]).sort((a, b) => num(a) - num(b) || a.code.localeCompare(b.code))
}

export async function supprimerTicket(ticketId: string): Promise<ResultatEmission> {
  const { data, error } = await supabase.rpc('supprimer_ticket_lot', { p_ticket_id: ticketId })
  if (rpcIndisponible(error)) return { ok: false, raison: 'indisponible' }
  if (error || !data) { if (error) console.error('[supprimerTicket]', error.message); return { ok: false, raison: 'erreur' } }
  return data as ResultatEmission
}

/** Réappro (+n) / retrait (−n) via la quantité du lot : quantité et tickets
 *  restent alignés. `null` = RPC absente ou lot hors table `lots` -> repli. */
async function ajusterQuantite(lotId: string, delta: number): Promise<ResultatEmission | null> {
  const { data, error } = await supabase.rpc('ajuster_quantite_lot', { p_lot_id: lotId, p_delta: delta })
  if (rpcIndisponible(error)) return null
  if (error || !data) return { ok: false, raison: 'erreur' }
  const r = data as ResultatEmission
  if (!r.ok && r.raison === 'lot_introuvable') return null
  return r
}

/** Ajoute `quantite` unites disponibles au stock d'un lot deja materialise.
 *  Reprend le `partenaire` d'une ligne existante du meme lot -- on ne
 *  l'invente jamais, un lot jamais materialise en stock ne peut pas l'etre
 *  depuis cet ecran (il n'y a pas de partenaire a rattacher avec certitude). */
export async function ajouterStock(lotId: string, quantite: number): Promise<boolean> {
  if (quantite <= 0) return false
  const viaLot = await ajusterQuantite(lotId, quantite)
  if (viaLot) return viaLot.ok
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
  const viaLot = await ajusterQuantite(lotId, -quantite)
  if (viaLot) return viaLot.ok ? (viaLot.retires ?? 0) : 0
  const { data: dispo, error: dErr } = await supabase
    .from('lots_stock').select('id').eq('lot_id', lotId).eq('utilise', false).limit(quantite)
  if (dErr || !dispo?.length) return 0
  const { error } = await supabase.from('lots_stock').delete().in('id', dispo.map(d => d.id))
  if (error) { console.error('[retirerStock]', error.message); return 0 }
  return dispo.length
}
