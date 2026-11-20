# Sécurité : rappel-tickets (20/11/2026)

## Problème
La fonction `rappel-tickets` (verify_jwt false) lançait le lot de relances sans aucune authentification : n'importe qui pouvait la déclencher.

## Changement (code, `supabase/functions/rappel-tickets/index.ts`)
- Mode normal : exige l'en-tête `x-flowin-cron` égal au secret `RAPPEL_CRON_SECRET` (comparaison à temps constant). Sinon 403 `interdit`, aucun rappel ni email. Secret absent côté fonction : refus (fail-closed).
- Mode test (`test_email` + `x-flowin-test`) inchangé.
- Le cron lit le secret dans le Vault : `sql/2026-11-20-rappel-tickets-secret.sql` (rien en clair dans `cron.job`).

## État au 20/11 (rien n'est déployé ni appliqué)
Le secret d'Edge Function se saisit dans le tableau de bord Supabase (l'outil MCP ne le reçoit jamais) : il ne peut donc pas être généré puis copié dans le Vault par l'assistant. Déployer le code avant le secret ferait échouer le cron de demain. Le cron actuel (`7 9 * * *`, envoie `{}` avec la clé publishable) n'a pas été modifié.

## À faire par Romain, dans cet ordre
1. Choisir une valeur aléatoire longue. Dashboard Supabase > Edge Functions > Secrets : `RAPPEL_CRON_SECRET`.
2. Même valeur dans le Vault, nom `rappel_cron_secret`.
3. Déployer `rappel-tickets` (verify_jwt false) puis exécuter `sql/2026-11-20-rappel-tickets-secret.sql`.
4. Contrôle : un appel sans en-tête doit répondre 403 `{"ok":false,"error":"interdit"}`. Ne jamais appeler la fonction avec un corps vide et le secret : cela lancerait le lot sur les vrais clients.

## Vérifier le premier passage planifié (09:07 UTC)
Dashboard > Edge Functions > rappel-tickets > Logs : une requête POST 200 à 09:07 UTC, réponse `{"ok":true,"in_app":N,"emails":M}`. Côté base : `select status, return_message from cron.job_run_details order by start_time desc limit 3;` doit donner `succeeded`. Si 403 : le secret Vault et le secret de la fonction diffèrent, ou le Vault est vide ; ligne attendue dans les logs : `rappel-tickets : appel refuse (en-tete x-flowin-cron absent ou invalide)`.

## Retour arrière
1. Exécuter le bloc ROLLBACK en bas du fichier SQL (le cron renvoie `{}` sans en-tête).
2. Redéployer l'ancienne version de `rappel-tickets` (retirer le bloc `cronAutorise` et son appel avant « 1. In-app d'abord »).
