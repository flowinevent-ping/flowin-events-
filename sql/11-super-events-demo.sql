-- ============================================================================
-- 11 — SUPER EVENTS DE DEMONSTRATION (carte) + FETES DU HAUT ET MOYEN PAYS (apercu)  [03/11/2026]
-- ============================================================================
-- DONNEES, NON APPLIQUE EN BASE. A lancer a la main, avec l'accord de Romain, apres 01 (aucune autre dependance).
-- Idempotent : peut etre rejoue sans dommage (la reprise n'ecrase jamais une valeur deja posee a la main).
--
-- CE QUE CELA FAIT
--   1. Ajoute a super_events 3 colonnes de POSITION (lat, lng, lieu), facultatives : la carte « rejoindre un super event » les lit
--      (sinon elle prend la position de la premiere station, comme avant : mode degrade du code, rien ne casse).
--   2. « Nice Jazz Festival » : super event FACTICE de demonstration place a Nice (coordonnees publiques de la ville). PAS de logo officiel : logo
--      generique « jazz » dessine pour la demo (public/demo/nice-jazz-logo.svg). Ne designe aucun partenaire reel. Les dates ne sont
--      PAS inventees : date_d / date_f restent vides, la description porte « [dates à compléter] ». Aucune station, aucun pro.
--   3. « Nuits du Sud » : seule la POSITION (Vence) est posee, et seulement si elle est vide. La configuration du jeu, les stations, les
--      dates et le theme ne sont PAS touches (zone protegee).
--   5. « Evenements locaux reels » deja organises avec Flowin (lus dans les docs du depot, super events existants) : seule leur POSITION
--      (commune, coordonnees publiques) est posee, si elle est vide : Nuits du Sud (Vence), Collecte Croix-Rouge Vence 2026 (Vence).
--      Aucune autre colonne n'est touchee. Tous les evenements documentes sont a Vence : Nice Jazz (demo) est le seul ailleurs.
--   4. « Fetes du haut et moyen pays » : DEMO autorisee par Romain pour cette seule fete : logo FHMP (public/demo/fhmp-logo.svg), jeu
--      Quiz + bonus, questions de demonstration (cfg_jeu.customQuestions / customBonus, ajoutees SANS ecraser le reste de cfg_jeu).
--      Les memes valeurs sont dans admin/lib/demoFetes.ts (apercu du parcours, qui fonctionne meme sans ce SQL).
--
-- NETTOYAGE FACILE : les 2 evenements factices (Nice Jazz Festival, Fetes du haut et moyen pays) portent cfg_jeu.demo = true.
--   select id, nom from public.super_events where cfg_jeu ->> 'demo' = 'true';   -- les lister
--   Nice Jazz Festival : delete from public.super_events where id = 'se-nice-jazz-festival-demo';
--   Fetes du haut et moyen pays : retirer les cles ajoutees : update public.super_events set cfg_jeu = cfg_jeu - 'demo' - 'customQuestions' - 'customBonus' where id = 'se-fetes-du-haut-et-moyen-pays-vencois';
--
-- COORDONNEES PUBLIQUES UTILISEES (communes) : Nice 43.7102 N, 7.2620 E ; Vence 43.7229 N, 7.1116 E.
-- ============================================================================

alter table public.super_events add column if not exists lat  double precision;
alter table public.super_events add column if not exists lng  double precision;
alter table public.super_events add column if not exists lieu text;

-- 2. Nice Jazz Festival (demo)
insert into public.super_events (id, nom, description, status, module, lat, lng, lieu, events, pros, logo_url, cfg_jeu)
values ('se-nice-jazz-festival-demo', 'Nice Jazz Festival',
        'DÉMO — événement factice, non opératif (carte). Dates : [à compléter]. Organisation : [à compléter].',
        'upcoming', 'quiz', 43.7102, 7.2620, 'Nice', '{}', '{}', '/demo/nice-jazz-logo.svg', '{"demo": true}'::jsonb)
on conflict (id) do update
   set lat  = coalesce(public.super_events.lat, excluded.lat),
       lng  = coalesce(public.super_events.lng, excluded.lng),
       lieu = coalesce(public.super_events.lieu, excluded.lieu),
       cfg_jeu = coalesce(public.super_events.cfg_jeu, '{}'::jsonb) || '{"demo": true}'::jsonb;

-- 3. Nuits du Sud : position seulement, jamais la configuration
update public.super_events
   set lat = 43.7229, lng = 7.1116, lieu = 'Vence'
 where id = 'se-nds-2026' and lat is null and lng is null;

-- 3 bis. Collecte Croix-Rouge Vence 2026 (super event reel, id lu dans docs/archive) : position seulement, si elle existe et est vide
update public.super_events
   set lat = 43.7229, lng = 7.1116, lieu = 'Vence'
 where id = 'se-crf-vence-2026' and lat is null and lng is null;

-- 4. Fetes du haut et moyen pays : DEMO (logo, jeu Quiz + bonus, questions)
update public.super_events
   set lat = coalesce(lat, 43.7229), lng = coalesce(lng, 7.1116), lieu = coalesce(lieu, 'Vence'),   -- position seulement si vide
       logo_url = coalesce(nullif(logo_url, ''), '/demo/fhmp-logo.svg'),
       module   = 'quiz',
       cfg_jeu  = coalesce(cfg_jeu, '{}'::jsonb) || '{"demo":true,"customQuestions":[{"texte":"Dans quel département se trouve Vence ?","options":["Les Alpes-Maritimes","Le Var","Les Alpes-de-Haute-Provence","Le Vaucluse"],"bonne":0,"explication":"Vence se situe dans les Alpes-Maritimes (06), entre mer et montagne."},{"texte":"Quel arbre, très présent dans l’arrière-pays méditerranéen, donne une huile réputée ?","options":["Le chêne","L’olivier","Le hêtre","Le bouleau"],"bonne":1,"explication":"L’olivier est emblématique des paysages méditerranéens et de leurs fêtes."},{"texte":"Quel duo d’instruments accompagne traditionnellement les fêtes de village provençales ?","options":["Le galoubet et le tambourin","Le violon et la harpe","La cornemuse et le banjo","Le piano et la contrebasse"],"bonne":0,"explication":"Le galoubet-tambourin est l’instrument traditionnel des fêtes provençales."},{"texte":"Quelle ville voisine est célèbre pour son industrie du parfum ?","options":["Grasse","Menton","Antibes","Cannes"],"bonne":0,"explication":"Grasse est connue dans le monde entier pour ses parfums."}],"customBonus":[{"label":"Comment avez-vous connu la fête ?","options":["Bouche à oreille","Réseaux sociaux","Affiche ou flyer","Je viens chaque année"]},{"label":"Venez-vous du haut pays, du moyen pays ou d’ailleurs ?","options":["Du haut pays","Du moyen pays","Du littoral","D’ailleurs"]}]}'::jsonb
 where id = 'se-fetes-du-haut-et-moyen-pays-vencois';

-- Controles apres application :
--   select id, nom, lat, lng, lieu, date_d from public.super_events where id in ('se-nice-jazz-festival-demo', 'se-nds-2026');
--   select id, logo_url, module, cfg_jeu -> 'demo' from public.super_events where id = 'se-fetes-du-haut-et-moyen-pays-vencois';
