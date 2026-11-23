/**
 * CRM COMPLET DU PRO (16/09 nuit) — RPC crm_pro (sql/crm_pro.sql) :
 * une ligne par joueur, toutes operations confondues (events, super events),
 * avec origines, operations jouees, parties, gains et lots.
 */
import { supabase, sessionSAFraiche } from './supabase'
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
  /** Ticket offert : prenom du donneur (clients_commerce.parrain_id, RPC crm_parrains_pro). */
  offert_par?: string | null
}

/** Message en francais pour une erreur de lecture du CRM (jamais le texte technique de la base). */
export function messageErreurCrm(brut: string): string {
  if (/permission denied|42501|row-level security|acces refuse/i.test(brut)) return 'Vos contacts ne sont pas accessibles avec ce compte pour le moment. Reconnectez-vous ou contactez Flowin.'
  if (/fetch|network|timeout|failed to fetch/i.test(brut)) return 'Connexion impossible : vérifiez votre réseau puis rechargez la page.'
  return 'Vos contacts n’ont pas pu être chargés. Rechargez la page ; si le problème continue, contactez Flowin.'
}

/** Affiche quand aucune session n'est ouverte : jamais un tableau vide qui laisserait croire a « aucun contact ». */
export const MESSAGE_CONNEXION_CRM = 'Connectez-vous pour voir vos contacts.'

export interface ResultatCrm {
  contacts: ContactPro[]
  erreur: string | null
  /** Vrai quand aucune session n'est ouverte (la base refuse l'anonyme depuis le 23/11/2026). */
  sansSession?: boolean
}

/** Une session est-elle ouverte ? SA : session admin (/dashboard) ; pro : session supabase-js du navigateur. */
async function sessionCrmOuverte(sa: boolean): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    if (sa) return !!(await sessionSAFraiche())
    const { data } = await supabase.auth.getSession()
    return !!data.session?.access_token
  } catch { return false }
}

/**
 * CRM du pro, lu AVEC LA SESSION DU NAVIGATEUR (securite 23/11/2026, sql/2026-11-23-crm-pro-securise.sql).
 * crm_pro n'est plus executable par la cle publique : la base exige le pro proprietaire ou le super admin, et
 * masque cote serveur e-mail, telephone et nom des joueurs sans consentement. Donc :
 *  - a appeler depuis un composant client (le rendu serveur n'a pas de session) ;
 *  - `sa: true` (dashboard Super Admin) : session SA, coordonnees completes ;
 *  - sans session : { sansSession: true }, aucun appel reseau ;
 *  - le masque navigateur (limiterAuConsentement) est conserve : sans effet une fois la base a jour,
 *    il protege pendant la transition. crm_pro_consentants (sql/05) n'est plus appelee.
 * Renvoie aussi l'erreur (en francais) : « liste vide » et « lecture impossible » ne doivent jamais se confondre.
 */
export async function fetchCrmProDetail(proId: string, opts?: { sa?: boolean }): Promise<ResultatCrm> {
  if (!proId) return { contacts: [], erreur: null }
  if (!(await sessionCrmOuverte(!!opts?.sa))) return { contacts: [], erreur: null, sansSession: true }
  const { data, error } = await supabase.rpc('crm_pro', { p_pro: proId })
  if (error) { console.error('[fetchCrmPro]', error.message); return { contacts: [], erreur: messageErreurCrm(error.message) } }
  const contacts = ((Array.isArray(data) ? data : []) as ContactPro[]).map(c => (opts?.sa ? c : limiterAuConsentement(c))).map(c => ({
    ...c,
    origines: c.origines ?? [], operations: c.operations ?? [], lots: c.lots ?? [],
    nb_parties: Number(c.nb_parties ?? 0), nb_tickets: Number(c.nb_tickets ?? 0), nb_gains: Number(c.nb_gains ?? 0),
  }))
  /* Ticket offert (offrir_ticket_ami_contact) : le beneficiaire entre au fichier avec parrain_id
     = le donneur, qui y est aussi. On affiche « Offert par <prénom> ». Silencieux sans la RPC. */
  const par = await supabase.rpc('crm_parrains_pro', { p_pro: proId })
  if (!par.error && Array.isArray(par.data) && par.data.length) {
    const m = new Map<string, string | null>()
    ;(par.data as { joueur_id: string; parrain_prenom: string | null }[]).forEach(r => m.set(r.joueur_id, r.parrain_prenom))
    contacts.forEach(c => { if (m.has(c.joueur_id)) c.offert_par = m.get(c.joueur_id) || 'un ami' })
  }
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
