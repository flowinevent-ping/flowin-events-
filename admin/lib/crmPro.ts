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

/**
 * Quelle session part avec la lecture ? 'sa' : session admin (/dashboard) ; 'pro' : session supabase-js du navigateur ;
 * 'sa-dans-espace-pro' : le Super Admin qui ouvre l'espace d'un pro (/pro?pro=...) n'a pas de session pro, son jeton
 * admin est alors envoye explicitement (sinon il voyait « Connectez-vous » alors qu'il est connecte) ; null : aucune.
 */
type SessionCrm = { type: 'sa' | 'pro' | 'sa-dans-espace-pro'; jeton?: string } | null
async function sessionCrmOuverte(sa: boolean): Promise<SessionCrm> {
  if (typeof window === 'undefined') return null
  try {
    if (sa) { const s = await sessionSAFraiche(); return s ? { type: 'sa' } : null }
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) return { type: 'pro' }
    const admin = await sessionSAFraiche()
    return admin ? { type: 'sa-dans-espace-pro', jeton: admin.access_token } : null
  } catch { return null }
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
  const session = await sessionCrmOuverte(!!opts?.sa)
  if (!session) return { contacts: [], erreur: null, sansSession: true }
  let appel = supabase.rpc('crm_pro', { p_pro: proId })
  if (session.jeton) appel = appel.setHeader('Authorization', 'Bearer ' + session.jeton)
  const { data, error } = await appel
  if (error) { console.error('[fetchCrmPro]', error.message); return { contacts: [], erreur: messageErreurCrm(error.message) } }
  const contacts = ((Array.isArray(data) ? data : []) as ContactPro[]).map(normaliserContact).map(c => (opts?.sa ? c : limiterAuConsentement(c)))
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

/**
 * Forme sure d'une ligne de crm_pro : texte vide -> null, tableaux jamais null, compteurs en nombres, dates en AAAA-MM-JJ.
 * Une date « derniere » absente (joueur vu seulement par un gain, sans partie) est reprise de ses animations.
 */
export function normaliserContact(c: ContactPro): ContactPro {
  const t = (v: unknown): string | null => { const x = typeof v === 'string' ? v.trim() : ''; return x ? x : null }
  const d = (v: unknown): string | null => { const x = t(v); return x ? x.slice(0, 10) : null }
  const operations = (Array.isArray(c.operations) ? c.operations : []).map(o => ({
    cle: String(o?.cle ?? ''), nom: t(o?.nom) ?? 'Animation', parties: Number(o?.parties ?? 0) || 0, derniere: d(o?.derniere),
  }))
  const dernieresOps = operations.map(o => o.derniere).filter((x): x is string => !!x).sort()
  return {
    ...c,
    prenom: t(c.prenom), nom: t(c.nom), email: t(c.email), tel: t(c.tel),
    code_postal: t(c.code_postal), ville: t(c.ville), genre: t(c.genre), tranche_age: t(c.tranche_age), source: t(c.source),
    origines: (Array.isArray(c.origines) ? c.origines : []).filter(Boolean), operations,
    lots: (Array.isArray(c.lots) ? c.lots : []).filter(Boolean),
    nb_parties: Number(c.nb_parties ?? 0) || 0, nb_tickets: Number(c.nb_tickets ?? 0) || 0, nb_gains: Number(c.nb_gains ?? 0) || 0,
    premiere: d(c.premiere), derniere: d(c.derniere) ?? (dernieresOps.length ? dernieresOps[dernieresOps.length - 1] : null),
  }
}

/** Texte affiche a la place des coordonnees d'un joueur qui n'a pas consenti (jamais une case vide). */
export const TEXTE_NON_PARTAGE = 'Contact non partagé'

/** Nom a afficher : « Prénom Nom » ; un nom deja reduit a l'initiale par la base reste tel quel. */
export function nomContact(c: ContactPro): string {
  return `${c.prenom ?? ''} ${c.nom ?? ''}`.trim() || 'Sans nom'
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
  /* Nom deja reduit a l'initiale par la base (« D. ») : on ne le re-reduit pas. */
  const nom = c.nom ? (/^.\.$/.test(c.nom.trim()) ? c.nom.trim() : `${c.nom.trim().charAt(0).toUpperCase()}.`) : null
  return { ...c, email: null, tel: null, nom }
}
