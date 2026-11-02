/**
 * MESSAGES D'ERREUR EN FRANCAIS pour l'espace pro (01/11/2026).
 *
 * Les erreurs de la base (PostgREST / Postgres / reseau) sont en anglais et techniques : « duplicate key value violates
 * unique constraint », « permission denied for table ». Un pro n'a pas a les lire. On garde le detail technique dans la
 * console (pour le support) et on affiche une phrase claire. Les messages deja ecrits en francais par nos verrous SQL
 * (« Cette option n'est pas activee sur votre compte… », « Les droits d'un pro sont reserves… ») sont conserves tels quels.
 */
export interface ErreurBase { message?: string | null; code?: string | null; hint?: string | null }

const DEJA_FRANCAIS = /[éèêàùôçœ]|\b(cette|votre|vos|les droits|réservé|reserve|impossible|invalide)\b/i

export function messageFr(e: ErreurBase | null | undefined, repli = 'Une erreur est survenue. Réessayez ; si elle continue, contactez Flowin.'): string {
  if (!e) return repli
  const m = String(e.message ?? '')
  const c = String(e.code ?? '')
  if (typeof console !== 'undefined') console.error('[erreur base]', c, m)
  if (e.hint === 'droit_pro' || c === '42501' && DEJA_FRANCAIS.test(m)) return m
  if (c === '23505' || /duplicate key|already exists/i.test(m)) return 'Cet élément existe déjà. Choisissez un autre nom ou ouvrez l’existant.'
  if (c === '23503' || /foreign key/i.test(m)) return 'Un élément lié est introuvable (compte, animation ou super event). Rechargez la page.'
  if (c === '23502' || /null value in column|not-null/i.test(m)) return 'Un champ obligatoire est vide. Complétez le formulaire puis réessayez.'
  if (c === '23514' || c === '22P02' || c === '22007' || /check constraint|invalid input syntax/i.test(m)) return 'Une valeur saisie n’est pas acceptée. Vérifiez les champs puis réessayez.'
  if (c === '42501' || /permission denied|row-level security|not authorized|JWT/i.test(m)) return 'Cette action n’est pas autorisée avec ce compte. Reconnectez-vous, ou contactez Flowin si le problème continue.'
  if (/failed to fetch|network|timeout|load failed|fetch failed/i.test(m)) return 'Connexion impossible : vérifiez votre réseau puis réessayez.'
  if (/PGRST|schema cache|Could not find|does not exist|undefined (column|table|function)/i.test(m) || /^(42703|42P01|42883|PGRST)/.test(c)) return 'Cette fonction n’est pas encore disponible. Flowin est prévenu ; réessayez plus tard.'
  if (m && DEJA_FRANCAIS.test(m)) return m
  return repli
}

/** Erreurs de l'authentification Supabase (connexion, inscription, mot de passe) en francais. */
export function messageAuth(e: { message?: string | null; code?: string | null; status?: number | null } | null | undefined): string {
  const m = String(e?.message ?? ''), c = String(e?.code ?? '')
  if (typeof console !== 'undefined' && e) console.error('[erreur auth]', c, m)
  if (/Invalid login credentials/i.test(m) || c === 'invalid_credentials') return 'Email ou mot de passe incorrect.'
  if (/Email not confirmed/i.test(m) || c === 'email_not_confirmed') return 'Votre email n’est pas encore confirmé : ouvrez le message reçu puis réessayez.'
  if (/already registered|already been registered/i.test(m) || c === 'user_already_exists') return 'Un compte existe déjà avec cet email. Connectez-vous, ou utilisez « Mot de passe oublié ».'
  if (/same.?password|different from the old/i.test(m) || c === 'same_password') return 'Choisissez un mot de passe différent de l’ancien.'
  if (/at least \d+ char|weak_password|Password should/i.test(m) || c === 'weak_password') return 'Mot de passe trop court ou trop simple : 8 caractères minimum.'
  if (/rate limit|too many|over_.*_rate_limit|after \d+ seconds/i.test(m) || e?.status === 429) return 'Trop de tentatives. Patientez une minute puis réessayez.'
  if (/valid email|invalid format|email_address_invalid/i.test(m) || c === 'email_address_invalid') return 'Cette adresse email n’est pas valide.'
  if (/signups? (not allowed|disabled)|signup_disabled/i.test(m)) return 'Les inscriptions sont momentanément fermées. Contactez Flowin.'
  if (/session missing|expired|invalid.*(token|link)|otp_expired/i.test(m)) return 'Ce lien n’est plus valable. Demandez un nouveau lien depuis « Mot de passe oublié ».'
  if (/failed to fetch|network|timeout|fetch failed/i.test(m)) return 'Connexion impossible : vérifiez votre réseau puis réessayez.'
  return 'Opération impossible pour le moment. Réessayez dans un instant ; si cela continue, contactez Flowin.'
}
