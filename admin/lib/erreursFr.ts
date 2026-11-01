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
