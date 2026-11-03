/* ============================================================================
   FLOWIN : CONFIGURATION CENTRALE DES PAGES STATIQUES  (source unique, 03/11/2026)
   ----------------------------------------------------------------------------
   GARANTIE_ACTIVE : offre « satisfait ou remboursé » (garantie des premiers adhérents).
     false = SUSPENDUE (valeur actuelle, décision de Romain) : l'offre n'apparaît NULLE PART
             (bon de commande, PDF, emails, CGV, plaquettes, page Super Admin, espace pro).
             Le code et les colonnes SQL (garantie, garantie_*) sont conservés, rien n'est supprimé.
     true  = l'offre réapparaît partout.
   POUR RÉACTIVER : mettre true ci-dessous, puis lancer `node admin/scripts/appliquer-config.mjs`
   (recopie la valeur dans admin/lib/flowinConfig.ts et dans le miroir supabase/functions/_shared/flowin-config.js),
   puis redéployer la fonction notify-commande-animation (emails et PDF joints).
   Contrôle : `node admin/scripts/appliquer-config.mjs --verifier` (échoue si une copie diffère).
   Les pages statiques (bon de commande, CGV, plaquette, page Super Admin des commandes) lisent ce fichier directement :
   les blocs marqués data-garantie sont masqués tant que la valeur est false.
   JavaScript ES5 (iOS Safari) : var uniquement.
   ============================================================================ */
(function (root) {
  root.FLOWIN_CONFIG = { GARANTIE_ACTIVE: false };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
