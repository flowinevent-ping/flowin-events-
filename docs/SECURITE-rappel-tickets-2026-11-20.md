# Sécurité : rappel-tickets (20/11/2026)

## Problème
La fonction `rappel-tickets` (verify_jwt false) lançait le lot de relances sans aucune authentification : n'importe qui pouvait la déclencher.

## Changement (appliqué en production le 20/11/2026)
- **Secret** : `rappel_cron_secret`, généré dans Postgres (`vault.create_secret`, 32 octets hex). Il n'a jamais été affiché ni écrit dans le code, git ou un journal. Aucun secret d'Edge Function n'est nécessaire.
- **RPC** `public.rappel_cron_verifier(p_token text) returns boolean` (SECURITY DEFINER) : compare les empreintes SHA-256 du jeton reçu et du secret du Vault. EXECUTE réservé à `service_role` (retiré à public, anon, authenticated ; vérifié).
- **Cron** `tickets-rappels` : même horaire (`7 9 * * *`), même URL, appel `tickets_rappels_du_jour()` conservé, plus l'en-tête `x-flowin-cron` lu dans `vault.decrypted_secrets` (aucun secret en clair dans `cron.job`, vérifié par SELECT).
- **Fonction** `rappel-tickets` v4 (verify_jwt false) : mode normal exige `x-flowin-cron` valide (via la RPC, clé service). Absent, faux ou RPC en erreur : 403 `{"ok":false,"error":"interdit"}`, rien n'est lancé. Mode test (`test_email` + `x-flowin-test`) inchangé.
- Fichiers : `supabase/functions/rappel-tickets/index.ts`, `sql/2026-11-20-rappel-tickets-secret.sql` (appliqué, idempotent).

## Vérifications faites
- Appel sans en-tête : HTTP 403 `interdit`. La fonction n'a jamais été appelée avec l'en-tête et le cron n'a pas été déclenché à la main.
- `rappel_cron_verifier('mauvais')` et `('')` renvoient false.

## Vérifier le premier passage planifié (21/11/2026, 09:07 UTC)
- Base : `select status, return_message, start_time from cron.job_run_details order by start_time desc limit 3;` puis dans les journaux Edge de `rappel-tickets` : une requête POST **200** avec la réponse `{"ok":true,"in_app":N,"emails":M}`.
- Succès : pas de ligne d'avertissement. Échec de la protection : le journal contient exactement `rappel-tickets : appel refuse (en-tete x-flowin-cron absent ou invalide)` avec un statut 403 (le secret Vault manque ou le cron n'envoie pas l'en-tête).
- Note : `net.http_post` est asynchrone ; le statut HTTP se lit dans les journaux Edge ou `net._http_response`, pas dans `cron.job_run_details`.

## Retour arrière
1. Redéployer l'ancienne version de `rappel-tickets` (supprimer `cronAutorise` et son appel avant « 1. In-app d'abord »).
2. Remettre la commande du cron sans en-tête (bloc ROLLBACK en bas du fichier SQL).
3. Facultatif : `drop function public.rappel_cron_verifier(text);` et supprimer le secret `rappel_cron_secret` du Vault.
Ne jamais appeler la fonction avec l'en-tête ni avec un corps vide valide : cela lancerait le lot sur les vrais clients.
