# Espace pro : conformité à la spec « Ce que voit et fait un pro » (10/11/2026 soir)

Base : espace pro v2 (commit 6514ace8), complété, rien de recréé. Vérifié par `tsc --noEmit` (0 erreur), `next build` (« ✓ Compiled successfully »), Playwright sur `next start` (copie scratchpad), `?demo=1&pro=pro-charvolin`, 390x844 et 1280x900 : **0 requête non-GET vers supabase.co, 0 erreur JavaScript**. Planche : `admin/public/validation/captures/espace-pro-v3.jpg` (hub de validation, onglet Parcours pro).

| Spec | Statut | Preuve |
|---|---|---|
| Publie une animation ; un seul jeu par animation | Fait (déjà un choix unique `jeu` dans le configurateur) ; mention ajoutée « Un seul jeu par animation. Pour un autre jeu, créez une autre animation. » | `admin/components/creation/Configurateur.tsx` (écran `jeu`) |
| Plusieurs animations | Fait (liste « Mes animations », bouton « + Nouvelle animation ») | `admin/app/pro/page.tsx`, capture accueil-390 / accueil-1280 |
| Passages = nombre de flashs ET nombre de joueurs, libellés distincts | Fait : par animation et global (accueil). « passages (flashs du QR) » = `evenement_tracking.totaux.flashs` (visites sans étape) ; « joueurs (personnes distinctes) » = `totaux.joueurs`. pro-charvolin : 16 flashs = 16 visites sans étape (contrôle SQL), 2 joueurs | `admin/components/pro/RapportPro.tsx`, captures accueil-slide1, animation-rapport-390 |
| Personnes qui souhaitent rester en contact + base client existante (import) | Fait : tuiles « contacts autorisés » (optin) et « clients importés » (origine import / parrainage) sur l'accueil ; CRM « Mes contacts & stats » inchangé | `admin/app/pro/page.tsx`, capture contacts-390 |
| Export CRM | Vérifié : « Export CSV (contact autorisé) » exporte les contacts optin ; `crm_pro` (en base) inclut `clients_commerce` avec `optin = joueur.optin OR client_importé.optin` : les importés consentants sont bien exportés. `crm_pro_consentants` absente en prod : repli `crm_pro` + masquage serveur (`limiterAuConsentement`) | `admin/components/pro/CrmPro.tsx` `exporter()`, `admin/lib/crmPro.ts` |
| Un ou plusieurs Super Events, en sponsor OU station jeu | Fait (choix exclusif existant) ; libellés clarifiés « Station jeu : j'accueille le jeu » / « Sponsor, sans station » | `admin/components/creation/ParcoursCreation.tsx` (parcours rejoindre), capture rejoindre-390 |
| Super Event : flashs total de l'événement + sa station | Fait : tuile orange « flashs de tout l'événement » (2 804 pour Nuits du Sud) + « passages à votre station (flashs) » (16). Agrégat seul, pas les parties/joueurs des autres commerces | `RapportPro` prop `superEventId`, capture superevent-rapport-slide1-chiffres-390 |
| Gagnants visibles (animation et super event) | Fait : tuile « gagnants » dans le rapport + onglet « Gagnants & tirage » dans les deux cas | captures superevent-gagnants-390, animation-rapport-390 |
| Graphiques comme dans le super admin : donut, égaliseur, Hommes / Femmes, chalandise CP en % | Fait : `Camembert` du SA réutilisé (nouvelle prop `palette`, bleu #3B5CC4 / orange #C2410C, SA inchangé), donut Hommes / Femmes, donut codes postaux en % (8 premiers + « Autres », `operation_stats`), égaliseur « Parties par jour » (14 derniers jours). Agrégats uniquement | `admin/components/pro/RapportPro.tsx`, `admin/components/dashboard/Camembert.tsx`, captures slide2 à slide4 |
| Dans le Rapport d'activité et l'accueil | Fait : carrousel en tête de l'onglet « Rapport d'activité » (côté pro, `masquerGlobal`) et « Résumé de vos animations » sur l'accueil | `admin/components/operations/BlocsOperations.tsx` (`ContenuTracking`), `admin/app/pro/page.tsx` |
| Rappel « Invitez vos clients à jouer… » + partage | Fait : dernier écran du carrousel : phrase, 4 objectifs courts, Copier le lien, WhatsApp, Télécharger le QR (+ QR affiché) | `RappelPartage` dans `RapportPro.tsx`, capture accueil-slide5-rappel-390 |
| Carrousel, pas de scroll | Fait : 5 écrans ; hauteur max d'un écran 415 px à 390x844 (< 844) | mesures Playwright (script `pro-vision.js`) |

## SQL
Aucune fonction manquante : `evenement_tracking(text[])`, `operation_stats(text[], text)` (sexe, code_postal top 8 + Autres, par_jour) et `crm_pro(text)` sont en base, SECURITY DEFINER, et ne renvoient que des agrégats pour les graphiques. Aucune migration appliquée.

## Non modifiés
`NDS2026Client.tsx`, `nds2026Design.ts`. Les camemberts du détail replié (« Voir le détail ») gardent la palette SA.
