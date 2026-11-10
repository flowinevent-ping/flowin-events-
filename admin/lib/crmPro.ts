/**
 * CRM COMPLET DU PRO (16/09 nuit) — RPC crm_pro (sql/crm_pro.sql) :
 * une ligne par joueur, toutes operations confondues (events, super events),
 * avec origines, operations jouees, parties, gains et lots.
 */
import { supabase } from './supabase'
import { libelleSource } from './nds'

export interface OperationContact { cle: string; nom: string; parties: number; derniere: string | null }
export interface ContactPro {
  joueur_id: string
  prenom: string | null; nom: string | null; email: string | null; tel: string | null
  code_postal: string | null; ville: string | null; genre: string | null; tranche_age: string | null
  optin: boolean | null; source: string | null
  origines: string[]; operations: OperationContact[]
  nb_parties: number; nb_tickets: number; nb_gains: number; lots: string[]
  premiere: string | null; derniere: string | null
}

/** Message en francais pour une erreur de lecture du CRM (jamais le texte technique de la base). */
export function messageErreurCrm(brut: string): string {
  if (/permission denied|42501|row-level security/i.test(brut)) return 'Vos contacts ne sont pas accessibles avec ce compte pour le moment. Reconnectez-vous ou contactez Flowin.'
  if (/fetch|network|timeout|failed to fetch/i.test(brut)) return 'Connexion impossible : vérifiez votre réseau puis rechargez la page.'
  return 'Vos contacts n’ont pas pu être chargés. Rechargez la page ; si le problème continue, contactez Flowin.'
}

/**
 * `sa: true` (dashboard Super Admin) : coordonnees completes. Espace pro : consentants seulement.
 * Renvoie aussi l'erreur (en francais) : « liste vide » et « lecture impossible » ne doivent jamais se confondre.
 */
export async function fetchCrmProDetail(proId: string, opts?: { sa?: boolean }): Promise<{ contacts: ContactPro[]; erreur: string | null }> {
  if (!proId) return { contacts: [], erreur: null }
  /* Espace pro : fonction qui ne renvoie les coordonnees que des joueurs consentants
     (sql/05-confidentialite-contacts.sql, phase 1). Tant qu'elle n'est pas appliquee, repli
     sur crm_pro + masque cote application (limiterAuConsentement ci-dessous). Le SA garde
     la fonction complete. */
  let rep = await supabase.rpc(opts?.sa ? 'crm_pro' : 'crm_pro_consentants', { p_pro: proId })
  if (rep.error && !opts?.sa) rep = await supabase.rpc('crm_pro', { p_pro: proId })
  const { data, error } = rep
  if (error) { console.error('[fetchCrmPro]', error.message); return { contacts: [], erreur: messageErreurCrm(error.message) } }
  const contacts = ((data ?? []) as ContactPro[]).map(c => (opts?.sa ? c : limiterAuConsentement(c))).map(c => ({
    ...c,
    origines: c.origines ?? [], operations: c.operations ?? [], lots: c.lots ?? [],
    nb_parties: Number(c.nb_parties ?? 0), nb_tickets: Number(c.nb_tickets ?? 0), nb_gains: Number(c.nb_gains ?? 0),
  }))
  return { contacts, erreur: null }
}

export async function fetchCrmPro(proId: string, opts?: { sa?: boolean }): Promise<ContactPro[]> {
  return (await fetchCrmProDetail(proId, opts)).contacts
}

/** Libelle lisible d une origine : celui du trafic (lib/nds libelleSource). */
export function libelleOrigine(o: string): string {
  if (o === 'nds2026') return 'Nuits du Sud 2026'
  if (o === 'brigade-manuel') return 'Brigade (saisie sur place)'
  if (o === 'import') return 'Fichier client importé'
  return libelleSource(o)
}

/**
 * CONTACTS UNIQUEMENT AVEC CONSENTEMENT (decision du 31/10, RGPD).
 * Un joueur qui n'a pas coche la case de consentement reste compte dans les
 * statistiques (age, genre, code postal, parties) mais ses coordonnees ne sont
 * pas transmises a l'espace pro : ni email, ni telephone, nom reduit a l'initiale.
 * Applique cote serveur, avant que les donnees n'atteignent le navigateur.
 * Les pros ne modifient jamais les coordonnees des joueurs (SA uniquement).
 */
export function limiterAuConsentement(c: ContactPro): ContactPro {
  if (c.optin === true) return c
  return { ...c, email: null, tel: null, nom: c.nom ? `${c.nom.trim().charAt(0).toUpperCase()}.` : null }
}
