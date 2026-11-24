/**
 * Creation d'un compte pro en ligne (acces + fiche `pros`), MEME mecanisme que le parcours « Ma premiere fois » :
 * signUp, reprise d'un acces deja cree sans fiche, insertion `pros` en statut en_attente avec repli sans les colonnes
 * entreprise (sql/02). Utilise par « Rejoindre un super event » (2e chemin d'inscription : coordonnees saisies au moment
 * de valider la demande). Aucune donnee inventee : tout vient du formulaire.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { proIdExiste } from './proFiche'
import { FichePro, identifiantPro, lignePro, ligneProEntreprise } from '@/lib/proCreation'
import { messageAuth, messageFr } from '@/lib/erreursFr'

export interface ResultatInscription {
  ok: boolean
  proId?: string
  /** true si une session est ouverte (pas d'email de confirmation a attendre). */
  session?: boolean
  erreur?: string
}

export async function inscrirePro(
  supabase: SupabaseClient,
  fiche: FichePro,
  memo: { current: { email: string; id: string } | null },
  source = 'rejoindre-super-event',
): Promise<ResultatInscription> {
  const adresse = fiche.email.trim()
  let userId = '', aSession = false
  if (memo.current && memo.current.email === adresse.toLowerCase()) {
    userId = memo.current.id
    const { data: s } = await supabase.auth.getSession()
    aSession = !!s.session
  } else {
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email: adresse, password: fiche.motdepasse, options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://flowin-events.vercel.app'}/pro/connexion` } })
    if (authErr || !authData.user) return { ok: false, erreur: messageAuth(authErr) }
    if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      const { data: conn, error: connErr } = await supabase.auth.signInWithPassword({ email: adresse, password: fiche.motdepasse })
      if (connErr || !conn.user) {
        return { ok: false, erreur: 'Un compte existe déjà avec cet email. Connectez-vous (lien ci-dessous), ou utilisez « Mot de passe oublié » sur la page de connexion.' }
      }
      const { data: dejaPro } = await supabase.from('pros').select('id').eq('auth_id', conn.user.id).order('created_at', { ascending: true }).limit(1)
      if (dejaPro && dejaPro.length) return { ok: true, proId: (dejaPro[0] as { id: string }).id, session: true }
      userId = conn.user.id; aSession = true
    } else {
      userId = authData.user.id; aSession = !!authData.session
    }
    memo.current = { email: adresse.toLowerCase(), id: userId }
  }
  let idPro = identifiantPro(fiche)
  /* Sécurité pros (21/11) : identifiant déjà pris ? par RPC (la table n'est plus lisible en anonyme). */
  const existe = await proIdExiste(supabase, idPro)
  if (existe) idPro = `${idPro}-${Math.random().toString(36).slice(2, 6)}`
  const ligne = lignePro(fiche, 'pro')
  const base = { ...ligne, tags: [...(ligne.tags ?? []), `source:${source}`], id: idPro, auth_id: userId }
  let { error: insErr } = await supabase.from('pros').insert({ ...base, ...ligneProEntreprise(fiche, 'premiere-fois') })
  if (insErr && (insErr.code === 'PGRST204' || insErr.code === '42703' || /column/i.test(insErr.message))) {
    insErr = (await supabase.from('pros').insert(base)).error
  }
  if (insErr) {
    return {
      ok: false,
      erreur: insErr.code === '23503'
        ? 'La création de votre accès n’a pas abouti. Réessayez ; si cela continue, utilisez une autre adresse email.'
        : insErr.code === '23505'
          ? 'Un établissement avec ces informations existe déjà. Connectez-vous, ou contactez l’équipe Flowin.'
          : `Votre accès est créé, mais la fiche n’a pas pu être enregistrée : ${messageFr(insErr)} Vous pouvez réessayer : votre compte est conservé.`,
    }
  }
  return { ok: true, proId: idPro, session: aSession }
}

/* ------------------------------------------------------------------------------------------------------------------
 * LOT 3-1 (24/11/2026) : inscription pro en 3 ecrans (Vous, Activite, Compte). Logique PURE, sans React ni reseau :
 * regles de passage par ecran et reprise d'un ancien brouillon a 7 etapes. Memes colonnes `pros` qu'avant ;
 * secteur detaille, produits et nombre de points de vente ne sont plus demandes ici : ils se completent dans Mon profil
 * (EntrepriseForm : produits_services, nb_points_vente), jamais bloquants.
 * ------------------------------------------------------------------------------------------------------------------ */
