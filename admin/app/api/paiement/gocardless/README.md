# Paiement Flowin Animation magasin (GoCardless)

Bon de commande : `admin/public/bon-commande-animation.html`. Routes : `route.ts` (création du mandat) et `webhook/route.ts` (statuts).

## Variables à créer dans Vercel (Project Settings > Environment Variables)

Aucune valeur dans le dépôt. Sans les trois premières, le bouton « Prélèvement SEPA » affiche « Bientôt disponible » et le client paie par virement : rien ne plante.

| Variable | Rôle |
|---|---|
| `GOCARDLESS_ACCESS_TOKEN` | Jeton d'accès API GoCardless (Developers > Create > Access token, lecture-écriture). |
| `GOCARDLESS_WEBHOOK_SECRET` | Secret du endpoint webhook GoCardless (sert à vérifier `Webhook-Signature`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase : lecture de la commande et mise à jour du statut côté serveur. Jamais côté navigateur. |
| `GOCARDLESS_ENV` | `sandbox` (défaut) ou `live`. |
| `FLOWIN_BASE_URL` | Facultatif. Ex. `https://flowin-events.vercel.app` : base des URL de retour GoCardless. |

## Mise en route

1. Compte GoCardless de BAITA EURL (sandbox d'abord), schéma SEPA Core activé.
2. Créer le jeton d'accès, puis le webhook vers `https://flowin-events.vercel.app/api/paiement/gocardless/webhook` ; copier son secret.
3. Renseigner les variables ci-dessus dans Vercel, redéployer.
4. Appliquer `sql/2026-11-01-commandes-animation.sql` (après relecture) et déployer la fonction edge `notify-commande-animation`.
5. Tester en sandbox : commande avec « Prélèvement SEPA » ; IBAN de test GoCardless sur la page hébergée ; vérifier le statut (`mandat_en_cours` puis `mandat_actif` puis `payee`).

## Déroulé

Bon signé → insert `commandes_animation` (`en_attente_paiement`) → `POST /api/paiement/gocardless` : la route relit la commande, recalcule le montant (offre annuelle TTC, ou 1er mois de l'offre mensuelle, ou tout le bon si le client l'a choisi), crée un billing request (mandat SEPA + paiement) puis un billing request flow → redirection vers la page GoCardless, où le client saisit son IBAN et signe le mandat. L'application ne voit jamais l'IBAN. Les webhooks mettent ensuite le statut à jour : `mandat_actif`, `payee`, `mandat_echoue`, `paiement_echoue`.

Offre mensuelle : à `billing_requests.fulfilled`, le webhook crée un abonnement GoCardless mensuel (110 € HT, prélevé TTC) à partir du mois suivant (`gc_subscription_id`). Le renouvellement de l'offre annuelle n'est pas automatisé : durée et renouvellement restent à fixer dans les CGV.
