# Accès : ce que Claude peut et ne peut pas faire (21/11/2026)

Une ligne par accès. En cas de doute sur un accès : le tester en lecture seule avant de promettre quoi que ce soit.

## Peut
- GitHub : dépôt `flowin-events-` (lecture, commit, push `main` et `claude/admiring-cannon-66nr9y`, jamais de force). Identité de commit : Romain Collin `romain@flowin.events`. Déploiement Vercel automatique depuis `main` (root `/admin`).
- Supabase (connecteur MCP, projet eu-west-1 `ywcqtupgoxfzkddqkztk` ; faire `list_projects` avant toute écriture pour confirmer le projet) : lecture SQL, DML par `execute_sql`, DDL par `apply_migration` (persistant en prod : ne pas rejouer), déploiement et lecture des Edge Functions, journaux, advisors. Requêtes une par une, colonnes scalaires.
- Navigateur de test (Playwright en local, `next start` d'une copie) : parcours en `?demo=1` avec écritures non-GET bloquées et comptées ; captures à 360, 390, 430 px.
- Environnement de travail : Linux sans secrets de prod ; npm install, `npx tsc --noEmit`, `npm run build`, Acorn pour le JS vanilla.
- Production : lecture des pages publiques (flowin-events.vercel.app) et appels REST anonymes en lecture pour vérifier les droits.
- Comptes de test : `flowinevent+...@gmail.com` (plus-addressing, lignes préfixées `TEST-` / `test-`), jamais de vrais clients.
- Autres connecteurs listés dans la session (Gmail, Google Drive, Calendar, Notion, Canva, Descript) : compte réellement connecté NON vérifié ; ne les utiliser que sur demande de Romain, sans envoi à un tiers sans son go.

## Ne peut pas, ou pas seul
- Vercel : équipe `flowinevent-6745s-projects` (`team_q8jKowQF6mdJhLjWnG03U8Ur`), projet `flowin-events` (`prj_lV4qVi0hyEsqFt27me5yE04LUhKo`), déploiement automatique depuis `main`. Le connecteur Vercel d'une session Claude ne voit actuellement qu'une équipe sans rapport (« nexto ») : lire déploiements, journaux et variables est impossible. Les déploiements se vérifient en interrogeant les pages et les bundles en ligne jusqu'à ce que le changement apparaisse.
- Resend : pas d'outil direct pour Claude. Un secret `RESEND_API_KEY` existe dans les secrets des Edge Functions Supabase (posé par Romain, valeur jamais visible) : les fonctions peuvent l'utiliser. Expéditeur `onboarding@resend.dev` ; SANS domaine vérifié, Resend ne livre qu'à l'adresse du propriétaire du compte (un envoi vers une autre adresse a renvoyé 403 pendant l'E2E du 20/11). Tout le courrier réel passe désormais par Gmail (voir ci-dessous).
- Supprimer des données (DELETE) : `execute_sql` demande la confirmation de Romain ; sans réponse = timeout 230 s. Ne jamais contourner. Annoncer à l'avance, Romain devant l'écran (DEC méthode 8).
- Supabase Auth (URL de site, redirections, modèles e-mail, SMTP) et secrets des Edge Functions : réglages faits par Romain dans le tableau de bord.
- Créer un compte admin, ou lire / écrire un secret : interdit. Les secrets se posent uniquement dans Supabase par Romain.
- Envoyer un e-mail, SMS, WhatsApp ou courrier à un tiers : seulement avec le go explicite de Romain, message par message.
- Appareils réels (iPhone, Android, caméra, lecteur de billets en boutique) : non testables ici ; marquer « non vérifié ».
- Vraie écoute des voix off : Romain valide à l'oreille.

## E-mails (chaîne actuelle)
- Envoi : Gmail SMTP depuis `flowinevent@gmail.com` (expéditeur « Flowin Event », mot de passe d'application dans les secrets `GMAIL_USER` / `GMAIL_APP_PASSWORD`), via `supabase/functions/_shared/mailer.ts`. Les e-mails Supabase Auth passent aussi par ce Gmail, avec modèles français (`docs/SUPABASE-modeles-emails-FR.md`). Plafond Gmail ~500/jour, garde-fou à 450 (table compteur SQL `2026-11-19-emails-compteur-jour.sql`).
- Risques : classement promotions / spam ; blocage temporaire du compte si signalements. Pas d'envoi en masse.
- Mots de passe d'application : annulés si le mot de passe du compte Google change. Jamais dans le chat.
- Authentification Supabase (mot de passe oublié, lien e-mail) : même Gmail à régler par Romain (`docs/EMAIL-gmail-smtp-2026-11-19.md` §6).

## Données de référence
- Super Event de référence : `se-nds-2026` (Nuits du Sud 2026, 9 à 18 juillet 2026) : ne jamais mélanger avec d'autres événements.
- Factures : numérotation interne `FL-AM-AAAA-NNNNN`, bons `AM-AAAAMMJJ-XXXXXXXX` ; CRM de facturation = Jeffrey CRM, autre projet du même propriétaire (Supabase `pxqeelvavgzfyrwtgmib`, org 3opconsult) ; aucune intégration codée, accès API inconnu : voir `agents/facturation-crm/MEMOIRE.md`.
- Coordonnées publiables de Romain : non confirmées (registre : « WhatsApp et info@opconsult.co ? ») ; utiliser `[… à compléter]` sauf si déjà dans un support validé.
- 24/11/2026 · Les 5 exports (flowin_export_*, nds_export_*) ne sont plus appelables que par le serveur (service_role). Le script docs/backup/backup-crm-nds-google-sheet.gs ne fonctionne donc plus (non utilisé).
