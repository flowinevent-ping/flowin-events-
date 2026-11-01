# Flowin, jeu d'animation : bons de commande, factures et préparation CRM

État : préparation seulement. Aucune intégration CRM n'est codée (nom, API et règles non confirmés). Le SQL
`sql/08-bon-commande-v2.sql` est écrit mais NON appliqué : à relire puis à appliquer à la main.

## 1. Un seul bon de commande

| Qui | Où | Comment |
|---|---|---|
| Client en ligne | `/bon-commande-animation.html` | formulaire, signature électronique |
| Vente assistée (Florine) | même page avec `?commercial=CODE` | même formulaire, champ « Commercial » repris dans le bon |
| Super Admin | `/admin-commandes-animation.html` | bouton « Bon (PDF) » sur chaque commande |
| Email client (accusé, contrat signé) | fonction `notify-commande-animation` | même PDF |
| Espace pro (historique) | `admin/lib/pdfCommande.ts` | même PDF |

Le calcul des lignes et le PDF vivent dans UN fichier : `admin/public/bon-commande-pdf.js` (`window.FlowinBonPDF`).
Sa copie `supabase/functions/_shared/bon-commande-pdf.js` doit avoir le même MD5 :
`bash scripts/verifier-bon-commande-pdf.sh` (à lancer avant chaque push). Le miroir
`admin/lib/documentsAnimation.ts` se contrôle toujours avec `node admin/scripts/verifier-documents-animation.mjs`.

## 2. Numérotation

- Référence interne, toujours : bon `AM-AAAAMMJJ-XXXXXXXX`, facture `FL-AM-AAAA-NNNNN` (compteur sans trou).
- Une seule fonction fabrique le numéro de facture : `prochain_numero_facture_animation()` (SQL 08).
  `emettre_facture_animation()` ne connaît plus le détail. Pour changer de logique, on remplace cette fonction.
- Champs CRM (tous facultatifs, jamais bloquants) sur `commandes_animation` et `factures_animation` :
  `numero_externe`, `crm_id`, `crm_synchro_le` (+ `source_numero` sur les factures).
- `facturation_config.source_numerotation` : `flowin` (défaut, comportement actuel) ou `crm`.
  En mode `crm`, le numéro légal affiché sur la facture et dans les emails est `numero_externe` (quand il est renseigné),
  avec la référence FL-AM rappelée comme « ref. interne ».
- Une facture émise reste immuable ; seules les trois colonnes CRM peuvent être renseignées après coup
  (fonction SA `admin_enregistrer_numero_crm`, journalisée).
- Export : vue `export_crm_animation` (bons + factures, une ligne par document), boutons « Export CRM (CSV) » et
  « Export CRM (JSON) » sur la page Super Admin.

## 3. Risque de double numérotation

Une facture ne doit avoir qu'UN numéro légal. Si Flowin émet `FL-AM-2026-00012` ET que le CRM émet sa propre facture
`F-2026-0187` pour la même vente, le client reçoit deux factures et la comptabilité compte deux fois.
Garde-fous prévus :
1. un seul mode actif à la fois (`source_numerotation`), choisi avant la première facture concernée ;
2. en mode `crm`, Flowin n'envoie PAS de facture tant que `numero_externe` n'est pas renseigné (à décider, voir questions) ;
3. la référence FL-AM reste interne et continue de s'incrémenter : aucun trou, aucun doublon ;
4. les factures déjà émises en FL-AM gardent leur numéro (immuables) ; le CRM reprend à partir d'une date de bascule.

## 4. Questions à poser avant tout code CRM

1. Quel est le nom exact du CRM, et quelle API (REST ? webhooks ? import CSV seulement) ?
2. Authentification (clé, OAuth), limites de débit, environnement de test disponible ?
3. Le CRM génère-t-il lui-même les devis et factures (et leurs numéros légaux), ou ne fait-il que recevoir les nôtres ?
4. Qui fait foi pour la numérotation légale, et à partir de quelle date ? Que fait-on des FL-AM déjà émises ?
5. Sens de la synchronisation : Flowin vers CRM seulement, ou aussi CRM vers Flowin (statut de paiement, avoirs) ?
6. Quand pousse-t-on : à la signature du bon, au paiement validé, ou à l'émission de la facture ?
7. Quels champs et identifiants stocker (id client, id devis, id facture) ? Un client existant est-il rapproché par SIRET ou par email ?
8. Avoirs et annulations : le CRM les gère-t-il, avec quelle numérotation ?
9. Règles de TVA, d'arrondi et de mentions légales du CRM : identiques aux nôtres (TVA 20 %, arrondi au centime) ?
10. Reprise de l'historique (commandes et factures déjà émises) : oui ou non, et sous quel format ?
11. Reprise sur erreur : que fait-on si le CRM est indisponible au moment du paiement (file d'attente, nouvel essai) ?
12. Les prélèvements mensuels (GoCardless) génèrent-ils une facture CRM par mensualité ?
13. Faut-il conserver les PDF Flowin comme pièce de référence ou le PDF du CRM remplace-t-il le nôtre ?

## 5. Garantie « satisfait ou remboursé » (rappel)

Règles inchangées : formule annuelle, première souscription uniquement, une seule fois, données certifiées puis verrouillées.
Parcours : bouton « Je veux bénéficier du satisfait ou remboursé » (plaquette, bon de commande, page de confirmation, email
d'accusé) → fiche découverte → certification → retour au bon avec la case cochée et les valeurs verrouillées. Après la commande,
la fonction SQL `souscrire_garantie_animation` (SQL 08) ajoute la garantie une seule fois, dans les 30 jours, pour une
première souscription annuelle ; dans tous les autres cas elle refuse avec un message clair.
