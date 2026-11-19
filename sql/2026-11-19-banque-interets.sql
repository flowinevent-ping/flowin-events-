-- =============================================================================
-- sql/2026-11-19-banque-interets.sql — Banque bonus « Centres d'intérêt » (PROPOSITION)
-- Décision de Romain (19/11/2026) : proposer 5 questions courtes, à choix, neutres,
-- sans donnée personnelle sensible. Liste à valider : docs/SUPER-EVENT-phases-2026-11-19.md.
--
-- NON APPLIQUÉ EN BASE. À exécuter dans l'éditeur SQL Supabase APRÈS validation de Romain.
-- Idempotent : on conflict (id) do update (rejouer ne crée pas de doublon).
-- Statut « brouillon », partage « prive » : invisible des pros tant que Romain n'a pas validé
-- (passer ensuite statut = 'valide', partage = 'tous_pros').
-- Clés ci_* : rangées dans « Centres d'intérêt » par admin/lib/themesBonus.ts.
-- Indépendant de sql/2026-11-19-super-event-phases.sql (ordre libre).
-- =============================================================================

insert into public.banques (id, nom, pro_id, event_ids, questions, tags, description, statut, proprietaire, partage)
values (
  'bq-bonus-centres-interets',
  'Bonus — Centres d''intérêt',
  null,
  '{}'::text[],
  '[
    {"id": "ci_musique", "type": "single", "label": "Quelle musique écoutez-vous le plus ?",
     "options": [{"val": "monde", "label": "Musiques du monde"}, {"val": "pop", "label": "Pop / rock"}, {"val": "jazz", "label": "Jazz / blues"}, {"val": "electro", "label": "Électro"}, {"val": "chanson", "label": "Chanson française"}, {"val": "classique", "label": "Classique"}]},
    {"id": "ci_sorties", "type": "single", "label": "Vous sortez le plus souvent pour…",
     "options": [{"val": "concerts", "label": "Des concerts"}, {"val": "spectacles", "label": "Des spectacles"}, {"val": "expos", "label": "Des expositions"}, {"val": "cinema", "label": "Le cinéma"}, {"val": "fetes", "label": "Les marchés et fêtes locales"}]},
    {"id": "ci_loisirs", "type": "multi", "label": "Vos loisirs préférés ?",
     "options": [{"val": "sport", "label": "Sport"}, {"val": "cuisine", "label": "Cuisine"}, {"val": "lecture", "label": "Lecture"}, {"val": "nature", "label": "Nature, randonnée"}, {"val": "jeux", "label": "Jeux"}, {"val": "jardin", "label": "Jardin, bricolage"}]},
    {"id": "ci_commerce", "type": "single", "label": "Dans un commerce près de chez vous, vous cherchez surtout…",
     "options": [{"val": "local", "label": "Des produits locaux"}, {"val": "bonsplans", "label": "Des bons plans"}, {"val": "conseil", "label": "Du conseil"}, {"val": "nouveau", "label": "Des nouveautés"}]},
    {"id": "ci_info", "type": "single", "label": "Comment apprenez-vous les événements près de chez vous ?",
     "options": [{"val": "reseaux", "label": "Réseaux sociaux"}, {"val": "bouche", "label": "Bouche-à-oreille"}, {"val": "affiches", "label": "Affiches"}, {"val": "presse", "label": "Presse, radio"}, {"val": "tourisme", "label": "Office de tourisme"}]}
  ]'::jsonb,
  array['bonus','interets','proposition']::text[],
  'Proposition Flowin à valider par Romain (19/11/2026).',
  'brouillon', 'flowin', 'prive'
)
on conflict (id) do update set
  nom = excluded.nom, questions = excluded.questions, tags = excluded.tags,
  description = excluded.description, updated_at = now();

-- Contrôle : select id, nom, statut, jsonb_array_length(questions) from public.banques where id = 'bq-bonus-centres-interets';

-- ROLLBACK (commenté) :
-- delete from public.banques where id = 'bq-bonus-centres-interets';
