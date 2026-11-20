# Emails : envoi par Gmail depuis flowinevent@gmail.com (19/11/2026)

Pourquoi : pas de domaine, et Resend refuse d'envoyer depuis une adresse gmail.com.
Les emails partiront donc directement par Gmail, depuis **flowinevent@gmail.com**, expéditeur « Flowin Event ».
**En service depuis le 20/11/2026** : secrets posés, compteur SQL appliqué, `rappel-tickets` v3 et
`notify-commande-animation` v6 déployées (verify_jwt false). Envoi test vers flowinevent@gmail.com parti par Gmail
(journal `[mailer] gmail ok`, compteur du jour à 1). `rappel-tickets` accepte un envoi test protégé
(`{"test_email":true}` + en-tête `x-flowin-test`, jeton ponctuel non conservé ; destinataire fixe = GMAIL_USER).

## 1. Créer le mot de passe d'application Gmail (5 minutes)

1. Connecte-toi à Google avec **flowinevent@gmail.com**.
2. Va sur **myaccount.google.com → Sécurité**.
3. **Validation en deux étapes** : si elle est désactivée, active-la (téléphone). C'est obligatoire,
   sinon Google ne propose pas les mots de passe d'application.
4. Ouvre **myaccount.google.com/apppasswords** (ou tape « mots de passe des applications » dans la recherche du compte).
5. Nom de l'application : `Flowin Supabase` → **Créer**.
6. Google affiche un code de 16 lettres (4 blocs de 4). Copie-le. Il ne sera plus jamais réaffiché.

**Ne colle jamais ce code dans le chat, un email ou un fichier.** Seulement dans Supabase (étape 2).
Si tu changes un jour le mot de passe du compte Google, ce code est annulé : il faudra en recréer un.

## 2. Le coller dans Supabase

1. **supabase.com → projet Flowin → Edge Functions → Secrets** (Manage secrets).
2. Ajoute deux secrets :
   - `GMAIL_USER` = `flowinevent@gmail.com`
   - `GMAIL_APP_PASSWORD` = le code de 16 lettres (avec ou sans espaces, les deux marchent)
3. Enregistre. Puis dis-moi simplement « secrets Gmail posés ».

Tant que ces deux secrets n'existent pas, les fonctions continuent exactement comme avant (Resend).

## 3. Ce que je fais après ta confirmation

1. Créer la table du compteur journalier (`sql/2026-11-19-emails-compteur-jour.sql`).
2. Déployer `notify-commande-animation` puis `rappel-tickets` (avec le module commun `_shared/mailer.ts`).
3. Un envoi test vers flowinevent@gmail.com et lecture des journaux de la fonction.
4. Je te dis ce qui est parti et par quel canal (Gmail ou Resend).

Rien ne change sur les règles : aucun email aux clients sauf les relances, mêmes destinataires qu'aujourd'hui.

## 4. Limites

- Gmail gratuit : environ **500 emails par jour**. Garde-fou : au-delà de **450 dans la journée**,
  les envois sont sautés et notés dans les journaux ; les relances non parties repartent le lendemain.
- Une petite pause est faite entre deux emails pour ne pas déclencher les protections de Google.
- Ça suffit pour les notifications et relances actuelles. Pas pour des annonces en masse
  (1 000 emails par commerce et par mois, voir `docs/ETUDE-cout-emails-L14-2026-11-17.md`) :
  il faudra alors un domaine et un service d'envoi.

## 5. Arrivée dans les boîtes (délivrabilité)

- SPF / DKIM : corrects, car les emails partent vraiment des serveurs de Google pour une adresse gmail.com.
- Mais une adresse gmail.com qui envoie des emails automatiques peut être classée en **promotions ou spam**,
  et Google peut **bloquer temporairement** le compte si beaucoup de gens signalent « spam ».
- Les emails envoyés apparaissent dans **Envoyés** de flowinevent@gmail.com (pratique pour vérifier).
- Conseil : demander aux premiers destinataires d'ajouter flowinevent@gmail.com à leurs contacts.

## 6. Emails de connexion (mot de passe oublié, lien magique) par le même Gmail

1. **Supabase → Authentication → Emails → SMTP Settings** → activer **Enable Custom SMTP**.
2. Remplir :
   - Sender email : `flowinevent@gmail.com`
   - Sender name : `Flowin Event`
   - Host : `smtp.gmail.com`
   - Port : `465`
   - Username : `flowinevent@gmail.com`
   - Password : le même code de 16 lettres (ou un deuxième code créé à l'étape 1, nommé `Flowin Auth`)
3. Enregistrer, puis tester « mot de passe oublié » sur ton propre compte.

Ces emails comptent dans les mêmes ~500 par jour de Gmail. Cela remplace le réglage Brevo en cours.
