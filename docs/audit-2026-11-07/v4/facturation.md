# Audit chaîne facturation Flowin — 2026-11-07 (lecture seule)

Sources : base `ywcqtupgoxfzkddqkztk` (pg_policies, pg_get_functiondef, select des tables), `admin/public/bon-commande-nds.html`, `facture-nds.html`, docs FACTURATION-AM, CGV-animation, coherence-communication v3, `lib/roadmap.ts` l.118-129. Captures : `/tmp/flowin-audit-v4/shots/facturation/{facture-nds,bon-commande-nds}.png`.

Il existe **deux chaînes** : (A) NDS / partenaires : `bons_commande` → trigger → `factures` ; (B) animation magasin : `commandes_animation` → `emettre_facture_animation()` → `factures_animation`. La chaîne B est conçue correctement mais **vide en prod** (0 commande, 0 facture, compteur vide). Toutes les factures réelles (5) passent par la chaîne A, qui est la non conforme.

## 1. Chaîne maillon par maillon

| Maillon | Déclencheur | Table | Document | Destinataire | Consultable par le pro (jeton) |
|---|---|---|---|---|---|
| Offre | prospect / commercial | `packs_participation` (1 331 / 3 331 / 500) | plaquette, nds-partenaire | prospect | n/a |
| Devis | **aucun objet devis** : le bon fait office de devis (`client.devis_ref = bon.id`) | — | — | — | non |
| Bon de commande A | SA ou pro via `bon-commande-nds.html` (n° saisi à la main) | `bons_commande` | PDF jsPDF côté navigateur, signature canvas, `cgv_version` | pro par lien `?id=` | oui, `bon_commande_public(id, jeton)` |
| Bon de commande B | client en ligne `bon-commande-animation.html` | `commandes_animation` (insert anon contrôlé : CGV + signature + statut forcé) | PDF `bon-commande-pdf.js`, email `notify-commande-animation` | client | via espace pro (RLS lecture pro) |
| Paiement A | aucun suivi : IBAN imprimé, `mode_paiement='sepa'` figé sur les 5 factures, `partenaires.statut_paiement='a_facturer'` | — | — | — | non |
| Paiement B | GoCardless webhook ou validation SA (`paiement_valide_le`, `gc_*`) | `commandes_animation` | — | — | statut visible |
| Facture A | **trigger `fn_bon_commande_chain`** dès que `bons_commande.statut` passe à valide/signé/payé — avant tout paiement ; ou saisie libre `facture-nds.html` (POST/PATCH REST) | `factures` | HTML imprimable / PDF navigateur, envoi par `mailto:` | client (mail manuel) | oui, `facture_publique(numero, jeton)` |
| Facture B | trigger `commandes_animation_facture_au_paiement` → `emettre_facture_animation` (après paiement validé) | `factures_animation` + compteur | PDF + email | client | oui (RLS + jeton) |
| Avoir | **inexistant** (A : bouton « Nouvelle édition » = facture -02 rectificative ; `deduit_facture_id` jamais utilisé ; B : rien) | — | — | — | — |
| Accès pro | A : `trg_bon_vers_pro_ins` à l'insert du bon (avant signature/paiement) ; B : `espace_pro_active_le` après paiement | `pros`, `partenaires` | — | pro | — |

## 2. Données constatées (table `factures`, ordre de création)

| numero | date_emission | bon source (statut actuel) | HT | catalogue bon |
|---|---|---|---|---|
| FL-2026-0002-01 | 2026-07-10 | envoye | 500 | 3 590 |
| FL-2026-0007-01 | 2026-07-22 | **brouillon** | 500 | 3 590 |
| FL-2026-0005-01 | 2026-08-03 | **brouillon** | 500 | 1 490 |
| FL-2026-0001-01 | 2026-08-03 | **brouillon** | 700 | 3 590 |
| FL-2026-0008-01 | 2026-09-18 | **brouillon** | 590 | — |

- **Trous** : 0003, 0004, 0006 absents (les bons existent, jamais facturés).
- **Ordre chronologique violé** : 0007 émise avant 0005 et 0001 ; 0001 émise le 03/08, après 0002 (10/07).
- **Doublons** : aucun aujourd'hui (unicité seulement par la PK/numéro), mais rien n'empêche deux bons du même jour avec le n° par défaut `FL-JJMM.AAAA` (bon-commande-nds.html:702) → collision.
- 4 factures « émises » sur des bons **revenus en brouillon** (statut modifiable par anon) : facture sans bon signé.
- `date_prestation` NULL sur les 5. `mode_paiement='sepa'` sur les 5 alors que les CGV/facture annoncent virement.
- Bons : 2/8 avec `cgv_version` signée v1-draft, 2 en v2, 4 sans CGV.

