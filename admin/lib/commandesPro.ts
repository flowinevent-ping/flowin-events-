/**
 * COMMANDES ET FACTURES DU PRO (31/10/2026) — table commandes_animation
 * (sql/2026-11-01-commandes-animation.sql + sql/commandes_animation_pro.sql).
 *
 * Lecture sous RLS avec la SESSION du pro : un pro ne lit que ses commandes, le SA lit tout.
 * Tant que les SQL ne sont pas appliques, `chargerCommandes` renvoie { etat: 'indisponible' }
 * et l'ecran affiche « bientot disponible » au lieu d'une erreur.
 */
import { supabase } from './supabase'

export interface CommandeAnimation {
  id: string
  created_at: string
  statut: string
  raison_sociale: string
  siret: string
  adresse: string
  cp: string
  ville: string
  contact_nom: string
  contact_fonction: string | null
  email: string
  tel: string
  nb_boutiques: number
  offre: 'kit_digital' | 'mensuelle' | 'annuelle'
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
  panier_moyen: number | null
  cgv_version: string | null
  signataire_nom: string
  signataire_qualite: string | null
  signature_horodatage: string | null
  signature_ip: string | null
  commercial: string | null
  pro_id: string | null
  virement_recu_at: string | null
  documents_envoyes_at: string | null
  facture_numero: string | null
  facture_emise_at: string | null
  relance_paiement_at: string | null
  paiement_maj_at: string | null
}

const COLONNES = 'id,created_at,statut,raison_sociale,siret,adresse,cp,ville,contact_nom,contact_fonction,email,tel,nb_boutiques,offre,kit,opt_quiz_qte,opt_bonus_qte,montant_abonnement_ht,montant_kit_ht,montant_options_ht,montant_ht,montant_tva,montant_ttc,mode_paiement,prelevement_inclut_reste,garantie,garantie_clients_objectif,panier_moyen,cgv_version,signataire_nom,signataire_qualite,signature_horodatage,signature_ip,commercial,pro_id,virement_recu_at,documents_envoyes_at,facture_numero,facture_emise_at,relance_paiement_at,paiement_maj_at'
/** Colonnes d'avant sql/commandes_animation_pro.sql (repli). */
const COLONNES_BASE = 'id,created_at,statut,raison_sociale,siret,adresse,cp,ville,contact_nom,contact_fonction,email,tel,nb_boutiques,offre,kit,opt_quiz_qte,opt_bonus_qte,montant_abonnement_ht,montant_kit_ht,montant_options_ht,montant_ht,montant_tva,montant_ttc,mode_paiement,prelevement_inclut_reste,garantie,garantie_clients_objectif,panier_moyen,cgv_version,signataire_nom,signataire_qualite,signature_horodatage,signature_ip,commercial'

export type EtatChargement = 'ok' | 'sans-session' | 'indisponible' | 'erreur'

const TABLE_ABSENTE = (code?: string, msg?: string) =>
  code === '42P01' || code === 'PGRST205' || /does not exist|schema cache/i.test(msg ?? '')

/** `proId` : la commande est rattachee au compte pro (colonne pro_id). */
export async function chargerCommandes(proId: string): Promise<{ etat: EtatChargement; commandes: CommandeAnimation[]; message?: string }> {
  const { data: s } = await supabase.auth.getSession()
  if (!s.session) return { etat: 'sans-session', commandes: [] }
  let rep = await supabase.from('commandes_animation').select(COLONNES).eq('pro_id', proId).order('created_at', { ascending: false })
  if (rep.error && /pro_id|virement_recu|facture|documents_envoyes|relance_paiement|paiement_maj/.test(rep.error.message)) {
    // colonnes de sql/commandes_animation_pro.sql absentes : on ne peut pas lier au pro, donc rien a afficher
    return { etat: 'indisponible', commandes: [] }
  }
  if (rep.error) {
    if (TABLE_ABSENTE(rep.error.code, rep.error.message)) return { etat: 'indisponible', commandes: [] }
    return { etat: 'erreur', commandes: [], message: rep.error.message }
  }
  return { etat: 'ok', commandes: (rep.data ?? []) as unknown as CommandeAnimation[] }
}

export { COLONNES_BASE }

export type StatutAffiche = 'attente' | 'paye' | 'documents' | 'a_reprendre' | 'annulee'

export function statutAffiche(c: CommandeAnimation): StatutAffiche {
  if (c.statut === 'annulee') return 'annulee'
  if (c.statut === 'payee' || c.statut === 'mandat_actif') return c.documents_envoyes_at ? 'documents' : 'paye'
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
  annuelle: 'Offre annuelle Flowin Animation',
  mensuelle: 'Offre mensuelle Flowin Animation',
  kit_digital: 'Kit digital Flowin',
}

export const LIBELLE_PAIEMENT: Record<string, string> = {
  virement: 'Virement bancaire',
  prelevement_sepa: 'Prélèvement SEPA (GoCardless)',
  aucun: 'Aucun (gratuit)',
}

export interface LigneCommande { lib: string; det: string; q: number; ht: number }

const PRIX_OPT = 180

/** Lignes de la commande : memes libelles que le bon de commande. */
export function lignesCommande(c: CommandeAnimation): LigneCommande[] {
  const l: LigneCommande[] = []
  if (c.offre === 'annuelle') l.push({ lib: NOM_OFFRE.annuelle, det: 'Quiz, roue, tombola, tirages, billets, stock, relances, mesure par support, 12 mois', q: 1, ht: Number(c.montant_abonnement_ht) })
  else if (c.offre === 'mensuelle') l.push({ lib: NOM_OFFRE.mensuelle + ', 1er mois', det: 'Minimum 3 mois', q: 1, ht: Number(c.montant_abonnement_ht) })
  if (c.kit === 'physique') l.push({ lib: 'Kit physique', det: 'Macarons, affiches, support de caisse', q: c.nb_boutiques, ht: Number(c.montant_kit_ht) })
  else l.push({ lib: 'Kit digital', det: 'Fichiers et QR de jeu à imprimer, gratuit', q: 1, ht: 0 })
  if (c.opt_quiz_qte > 0) l.push({ lib: 'Option : quiz personnalisé', det: 'Par animation', q: c.opt_quiz_qte, ht: PRIX_OPT * c.opt_quiz_qte })
  if (c.opt_bonus_qte > 0) l.push({ lib: 'Option : questions bonus', det: 'Par sondage', q: c.opt_bonus_qte, ht: PRIX_OPT * c.opt_bonus_qte })
  return l
}

export const eur = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number(n ?? 0) % 1 ? 2 : 0, maximumFractionDigits: 2 })

export const dateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
export const dateHeureFr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }) : '—'

/** Coordonnees de virement : celles des documents Flowin existants (bon de commande). */
export const VIREMENT = { titulaire: 'BAITA EURL', iban: 'FR76 1460 7003 3470 2211 6462 345', bic: 'CCBPFRPPMAR' }

/** Montant restant a regler par virement selon le mode de paiement. */
export function montantAVirer(c: CommandeAnimation): number {
  if (c.mode_paiement === 'aucun') return 0
  if (c.mode_paiement === 'virement') return Number(c.montant_ttc)
  const abo = Math.round(Number(c.montant_abonnement_ht) * 1.2 * 100) / 100
  return c.prelevement_inclut_reste ? 0 : Math.round((Number(c.montant_ttc) - abo) * 100) / 100
}
