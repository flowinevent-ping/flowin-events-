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

/* ── Packs de participation proposés dans la DEMANDE de rejoindre un super event (03/11/2026) ───────────────────────
 * DONNEES PAR DEFAUT (prix, accroches, lots, descriptifs) : elles evoluent, donc elles ne sont PAS en dur dans les pages. Un super event
 * peut definir les siennes dans super_events.cfg_jeu.packs (voir packsPourSuperEvent) ; sans cela, ces 4 options s'appliquent.
 * Descriptifs des 3 premiers packs = admin/public/nds-partenaire.html (lignes ~636-680). Montants DEFINITIFS de Romain (03/11) :
 * Visibilite 500 EUR HT, Animation 1 400 EUR HT, Sponsor 3 590 EUR HT. (nds-partenaire.html, page NDS en production, affiche encore
 * 1 490 EUR pour Animation : volontairement NON modifiee, ecart signale.) 4e option « simplement visible » : prix NON fixe.
 * Ils servent a PRESELECTIONNER la demande : rien n'est facture, « Tarif à confirmer par Flowin ». */
export interface PackDemande {
  cle: string
  nom: string
  accroche: string
  /** null = prix non fixe : « Tarif à définir avec Flowin ». */
  prixHt: number | null
  badge?: string
  /** Valeur du lot mis en jeu, en bon d'achat dans la boutique du partenaire (0 = aucun lot). */
  lotEuros: number
  inclusions: string[]
}
export const PACKS_DEMANDE: PackDemande[] = [
  { cle: 'visibilite', nom: 'Visibilité', accroche: 'Votre présence dans l’opération', prixHt: 500, lotEuros: 90, inclusions: [
    'Votre apparition dans la liste des partenaires', 'Accès à vos contacts et réseaux sociaux depuis le jeu'] },
  { cle: 'animation', nom: 'Animation', accroche: 'Faites revenir vos clients', prixHt: 1400, badge: 'Le plus choisi', lotEuros: 159, inclusions: [
    'Tout le pack Visibilité', 'Animation de votre clientèle : vos clients jouent et cumulent des tickets en venant chez vous',
    'Mise en avant sur la carte parcours des partenaires', 'Reporting de passage de votre établissement'] },
  { cle: 'sponsor', nom: 'Sponsor', accroche: 'Visibilité maximale', prixHt: 3590, lotEuros: 259, inclusions: [
    'Tout le pack Animation', 'Présence sur tous les supports et stations pendant le festival',
    'Apparition dans le bandeau défilant de l’app', 'Quiz personnalisable à votre marque'] },
  { cle: 'visible', nom: 'Je souhaite simplement être visible', accroche: 'Sponsor sans lots ni station de jeu', prixHt: null, lotEuros: 0, inclusions: [
    'Votre visibilité sur l’application', 'Votre visibilité sur les supports de communication',
    'Sans lots à gagner et sans devenir station-jeu (assurances, banques, etc.)'] },
]
/** Packs proposes pour UN super event : ceux de sa configuration (super_events.cfg_jeu.packs, liste d'objets de meme forme que
 *  PACKS_DEMANDE : prix et descriptifs modifiables par super event, sans toucher au code), sinon les 3 packs par defaut ci-dessus. */
export function packsPourSuperEvent(se: { cfg_jeu?: unknown } | null | undefined): PackDemande[] {
  const brut = se && se.cfg_jeu && typeof se.cfg_jeu === 'object' ? (se.cfg_jeu as { packs?: unknown }).packs : null
  if (!Array.isArray(brut)) return PACKS_DEMANDE
  const ok = (brut as Partial<PackDemande>[]).filter(p => p && typeof p.cle === 'string' && typeof p.nom === 'string' && (typeof p.prixHt === 'number' || p.prixHt === null) && Array.isArray(p.inclusions))
    .map(p => ({ cle: p.cle as PackDemande['cle'], nom: p.nom as string, accroche: p.accroche ?? '', prixHt: p.prixHt as number | null, badge: p.badge, lotEuros: Number(p.lotEuros) || 0, inclusions: (p.inclusions as string[]).map(String) }))
  return ok.length ? ok : PACKS_DEMANDE
}
export const MENTION_TARIF_A_CONFIRMER = 'Tarif à confirmer par Flowin'
export const MENTION_PRIX_A_DEFINIR = 'Tarif à définir avec Flowin'
export const eurosHt = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' ') + ' € HT'
/** Texte rangé dans la demande (colonne `offre`, existante) : pack souhaité + mention de confirmation. */
/** Prix affiche d'un pack : « 1 400 € HT » ou « Tarif à définir avec Flowin ». */
export const prixAffiche = (p: PackDemande) => p.prixHt === null ? MENTION_PRIX_A_DEFINIR : eurosHt(p.prixHt)
export function texteDemandePack(cle: string | null | undefined, packs: PackDemande[] = PACKS_DEMANDE): string {
  const p = packs.find(x => x.cle === cle)
  return p ? `Pack souhaité : ${p.nom} — ${prixAffiche(p)} ${p.lotEuros ? `(lot mis en jeu : ${p.lotEuros} € en bon d’achat). ` : ''}${MENTION_TARIF_A_CONFIRMER}, rien n’est facturé à ce stade.` : ''
}