## 3. Conformité

| Point | Règle | Statut | Preuve |
|---|---|---|---|
| Numéro attribué de façon atomique en base | CGI art. 242 nonies A I-7°, BOFiP TVA-DECLA-30-20-20 (séquence chronologique continue) | **NON** (A) / OUI (B) | A : n° = `bons_commande.id || '-01'`, id saisi au clavier (bon-commande-nds.html:751/767) ; B : `update compteur set dernier=dernier+1 ... returning` sous `for update` |
| Continuité sans trou | idem | **NON** | trous 0003/0004/0006 |
| Ordre chronologique | idem | **NON** | 0007 (22/07) < 0005, 0001 (03/08) |
| Série distincte stable | BOFiP (séries possibles si chacune continue) | **NON** | série FL partagée bon/facture, suffixe d'édition, numéro dépendant du devis ; décision roadmap « FL continue » non implémentée |
| Facture émise immuable | art. 242 nonies A + L.441-9 C. com. (rectification par avoir/facture rectificative référencée) | **NON** (A) / OUI (B, trigger `factures_animation_immuable`) | policies `factures_anon_update` (anon, USING true), `factures_anon_insert` (anon), `factures_admin_all` (tout `authenticated`, y compris pros, DELETE possible) ; `facture-nds.html` PATCH `?numero=eq.` ; « Nouvelle édition » recrée -02 sans annuler la -01 |
| Confidentialité | RGPD art. 32 | **NON** | `factures_anon_select` et `bons_commande_anon_select` USING true : toute la base clients lisible avec la clé publishable ; le jeton est inutile |
| Numérotation bons/devis | bonne pratique / preuve contractuelle | **NON** | manuelle, défaut journalier non unique ; B : `AM-AAAAMMJJ-XXXXXXXX` unique aléatoire (OK, non séquentiel, acceptable pour un bon) |
| Facture après paiement / livraison | L.441-9 (émission dès réalisation de la prestation) | partiel | A : facture à la signature, sans date de prestation |
| Avoir | L.441-9, 242 nonies A (pas de suppression) | **NON** | pas de type avoir, `deduit_facture_id` inutilisé |
| Prix cohérents | L.441-1 (barème communiqué), coherence v3 P0-3 | **NON** | base 1 331/3 331/500 ; `montant_ht_catalogue` des bons 1 490/3 590/590 ; facturé 500/700/590 sans ligne de remise |

### Mentions (facture-nds.html, capture facture-nds.png)

