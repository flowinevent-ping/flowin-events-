/**
 * CONFIGURATION CENTRALE (miroir TypeScript de admin/public/flowin-config.js, 03/11/2026).
 *
 * GARANTIE_ACTIVE : offre « satisfait ou remboursé ». false = SUSPENDUE (décision de Romain) : l'offre n'apparaît nulle
 * part (espace pro, PDF, emails, CGV, plaquettes, page Super Admin des commandes). Le code et les colonnes SQL sont conservés.
 *
 * ⚠️ Ne PAS modifier à la main : la source unique est admin/public/flowin-config.js. Pour changer la valeur :
 *    1. éditer admin/public/flowin-config.js ;  2. node admin/scripts/appliquer-config.mjs  (recopie ici, dans
 *    documents.ts, documentsAnimation.ts et supabase/functions/_shared/flowin-config.js) ;  3. redéployer notify-commande-animation.
 *    Contrôle : node admin/scripts/appliquer-config.mjs --verifier
 */
export const GARANTIE_ACTIVE = false /* @config GARANTIE_ACTIVE */

/* Pose la valeur sur globalThis pour les modules partagés avec les fonctions edge (documentsAnimation.ts lit FLOWIN_CONFIG). */
if (typeof globalThis !== 'undefined') (globalThis as unknown as { FLOWIN_CONFIG?: { GARANTIE_ACTIVE: boolean } }).FLOWIN_CONFIG = { GARANTIE_ACTIVE }
