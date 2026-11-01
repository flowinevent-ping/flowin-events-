/**
 * COMMANDES ET FACTURES DU PRO (01/11/2026) — tables commandes_animation et factures_animation
 * (sql/03-commandes-animation.sql). UNE SEULE chaine : memes colonnes, memes statuts, memes
 * factures (FL-AM-AAAA-NNNNN) que la page Super Admin et la fonction edge.
 *
 * Lecture sous RLS avec la SESSION du pro : un pro ne lit que SES commandes et SES factures,
 * le SA lit tout. Tant que le SQL n'est pas applique, `chargerCommandes` renvoie
 * { etat: 'indisponible' } et l'ecran affiche « bientot disponible » au lieu d'une erreur.
 */
import { supabase } from './supabase'
import type { Facture } from './documentsAnimation'
import { BIC, IBAN } from './documentsAnimation'

export interface CommandeAnimation {
  id: string
  created_at: string
  statut: string
  type_commande?: 'premiere' | 'renouvellement'
  offre: 'mensuelle' | 'annuelle'
  engagement_mois?: number
  raison_sociale: string
  enseigne?: string | null
  siret: string
  adresse: string
  cp: string
  ville: string
  contact_nom: string
  contact_fonction: string | null
  email: string
  tel: string
  nb_boutiques: number
  kit: 'digital' | 'physique'
  opt_quiz_qte: number
  opt_bonus_qte: number
  montant_abonnement_ht: number
  montant_kit_ht: number
  montant_options_ht: number
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  mode_paiement: 'virement' | 'prelevement_sepa' | 'aucun'
  prelevement_inclut_reste: boolean
  garantie: boolean
  garantie_clients_objectif: number | null
  garantie_certifiee_par: string | null
  garantie_certifiee_le: string | null
  panier_moyen: number | null
  flux_journalier: string | null
  cgv_version: string | null
  engagement_accepte: boolean
  signataire_nom: string
  signataire_qualite: string | null
  signature_horodatage: string | null
  signature_ip: string | null
  commercial: string | null
  pro_id: string | null
  paiement_valide_le: string | null
  paiement_source: string | null
  paiement_valide_par: string | null
  documents_envoyes_le: string | null
  facture_numero: string | null
  relance_paiement_at: string | null
  relances_paiement: number | null
}

const COLONNES = 'id,created_at,statut,type_commande,offre,engagement_mois,engagement_accepte,raison_sociale,enseigne,siret,adresse,cp,ville,contact_nom,contact_fonction,email,tel,nb_boutiques,kit,opt_quiz_qte,opt_bonus_qte,montant_abonnement_ht,montant_kit_ht,montant_options_ht,montant_ht,montant_tva,montant_ttc,mode_paiement,prelevement_inclut_reste,garantie,garantie_clients_objectif,garantie_certifiee_le,garantie_certifiee_par,panier_moyen,flux_journalier,cgv_version,signataire_nom,signataire_qualite,signature_horodatage,signature_ip,commercial,pro_id,paiement_valide_le,paiement_source,paiement_valide_par,documents_envoyes_le,facture_numero,relance_paiement_at,relances_paiement'

export type EtatChargement = 'ok' | 'sans-session' | 'indisponible' | 'erreur'

const TABLE_ABSENTE = (code?: string, msg?: string) =>
  code === '42P01' || code === 'PGRST205' || /does not exist|schema cache|Could not find/i.test(msg ?? '')

export interface ResultatCommandes {
  etat: EtatChargement
  commandes: CommandeAnimation[]
  /** Factures emises (commande + mensualites), par numero de commande. */
  factures: Record<string, Facture[]>
  message?: string
}

/** `proId` : les commandes rattachees au compte pro (colonne pro_id, sql/03). */
export async function chargerCommandes(proId: string): Promise<ResultatCommandes> {
  const vide = { commandes: [], factures: {} }
  const { data: s } = await supabase.auth.getSession()
  if (!s.session) return { etat: 'sans-session', ...vide }
  const rep = await supabase.from('commandes_animation').select(COLONNES).eq('pro_id', proId).order('created_at', { ascending: false })
  if (rep.error) {
    if (TABLE_ABSENTE(rep.error.code, rep.error.message) || /column/i.test(rep.error.message)) return { etat: 'indisponible', ...vide }
    return { etat: 'erreur', ...vide, message: rep.error.message }
  }
  const commandes = (rep.data ?? []) as unknown as CommandeAnimation[]
  const factures: Record<string, Facture[]> = {}
  if (commandes.length) {
    const f = await supabase.from('factures_animation').select('*').in('commande_id', commandes.map(c => c.id)).order('emise_le', { ascending: true })
    ;((f.data ?? []) as unknown as Facture[]).forEach(x => { (factures[x.commande_id] = factures[x.commande_id] ?? []).push(x) })
  }
  return { etat: 'ok', commandes, factures }
}

export type StatutAffiche = 'attente' | 'paye' | 'documents' | 'a_reprendre' | 'annulee'

/** Memes regroupements que la page Super Admin : un mandat SEPA actif n'est PAS encore un paiement. */
export function statutAffiche(c: CommandeAnimation): StatutAffiche {
  if (c.statut === 'annulee') return 'annulee'
  if (c.statut === 'documents_envoyes') return 'documents'
  if (c.statut === 'payee') return 'paye'
  if (c.statut === 'mandat_echoue' || c.statut === 'paiement_echoue') return 'a_reprendre'
  return 'attente'
}

export const LIBELLE_STATUT: Record<StatutAffiche, string> = {
  attente: 'En attente de paiement',
  paye: 'Payé',
  documents: 'Documents envoyés',
  a_reprendre: 'Paiement à reprendre',
  annulee: 'Annulée',
}

export const NOM_OFFRE: Record<string, string> = {
  annuelle: 'Formule annuelle',
  mensuelle: 'Formule mensuelle',
}

export const LIBELLE_PAIEMENT: Record<string, string> = {
  virement: 'Virement bancaire',
  prelevement_sepa: 'Prélèvement SEPA (GoCardless)',
  aucun: 'Aucun (gratuit)',
}

export const eur = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number(n ?? 0) % 1 ? 2 : 0, maximumFractionDigits: 2 })

export const dateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
export const dateHeureFr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }) : '—'

/** Coordonnees de virement : celles des documents Flowin (source unique : documentsAnimation). */
export const VIREMENT = { titulaire: 'BAITA EURL', iban: IBAN, bic: BIC }

/** Montant restant a regler par virement selon le mode de paiement. */
export function montantAVirer(c: CommandeAnimation): number {
  if (c.mode_paiement === 'aucun') return 0
  if (c.mode_paiement === 'virement') return Number(c.montant_ttc)
  const abo = Math.round(Number(c.montant_abonnement_ht) * 1.2 * 100) / 100
  return c.prelevement_inclut_reste ? 0 : Math.round((Number(c.montant_ttc) - abo) * 100) / 100
}

/** Lignes de la commande : memes que le bon de commande, la facture et le contrat. */
export { lignesCommande } from './documentsAnimation'
