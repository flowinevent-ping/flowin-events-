# Règle de communication partenaire (standard, piloté par données)

Objectif : produire, pour **chaque partenaire de chaque super-event** (actuels et futurs),
trois messages standardisés — **email clients**, **Instagram**, **Facebook** — sans jamais
recoder quoi que ce soit et sans texte en dur.

## Principe

Rien n'est codé en dur dans le dashboard. Les textes sont des **données éditables** en base ;
le dashboard ne fait que les remplir. Un nouveau partenaire ou un nouveau super-event hérite
automatiquement du kit, sans intervention sur le code.

## Où vivent les éléments

| Élément | Emplacement | Rôle |
|---|---|---|
| Gabarits des 3 canaux | table `comm_templates` (`channel` = email / instagram / facebook) | textes avec placeholders `{{clef}}` — **c'est ici qu'on modifie les messages** |
| Contexte du festival | table `comm_config` (par `super_event_id`) | `evenement`, `edition`, `lieu`, `descriptif` |
| Liste des partenaires | RPC `comm_partenaires(p_se)` | partenaires commerciaux du SE (exclut les stations internes `NDS ·`) |
| Génération du kit | RPC `comm_kit(p_event_id)` | résout lien + tél + statut lot, applique la clause métier, remplit les 3 canaux |
| Écran | Dashboard → onglet **Kit com partenaire** (`nds-comm`) | choisir un partenaire → 3 blocs prêts à copier-coller |

## Résolution automatique (la « recherche des liens »)

- **Lien unique** : `events.cfg->>'qrUrl'` (repli : `.../parcours/nds2026?ev=<event_id>`).
- **Téléphone** : `partenaires.contact_tel` ou `partenaires.tel`, sinon `pros.tel` (jamais inventé).
- **Statut lot** : le partenaire **dote un lot** si `lots_stock` contient des codes pour `pt-<slug>`.
- **Vidéo** (convention) : `/nds/visuels/nds-pro-<slug>-9x16.mp4` (9:16, si fournie).

## Règle métier (garde-fou, non négociable)

Un partenaire **sans lot** (ex. Assurance Charvolin, SAFER) ne prétend **JAMAIS** en doter.
La clause de participation est choisie par `comm_kit` :

- **dote un lot** → « Nous vous offrons l'occasion de gagner vos places de concert. »
- **sans lot, 2 tickets/scan** → « En jouant via nous, vous cumulez 2 tickets d'un coup — le double de chances au tirage. »
- **sans lot, 1 ticket** → « Nous avons le plaisir de participer à ce grand jeu en tant que partenaire. »

Dans tous les cas, les lots sont attribués aux **commerçants partenaires** collectivement, jamais
au partenaire assureur/de service.

## Tonalité par canal

- **Email** : vouvoiement, signature = nom du partenaire + téléphone.
- **Instagram** : tutoiement ; le lien n'est pas cliquable en légende → **lien en bio** (ou sticker lien en Story).
- **Facebook** : vouvoiement ; le **lien est cliquable** directement dans le post.

## Placeholders disponibles

`{{partenaire}}` `{{lien}}` `{{evenement}}` `{{edition}}` `{{lieu}}` `{{descriptif}}`
`{{clause}}` `{{signature}}` `{{hashtag_partenaire}}`

## Modifier un texte sans toucher au code

```sql
update comm_templates set corps = $CT$ ...nouveau gabarit... $CT$, maj = now() where channel = 'email';
update comm_config    set edition = 'la 30e édition' where super_event_id = 'se-nds-2027';
```
