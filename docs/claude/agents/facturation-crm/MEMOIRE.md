# Mémoire : facturation-crm (créée le 21/11/2026 ; ≤120 lignes)

Le chat principal ne doit PAS reposer ces questions à Romain avant d'avoir lu cette mémoire et les sources.

## Qui est Jeffrey CRM (faits documentés)
- « Jeffrey CRM » (écrit `Jeffrey-crm`, parfois « Jeffyre » dans `roadmap.ts`) est un AUTRE projet du même propriétaire, même SIRET (un seul SIRET sous BAITA EURL / OPConsult, confirmé par Romain le 18/09 pour toutes les marques dont Flowin Event) ; il édite les factures légales.
- Projet Supabase distinct `pxqeelvavgzfyrwtgmib`, org Supabase `3opconsult` (plan gratuit au 18/09), qui héberge aussi le projet Nexto `wmiawwaxwlvascyflpba` (`docs/rapatriement-compte-maitre.md`). Déployé sur Vercel `jeffrey-crm.vercel.app` (SSO Vercel actif au 18/09).
- Schéma lu le 18/09 (`admin/lib/roadmap.ts`) : tables contacts, devis, factures, frais, documents_contact, reglements_facture, toutes taguées par la colonne `espace` ; table `sequences` (compteur par espace pour les contacts, global pour devis / factures au 18/09). Espaces en production : Baïta Fenêtres & Vérandas (BAI), Opconsult (OPC), Worknfun.
- Jeffrey a déjà sa présentation de facture (FA-2026-00001, décompte du dossier, suivi des règlements) : ne pas la recréer dans Flowin.

## Schéma décidé par Romain
- Flowin Event émet la commande / la facture avec sa RÉFÉRENCE INTERNE : bon `AM-AAAAMMJJ-XXXXXXXX`, facture `FL-AM-AAAA-NNNNN` via `prochain_numero_facture_animation()` (SQL 08, seul endroit qui fabrique le numéro).
- Il la pousse à Jeffrey CRM, qui attribue le NUMÉRO LÉGAL : `facturation_config.source_numerotation = 'crm'` ; colonnes `numero_externe`, `crm_id`, `crm_synchro_le` (commandes_animation et factures_animation) ; vue d'export `export_crm_animation` ; fonction SA `admin_enregistrer_numero_crm` (journalisée) ; la référence FL-AM reste interne, continue de s'incrémenter, sans trou.
- Décisions du 18/09 (roadmap) : option B, une série continue par marque (préfixes : Flowin Event FL, Opconsult OPC, Worknfun WNF, Flowin Révision FLR, Ping PING, Baïta BT par défaut) ; câblage direct (les liens « Voir le bon / la facture » pointent vers les pages Jeffrey) ; le numéro légal est demandé à Jeffrey AVANT de générer le document (appel synchrone, incrémentation atomique), jamais poussé après coup.
- Garde-fous du doc : un seul mode à la fois ; en mode `crm`, pas d'envoi de facture tant que `numero_externe` est vide (à décider) ; factures FL-AM déjà émises gardent leur numéro (immuables), le CRM reprend à une date de bascule.
- Défaut actuel : `source_numerotation = 'flowin'` (numéro légal = FL-AM).

## Ce qui N'EST PAS construit
- Aucun code d'intégration Jeffrey CRM (pas d'appel, pas de synchronisation). Écriture dans Jeffrey bloquée tant que Romain ne donne pas le feu vert (18/09).
- API / identifiants / environnement de test de Jeffrey CRM : inconnus dans le dépôt. Valeur exacte de `espace` pour Flowin Event : non confirmée.
- Statut en production de `sql/08-bon-commande-v2.sql` : l'en-tête dit « NON APPLIQUÉ » ; non vérifié (à lire dans `list_migrations` / `pg_proc` avant de conclure). `sql/2026-11-10-lot-a.sql` (déclaration de virement, `emettre_facture_animation` nouvelle grille) : application non confirmée dans ce dépôt.
- Accès externe aux pages Jeffrey pour un client : bloqué par le SSO Vercel (options : domaine personnalisé, désactiver le SSO, page à jeton). Plan Supabase gratuit de l'org 3opconsult : pause automatique, à passer en payant avant un rôle d'autorité de numérotation.
- Avoirs : inexistants côté Flowin. Chaîne NDS (`bons_commande` / `factures`) : numéros saisis à la main, trous 0003, 0004, 0006, ordre non chronologique (audit 07/11, anciennes données, politiques depuis resserrées).

## Les 13 questions ouvertes (doc FACTURATION-AM §4, à ne pas reposer sans relire)
1. Nom exact du CRM et API : NOM maintenant connu (Jeffrey CRM) ; API, authentification, limites, environnement de test : à compléter (Q1-Q2).
2. Le CRM génère-t-il devis et factures et leurs numéros légaux ? (Q3 ; la roadmap indique que oui pour le numéro légal).
3. Qui fait foi et à partir de quelle date ; sort des FL-AM déjà émises (Q4).
4. Sens de la synchronisation, Flowin vers CRM seul ou aussi retour (statut de paiement, avoirs) (Q5).
5. Quand pousser : signature du bon, paiement validé ou émission (Q6) ; le principe 18/09 dit : numéro demandé avant génération.
6. Champs et identifiants à stocker ; rapprochement client par SIRET ou e-mail (Q7).
7. Avoirs et annulations, numérotation (Q8) ; TVA, arrondi, mentions légales (Q9).
8. Reprise de l'historique, format (Q10) ; reprise sur erreur si le CRM est indisponible (Q11).
9. Prélèvements mensuels GoCardless : une facture CRM par mensualité (Q12) ; PDF Flowin ou PDF du CRM comme référence (Q13).

## Pièges connus
- Double numérotation : Flowin et le CRM émettent chacun une facture pour la même vente : le client reçoit deux factures.
- Numéro provisoire envoyé au client puis numéro légal poussé après : le document transmis n'a pas le bon numéro.
- Copie du PDF `bon-commande-pdf.js` : doit avoir le même MD5 que la copie `_shared` (script de vérification avant push).
- `PAIEMENT_ACTIF=false` : paiement par virement déclaré (RPC `declarer_virement_animation`), pas de paiement en ligne.
- Ne pas confondre avec les bons NDS (chaîne A) : deux chaînes existent (A NDS, B animation).

## Ouvert
- Feu vert de Romain pour le projet « câblage facturation » ; valeur `espace` ; préfixe Baïta B ou BT ; mécanisme d'accès externe ; plan Supabase de Jeffrey.
- Vérifier en lecture seule l'état prod de SQL 08 et lot-a avant toute proposition.
