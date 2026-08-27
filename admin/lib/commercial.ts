import { supabase } from './supabase'

/* ── Bons de commande ──────────────────────────────────────────────────── */

export interface BonCommande {
  id: string
  created_at: string | null
  super_event_id: string | null
  raison_sociale: string | null
  adresse: string | null
  ville: string | null
  cp: string | null
  contact: string | null
  tel: string | null
  email: string | null
  siret: string | null
  offre: string | null
  offre_label: string | null
  montant_ht: number | null
  montant_tva: number | null
  montant_ttc: number | null
  montant_ht_catalogue: number | null
  signataire: string | null
  date_signature: string | null
  statut: string | null
  cgv_version: string | null
  cgv_acceptee_at: string | null
  lot_valeur: number | null
  lot_descriptif: string | null
  lot_validite: string | null
  lot_conditions: string | null
  prestations_incluses: string | null
  mention_particuliere: string | null
  partenaire_id: string | null
}

/** Un bon est signe si son statut vaut 'signe' (accentue ou non selon la saisie). */
export function estSigne(b: BonCommande): boolean {
  const s = (b.statut ?? '').toLowerCase()
  return s === 'signe' || s === 'signé'
}

export async function majBonCommande(id: string, champs: Partial<BonCommande>): Promise<boolean> {
  const { error } = await supabase.from('bons_commande').update(champs).eq('id', id)
  if (error) { console.error('[majBonCommande]', error.message); return false }
  return true
}

/**
 * Remise consentie par rapport au tarif catalogue.
 * Renvoie null quand le catalogue n est pas renseigne : on ne suppose JAMAIS
 * que le montant facture est le tarif plein.
 */
export function remise(b: BonCommande): number | null {
  if (b.montant_ht_catalogue == null || b.montant_ht == null) return null
  if (b.montant_ht_catalogue <= 0) return null
  return Math.round(100 * (1 - b.montant_ht / b.montant_ht_catalogue))
}

export async function fetchBonsCommande(superEventId?: string): Promise<BonCommande[]> {
  let q = supabase.from('bons_commande').select('*').order('created_at', { ascending: false })
  if (superEventId) q = q.eq('super_event_id', superEventId)
  const { data, error } = await q
  if (error) { console.error('[fetchBonsCommande]', error.message); return [] }
  return (data as BonCommande[]) ?? []
}

/* ── Catalogue des packs de participation (Super Event) ──────────────────
 * Source de verite unique pour les 3 offres (Visibilite / Animation /
 * Sponsor officiel). Reprend telles quelles les valeurs deja utilisees dans
 * les bons de commande NDS 2026 (admin/public/bon-commande-nds.html et
 * bons-prets/*.html) — rien invente, juste rendu editable et publiable en
 * direct depuis le dashboard SA au lieu de rester fige dans du HTML statique.
 */

export interface PackParticipation {
  id: string
  nom: string
  sous_titre: string | null
  prix_ht: number
  badge: string | null
  lot_valeur: number | null
  inclusions: string | null
  ordre: number
  updated_at: string | null
}

export async function fetchPacksParticipation(): Promise<PackParticipation[]> {
  const { data, error } = await supabase
    .from('packs_participation')
    .select('*')
    .order('ordre', { ascending: true })
  if (error) { console.error('[fetchPacksParticipation]', error.message); return [] }
  return (data as PackParticipation[]) ?? []
}

export async function majPackParticipation(id: string, champs: Partial<PackParticipation>): Promise<boolean> {
  const { error } = await supabase
    .from('packs_participation')
    .update({ ...champs, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('[majPackParticipation]', error.message); return false }
  return true
}

/* ── Prospection ───────────────────────────────────────────────────────── */

export interface Prospect {
  id: number
  ville: string | null
  cp: string | null
  type_commerce: string | null
  enseigne: string | null
  adresse: string | null
  tel: string | null
  email: string | null
  contact_nom: string | null
  etat: string | null
  resultat: string | null
  date_relance: string | null
  date_rappel: string | null
  pas_interesse: boolean | null
  note: string | null
  priorite: number | null
  created_at: string | null
  updated_at: string | null
}

export async function fetchProspects(): Promise<Prospect[]> {
  const { data, error } = await supabase
    .from('prospection')
    .select('*')
    .order('priorite', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(2000)
  if (error) { console.error('[fetchProspects]', error.message); return [] }
  return (data as Prospect[]) ?? []
}

export async function majProspect(id: number, champs: Partial<Prospect>): Promise<boolean> {
  const { error } = await supabase
    .from('prospection')
    .update({ ...champs, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('[majProspect]', error.message); return false }
  return true
}

/**
 * Une relance est EN RETARD si sa date est passee et que le dossier est toujours ouvert.
 * `pas_interesse` ferme le dossier : un prospect refuse ne peut pas etre en retard.
 */
export function relanceEnRetard(p: Prospect, aujourdhui: Date = new Date()): boolean {
  if (p.pas_interesse === true) return false
  if (!p.date_relance) return false
  return new Date(p.date_relance) < new Date(aujourdhui.toISOString().slice(0, 10))
}
