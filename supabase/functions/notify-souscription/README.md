# notify-souscription — EN PRODUCTION (testé OK)

Notifie `flowinevent@gmail.com` à chaque nouvelle souscription partenaire NDS 2026
(insertion dans `partenaires` depuis `nds-partenaire.html`, tag `nds-landing`).

## Statut (18/06/2026)
- ✅ Edge Function déployée (`notify-souscription`, verify_jwt=true)
- ✅ Secret `RESEND_API_KEY` configuré dans Supabase (compte Resend sur flowinevent@gmail.com)
- ✅ Trigger SQL `trg_notify_souscription_partenaire` sur INSERT `partenaires` (cf docs/sql/nds-notify-souscription.sql)
- ✅ Test bout-en-bout : insert tag nds-landing → net.http_post → fn → Resend `200 {ok:true}`

La capture du lead écrit dans `partenaires` (statut `en_attente_reglement`, actif=false).
Une fois le virement reçu, activer le partenaire (statut payé / actif / visible).

## Chaîne technique
landing (form pack) → INSERT partenaires (tags nds-landing)
  → trigger `trg_notify_souscription_partenaire` (net.http_post, auth anon JWT)
  → Edge Function `notify-souscription`
  → Resend → email récap vers flowinevent@gmail.com

## Secrets (Dashboard > Edge Functions > Secrets)
- `RESEND_API_KEY`  (obligatoire) ✅ configuré
- `NOTIFY_TO`       (optionnel) défaut flowinevent@gmail.com
- `NOTIFY_FROM`     (optionnel) défaut onboarding@resend.dev — passer à une adresse @domaine vérifié pour un rendu pro
- `DASHBOARD_URL`   (optionnel)
- `PROFORMA_URL`    (optionnel) lien bon de commande / proforma — active le 2e bouton du mail (dépend du SIRET, item b)

## Limites Resend (compte gratuit)
- Sans domaine vérifié : envoi uniquement vers l'adresse du compte (flowinevent@gmail.com) — OK ici.
- 100 emails/jour, 3000/mois.
- Pour envoyer depuis une adresse @flowin… : vérifier le domaine dans Resend > Domains, puis régler NOTIFY_FROM.

## Re-test manuel
Insérer (puis supprimer) une ligne taggée nds-landing :
```sql
insert into partenaires (id,nom,contact_email,tags,super_event_id,offre,montant_sponsoring,statut_paiement,actif,visible)
values ('test-x','Test','t@test.fr',ARRAY['nds-landing']::text[],'se-nds-2026','Pack Visibilité',590,'en_attente_reglement',false,false);
-- vérifier : select status_code,left(content,200) from net._http_response order by id desc limit 1;
delete from partenaires where id='test-x';
```