| Mention (242 nonies A / L.441-9 / L.441-10) | Présente ? |
|---|---|
| Numéro, date d'émission | oui (numéro non conforme, cf. ci-dessus) |
| Vendeur : BAITA EURL, adresse, SIRET, RCS, TVA intracom | oui en dur (l.305-306, 365) — non placeholders ; à faire confirmer par Romain, l'auditeur ne les valide pas. Émetteur affiché « OPConsult » au lieu de la raison sociale BAITA EURL en titre (forme juridique EURL et **capital social** absents) |
| Client : raison sociale, adresse, SIRET | oui ; **n° TVA intracom client absent** (obligatoire B2B si assujetti) ; adresse de facturation si différente non prévue |
| Désignation, quantité, PU HT | oui, **une seule ligne**, pas de remise explicite (rabais vs catalogue non mentionné, obligatoire 242 nonies A I-6°) |
| Taux et montant TVA, total HT/TTC | oui, mais montants **arrondis à l'euro** (`Math.round`) au lieu du centime |
| Date de la prestation | **non** (colonne `date_prestation` NULL, seul un texte figé « 9–18 juillet » sous la ligne, faux pour les factures animation via `?event_id`) |
| Date d'échéance | oui (+30 j) |
| Pénalités de retard | oui, mais **« BCE + 10 points » contredit les CGV « 3× taux légal »** (CGV-animation art. 5) |
| Indemnité 40 € | oui |
| Escompte | oui (« pas d'escompte ») |
| Mention « TVA acquittée d'après les débits » | oui mais à confirmer (option à déclarer au SIE) |
| Référence au bon / devis | oui (`facDevis`) |
| Placeholders restants | CGV-animation : « Identifiant créancier SEPA : [à compléter] » |

Divers : `facture-nds.html` utilise `Object.assign` (règle CLAUDE.md n°3). Envoi par `mailto:` sans PDF joint, sans trace d'envoi.

## 4. Manques

1. Pas d'autorité de numérotation en base pour `factures` (chaîne A).
2. Pas d'avoir. 3. Pas de statut de paiement ni rapprochement pour A. 4. Pas d'objet devis. 5. RLS ouvertes (lecture/écriture anon). 6. Pas d'horodatage d'envoi de facture. 7. SQL 08 (`prochain_numero_facture_animation`, champs CRM) non appliqué (fonction absente en base). 8. Pas d'archivage figé (PDF/hash) de la facture émise. 9. Prix non alignés.

## 5. Suggestions

**P0**
- RLS `factures` / `bons_commande` : supprimer `*_anon_select`, `*_anon_update`, `*_anon_insert` ; `factures_admin_all` → `est_super_admin()` ; lecture pro via `facture_publique`/`bon_commande_public` uniquement (déjà SECURITY DEFINER). Fichier : nouveau `sql/NN-rls-facturation.sql`.
- Trigger d'immuabilité sur `factures` (même modèle que `factures_animation_immuable`) : refus UPDATE/DELETE quand `statut='emise'`, sauf colonnes `statut_paiement`/`jeton_public`.
- Numérotation atomique (schéma cible ci-dessous) ; `fn_bon_commande_chain` et `facture-nds.html` ne fournissent plus jamais `numero`.
- Ne plus créer la facture à la signature du bon mais au paiement / à la prestation ; `date_prestation` obligatoire (CHECK).
- Faire trancher le prix et aligner `packs_participation`, `bon-commande-nds.html:381-421`, `lib/commercial.ts:178-183` ; tout écart = ligne « Remise » explicite.
- Traiter l'existant : ne rien renuméroter ; documenter les trous 0003/0004/0006 (bons non facturés) et l'inversion de dates dans un registre, puis démarrer la nouvelle série (ex. `FL-2026-00009`) — à valider avec l'expert-comptable.

**P1**
- Avoirs : `type in ('facture','avoir')`, `deduit_facture_id` obligatoire pour un avoir, même série ou série `FL-AV`, montants négatifs ; remplacer « Nouvelle édition » (facture-nds.html:518-521) par « Émettre un avoir ».
- Numéro de bon côté base (`AM-` comme chaîne B ou séquence `BC-AAAA-NNNNN`), `docNum` en lecture seule (bon-commande-nds.html:315, 702).
- Mentions : TVA intracom client, forme + capital social, arrondi au centime, pénalités alignées sur les CGV, date de prestation réelle.
- Envoi : email Resend avec PDF + `envoyee_le` ; statut de paiement A (`payee_le`, mode réel).

**P2**
- Fusionner A et B sur un seul moteur (`emettre_facture_*` + un compteur par série : FL, FL-AM, FLR…), conforme à la décision roadmap option B.
- Archiver PDF + SHA-256 à l'émission ; vue d'export comptable (FEC-like).
- Appliquer `sql/08-bon-commande-v2.sql` après relecture.

### Schéma de numérotation cible (atomique, en base)

```sql
create table public.series_facturation (
  serie text not null, annee int not null, dernier int not null default 0,
  primary key (serie, annee));

create or replace function public.prochain_numero(p_serie text)
returns text language plpgsql security definer set search_path=public as $$
declare an int := extract(year from now() at time zone 'Europe/Paris')::int; n int;
begin
  insert into series_facturation(serie, annee) values (p_serie, an) on conflict do nothing;
  update series_facturation set dernier = dernier + 1
   where serie = p_serie and annee = an returning dernier into n;   -- verrou ligne : pas de collision
  return p_serie || '-' || an || '-' || lpad(n::text, 5, '0');
end $$;
revoke all on function public.prochain_numero(text) from anon, authenticated;

-- numéro attribué uniquement à l'émission, dans la même transaction que l'insert
create or replace function public.factures_avant_insert() returns trigger language plpgsql as $$
begin
  new.numero := prochain_numero(case when new.type = 'avoir' then 'FL-AV' else 'FL' end);
  new.date_emission := (now() at time zone 'Europe/Paris')::date;   -- ordre chronologique garanti
  return new;
end $$;
create trigger trg_factures_numero before insert on public.factures
  for each row execute function public.factures_avant_insert();
alter table public.factures add constraint factures_numero_unique unique (numero);
```
Une séquence Postgres (`nextval`) est à proscrire ici : elle ne revient pas en arrière lors d'un rollback, ce qui crée des trous. Le compteur en table, verrouillé ligne par ligne dans la transaction, n'en crée pas.