export const ETAPES_INSCRIPTION = ['Vous', 'Activité', 'Compte'] as const

export const EMAIL_OK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
export const TEL_OK = (v: string) => !v.trim() || /^(\+?\d[\d\s.-]{7,17}\d)$/.test(v.trim())
export const CP_OK = (v: string) => /^\d{5}$/.test(v.trim())

export interface DonneesEtape {
  prenom: string; nom: string; email: string; tel: string
  /** raison sociale / nom de l'etablissement */
  entreprise: string; adresse: string; codePostal: string; ville: string
  /** 'recherche' : SIRET pas encore trouve ; 'manuel' : sans SIRET ; 'prerempli' : repris de l'annuaire. */
  mode: 'recherche' | 'manuel' | 'prerempli'
  siretInvalide: string | null
  secteur: string; secteurAutre: string; motdepasse: string
}

/** Ce qui manque pour quitter l'ecran `etape` (0, 1 ou 2), par champ. Objet vide = on peut avancer. */
export function erreursEtape(etape: number, d: DonneesEtape): Record<string, string> {
  const e: Record<string, string> = {}
  if (etape === 0) {
    if (d.prenom.trim().length < 1) e.prenom = 'Votre prénom.'
    if (d.nom.trim().length < 1) e.nom = 'Votre nom.'
    if (!EMAIL_OK(d.email)) e.email = 'Un email valide : il servira à vous connecter.'
    if (d.mode === 'recherche') e.siret = d.siretInvalide ?? 'Saisissez votre SIRET (14 chiffres), ou « Pas de SIRET ».'
    else {
      if (d.entreprise.trim().length < 2) e.entreprise = 'Le nom de l’établissement.'
      if (d.adresse.trim().length < 3) e.adresse = 'Le numéro et la rue.'
      if (!CP_OK(d.codePostal)) e.codePostal = '5 chiffres.'
      if (d.ville.trim().length < 2) e.ville = 'La ville.'
    }
  }
  if (etape === 1) {
    if (!d.secteur) e.secteur = 'Choisissez le secteur le plus proche.'
    if (d.secteur === 'Autre' && d.secteurAutre.replace(/\s+/g, ' ').trim().length < 3) e.secteurAutre = 'Précisez votre activité (3 lettres minimum).'
  }
  if (etape === 2) {
    if (d.motdepasse.length < 8) e.motdepasse = '8 caractères minimum.'
    if (!TEL_OK(d.tel)) e.tel = 'Ce numéro ne semble pas valide.'
  }
  return e
}

/**
 * LOT 3-2 : statut montre sur l'ecran « Demande envoyee » du parcours Rejoindre. Lu dans cfg.diffusion_demandee.statut
 * de la station (events.cfg) quand elle existe ; sinon (demande pas encore validee : aucune station) « Demandé ».
 * Valeurs connues : 'en_attente_sa' (ecrit a la creation), 'traitee' (soldee par le SA, DiffusionOperation).
 * 'en_cours' / 'acceptee' : lues si un jour ecrites. Toute valeur inconnue se lit « Demandé » (jamais un statut invente).
 */
export function statutDemande(cfg: unknown): 'Demandé' | 'Accepté' | 'En cours' {
  const dd = cfg && typeof cfg === 'object' ? (cfg as { diffusion_demandee?: { statut?: unknown } }).diffusion_demandee : undefined
  const s = dd && typeof dd === 'object' ? dd.statut : undefined
  if (s === 'en_cours') return 'En cours'
  if (s === 'acceptee' || s === 'accepte' || s === 'traitee') return 'Accepté'
  return 'Demandé'
}

/** Un brouillon enregistre par l'ancien parcours a 7 etapes (vous, entreprise, secteur, produits, adresse, points, compte)
 *  reprend a l'ecran equivalent du parcours a 3 ecrans. Les valeurs saisies sont conservees telles quelles. */
export function etapeDepuisAncienne(ancienne: number): number {
  if (ancienne === 2) return 1
  if (ancienne >= 6) return 2
  return 0
}
