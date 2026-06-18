# notify-souscription — mise en service

Notifie `flowinevent@gmail.com` à chaque nouvelle souscription partenaire NDS 2026
(insertion dans la table `partenaires` depuis `nds-partenaire.html`).

La capture du lead fonctionne déjà (le formulaire écrit dans `partenaires` avec
`statut_paiement=en_attente_reglement`, `actif=false`). Cette fonction ajoute **uniquement**
la notification email — rien d'autre n'est modifié.

## 3 étapes (≈ 5 min)

1. **Clé Resend**
   - Créer un compte sur resend.com, générer une API key.
   - (Pour envoyer depuis une adresse @flowin… il faut vérifier le domaine dans Resend.
     Sinon l'expéditeur par défaut `onboarding@resend.dev` fonctionne pour recevoir sur Gmail.)

2. **Déployer + secret**
   ```
   supabase functions deploy notify-souscription --project-ref ywcqtupgoxfzkddqkztk
   supabase secrets set RESEND_API_KEY=re_xxx --project-ref ywcqtupgoxfzkddqkztk
   ```
   Secrets optionnels : `NOTIFY_FROM`, `NOTIFY_TO`, `DASHBOARD_URL`, `PROFORMA_URL`.

3. **Brancher le déclencheur** — Dashboard Supabase > Database > Webhooks > Create
   - Table : `partenaires` · Event : `INSERT`
   - Type : Supabase Edge Functions > `notify-souscription`

## Sécurité
- Sans `RESEND_API_KEY`, la fonction renvoie `200 {skipped:true}` : déployable sans risque.
- Aucun secret n'est committé. La clé vit uniquement dans les secrets Supabase.

## Test
```
curl -X POST https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/notify-souscription \
  -H "Content-Type: application/json" \
  -d '{"record":{"nom":"Café Test","offre":"Pack Visibilité","montant_sponsoring":590,"contact_nom":"Jean","contact_email":"jean@test.fr","contact_tel":"0600000000","adresse":"1 rue X","ville":"Vence"}}'
```
