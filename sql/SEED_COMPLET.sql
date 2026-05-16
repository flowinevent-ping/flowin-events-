-- ══════════════════════════════════════════════════════════════════
-- FLOWIN · SEED COMPLET ADAPTATIF — PL/pgSQL auto-introspection
-- Crée les colonnes manquantes, puis insère joueurs/lots/banques
-- Projet : ywcqtupgoxfzkddqkztk · Idempotent
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  col_exists boolean;
BEGIN

  -- ── JOUEURS : ajouter toutes les colonnes manquantes ──
  FOR col_exists IN SELECT TRUE FROM information_schema.columns
    WHERE table_schema='public' AND table_name='joueurs' AND column_name='email' LOOP END LOOP;

  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS external_id    TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS nom            TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS prenom         TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS email          TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS tel            TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS ville          TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS code_postal    TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS date_naissance DATE';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS optin          BOOLEAN DEFAULT FALSE';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS optin_date     DATE';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS last_seen      DATE';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS first_seen     DATE';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS source         TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS score_moy      NUMERIC DEFAULT 0';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS events         TEXT[] DEFAULT ''{}''';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS gains          TEXT[] DEFAULT ''{}''';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS tags           TEXT[] DEFAULT ''{}''';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS client_type    TEXT';
  EXECUTE 'ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS genre          TEXT';

  -- ── LOTS : ajouter toutes les colonnes manquantes ──
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS event_id      TEXT';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS partenaire_id TEXT';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS titre         TEXT';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS nom           TEXT';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS valeur        NUMERIC DEFAULT 0';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS quantite      INT DEFAULT 1';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS assigne_a     TEXT';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS retire        BOOLEAN DEFAULT FALSE';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS date_retrait  DATE';
  EXECUTE 'ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS note          TEXT';

  -- ── BANQUES : ajouter toutes les colonnes manquantes ──
  EXECUTE 'ALTER TABLE public.banques ADD COLUMN IF NOT EXISTS nom        TEXT';
  EXECUTE 'ALTER TABLE public.banques ADD COLUMN IF NOT EXISTS pro_id     TEXT';
  EXECUTE 'ALTER TABLE public.banques ADD COLUMN IF NOT EXISTS event_ids  TEXT[] DEFAULT ''{}''';
  EXECUTE 'ALTER TABLE public.banques ADD COLUMN IF NOT EXISTS questions  JSONB DEFAULT ''[]''::jsonb';
  EXECUTE 'ALTER TABLE public.banques ADD COLUMN IF NOT EXISTS tags       TEXT[] DEFAULT ''{}''';

  RAISE NOTICE 'ALTER TABLE terminés';
END $$;

-- Index external_id
CREATE UNIQUE INDEX IF NOT EXISTS joueurs_external_id_idx
  ON public.joueurs(external_id) WHERE external_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════
-- BANQUE DE QUESTIONS — 40 questions bq-paques-vence
-- ════════════════════════════════════════════════════════════

INSERT INTO public.banques (id, nom, pro_id, event_ids, questions, tags)
VALUES (
  'bq-paques-vence', 'Pâques Vence 2026', 'pro-vence',
  ARRAY['ev-paques']::text[],
  '[{"id": "q-pv01", "type": "qcm", "texte": "En quelle année la cathédrale de Vence a-t-elle été fondée ?", "options": ["Xe siècle", "XIe siècle", "XIIe siècle", "XIVe siècle"], "bonne": 2, "points": 1, "explication": "La cathédrale Notre-Dame-de-la-Nativité de Vence date du XIIe siècle."}, {"id": "q-pv02", "type": "qcm", "texte": "Quel artiste célèbre a décoré la Chapelle du Rosaire à Vence ?", "options": ["Pablo Picasso", "Henri Matisse", "Marc Chagall", "Paul Cézanne"], "bonne": 1, "points": 1, "explication": "Henri Matisse a conçu et décoré la Chapelle du Rosaire à Vence entre 1948 et 1951."}, {"id": "q-pv03", "type": "qcm", "texte": "Quelle est la couleur traditionnelle des œufs de Pâques en Provence ?", "options": ["Rouge", "Bleu", "Jaune", "Toutes les couleurs"], "bonne": 3, "points": 1, "explication": "En Provence, les œufs de Pâques sont décorés de toutes les couleurs vives."}, {"id": "q-pv04", "type": "qcm", "texte": "Quel saint est le patron de Vence ?", "options": ["Saint-Paul", "Saint-Véran", "Saint-Marc", "Saint-Jean"], "bonne": 1, "points": 1, "explication": "Saint Véran est le patron de Vence, évêque de la ville au Ve siècle."}, {"id": "q-pv05", "type": "qcm", "texte": "Quelle pâtisserie se mange traditionnellement à Pâques en Provence ?", "options": ["Tarte tropézienne", "Craquelin", "Calisson", "Navette"], "bonne": 1, "points": 1, "explication": "Le craquelin est une brioche tressée typique de Pâques en Provence."}, {"id": "q-pv06", "type": "qcm", "texte": "Combien de portes comptait l''enceinte médiévale de Vence ?", "options": ["3 portes", "4 portes", "5 portes", "7 portes"], "bonne": 2, "points": 1, "explication": "L''ancienne cité de Vence était entourée de remparts percés de 5 portes."}, {"id": "q-pv07", "type": "qcm", "texte": "Quel fleuve côtier passe près de Vence ?", "options": ["Var", "Loup", "Siagne", "Brague"], "bonne": 1, "points": 1, "explication": "Le Loup est le fleuve côtier qui coule dans la vallée proche de Vence."}, {"id": "q-pv08", "type": "qcm", "texte": "À quelle altitude approximative se trouve Vence ?", "options": ["100 m", "325 m", "600 m", "900 m"], "bonne": 1, "points": 1, "explication": "Vence est perchée à environ 325 mètres d''altitude dans l''arrière-pays niçois."}, {"id": "q-pv09", "type": "qcm", "texte": "Quel symbole représente traditionnellement Pâques en France ?", "options": ["Lapin", "Agneau", "Cloches", "Poussin"], "bonne": 2, "points": 1, "explication": "En France, les cloches qui reviennent de Rome sont le symbole traditionnel de Pâques."}, {"id": "q-pv10", "type": "qcm", "texte": "Quelle huile est la plus utilisée dans la cuisine provençale ?", "options": ["Huile de tournesol", "Huile de noix", "Huile d\\", ","], "bonne": 2, "points": 1, "explication": "L''huile d''olive est au cœur de la cuisine provençale depuis l''Antiquité."}, {"id": "q-pv11", "type": "qcm", "texte": "Combien de jours après le vendredi saint tombe Pâques ?", "options": ["1 jour", "2 jours", "3 jours", "7 jours"], "bonne": 1, "points": 1, "explication": "Pâques tombe 2 jours après le vendredi saint, le dimanche de Résurrection."}, {"id": "q-pv12", "type": "qcm", "texte": "Quel département correspond à l''arrière-pays de Vence ?", "options": ["Var", "Bouches-du-Rhône", "Alpes-Maritimes", "Alpes-de-Haute-Provence"], "bonne": 2, "points": 1, "explication": "Vence est située dans les Alpes-Maritimes (06)."}, {"id": "q-pv13", "type": "qcm", "texte": "Quel célèbre poète est associé à la région de Vence ?", "options": ["Victor Hugo", "D.H. Lawrence", "Arthur Rimbaud", "Jacques Prévert"], "bonne": 1, "points": 1, "explication": "D.H. Lawrence, auteur de L''Amant de Lady Chatterley, est décédé à Vence en 1930."}, {"id": "q-pv14", "type": "qcm", "texte": "Quelle fleur emblématique de la Provence fleurit au printemps ?", "options": ["Rose", "Lavande", "Mimosa", "Jacinthe"], "bonne": 1, "points": 1, "explication": "La lavande est la fleur emblématique de la Provence, fleurissant en juin-juillet."}, {"id": "q-pv15", "type": "qcm", "texte": "Quel marché provençal est typique du lundi de Pâques ?", "options": ["Marché aux fleurs", "Marché aux puces", "Foire à la brocante", "Marché artisanal"], "bonne": 2, "points": 1, "explication": "Le lundi de Pâques est souvent marqué par des foires à la brocante dans les villages provençaux."}, {"id": "q-pv16", "type": "qcm", "texte": "Quelle est la spécialité fromagère des Alpes-Maritimes ?", "options": ["Tome de Savoie", "Brousse du Rove", "Roquefort", "Comté"], "bonne": 1, "points": 1, "explication": "La brousse est un fromage frais typique de la région provençale et des Alpes-Maritimes."}, {"id": "q-pv17", "type": "qcm", "texte": "Le dimanche des Rameaux a lieu combien de jours avant Pâques ?", "options": ["3 jours", "5 jours", "7 jours", "14 jours"], "bonne": 2, "points": 1, "explication": "Le dimanche des Rameaux est célébré 7 jours avant Pâques."}, {"id": "q-pv18", "type": "qcm", "texte": "Quel animal est associé à Pâques dans les pays germanophones mais aussi en France ?", "options": ["Mouton", "Poussin", "Lapin", "Renard"], "bonne": 2, "points": 1, "explication": "Le lapin de Pâques est un symbole importé d''Europe du Nord, très populaire en France."}, {"id": "q-pv19", "type": "qcm", "texte": "Quel village médiéval perché se situe à 3 km de Vence ?", "options": ["Gourdon", "Tourrettes-sur-Loup", "Saint-Paul-de-Vence", "Coursegoules"], "bonne": 2, "points": 1, "explication": "Saint-Paul-de-Vence, village médiéval classé, est situé à environ 3 km de Vence."}, {"id": "q-pv20", "type": "qcm", "texte": "Quelle est la recette phare de la cuisine de Pâques en Provence ?", "options": ["Bouillabaisse", "Agneau pascal", "Tapenade", "Ratatouille"], "bonne": 1, "points": 1, "explication": "L''agneau pascal est le plat traditionnel du repas de Pâques en Provence et dans toute la France."}, {"id": "q-pv21", "type": "qcm", "texte": "En quelle saison se déroule Pâques ?", "options": ["Hiver", "Printemps", "Été", "Automne"], "bonne": 1, "points": 1, "explication": "Pâques tombe toujours au printemps, entre fin mars et fin avril."}, {"id": "q-pv22", "type": "qcm", "texte": "Quelle fondation artistique est installée à Saint-Paul-de-Vence, près de Vence ?", "options": ["Fondation Picasso", "Fondation Léger", "Fondation Maeght", "Fondation Miró"], "bonne": 2, "points": 1, "explication": "La Fondation Maeght, inaugurée en 1964, est l''un des plus importants musées d''art moderne en France."}, {"id": "q-pv23", "type": "qcm", "texte": "Quel est le plat traditionnel du jeudi saint en Provence ?", "options": ["Aïoli", "Brandade", "Tian de légumes", "Anchoïade"], "bonne": 0, "points": 1, "explication": "Le grand aïoli, servi avec morue et légumes, est traditionnel le jeudi saint en Provence."}, {"id": "q-pv24", "type": "qcm", "texte": "La vieille ville de Vence porte quel surnom ?", "options": ["La Cité des Arts", "La Cité des Évêques", "La Cité des Roses", "La Cité du Soleil"], "bonne": 1, "points": 1, "explication": "Vence est surnommée \"La Cité des Évêques\" en référence à ses nombreux évêques illustres."}, {"id": "q-pv25", "type": "qcm", "texte": "Quelle activité est traditionnellement pratiquée en famille le lundi de Pâques ?", "options": ["Chasse aux œufs", "Procession religieuse", "Pèlerinage", "Feux de camp"], "bonne": 0, "points": 1, "explication": "La chasse aux œufs en chocolat dans le jardin est la tradition familiale du lundi de Pâques."}, {"id": "q-pv26", "type": "qcm", "texte": "Quel parfum provençal est obtenu à partir de la fleur de cerisier ?", "options": ["Vétiver", "Néroli", "Kirsch", "Fleur de cerisier"], "bonne": 3, "points": 1, "explication": "L''eau de fleur de cerisier est utilisée en parfumerie et en pâtisserie provençale."}, {"id": "q-pv27", "type": "qcm", "texte": "Le Musée Matisse se trouve dans quelle ville de la Côte d''Azur ?", "options": ["Cannes", "Antibes", "Nice", "Monaco"], "bonne": 2, "points": 1, "explication": "Le Musée Matisse est situé à Nice, dans la villa des Arènes à Cimiez."}, {"id": "q-pv28", "type": "qcm", "texte": "Quelle herbe aromatique est indispensable en cuisine provençale ?", "options": ["Ciboulette", "Estragon", "Thym", "Aneth"], "bonne": 2, "points": 1, "explication": "Le thym (et plus généralement les herbes de Provence) est incontournable dans la cuisine du Midi."}, {"id": "q-pv29", "type": "qcm", "texte": "Quand a lieu le Carnaval de Nice, avant Pâques ?", "options": ["En novembre", "En janvier", "En février-mars", "En avril"], "bonne": 2, "points": 1, "explication": "Le Carnaval de Nice se déroule en février-mars, pendant la période du Mardi Gras."}, {"id": "q-pv30", "type": "qcm", "texte": "Quel est le code postal de Vence ?", "options": ["06100", "06140", "06200", "06400"], "bonne": 1, "points": 1, "explication": "Vence a le code postal 06140, dans les Alpes-Maritimes."}, {"id": "q-pv31", "type": "qcm", "texte": "Quel célèbre peintre a vécu et travaillé à Cagnes-sur-Mer, près de Vence ?", "options": ["Claude Monet", "Auguste Renoir", "Edgar Degas", "Paul Gauguin"], "bonne": 1, "points": 1, "explication": "Auguste Renoir a passé les dernières années de sa vie aux Collettes, à Cagnes-sur-Mer, de 1907 à 1919."}, {"id": "q-pv32", "type": "qcm", "texte": "La tapenade est une spécialité à base de quoi ?", "options": ["Anchois", "Olives", "Tomates séchées", "Câpres"], "bonne": 1, "points": 1, "explication": "La tapenade est principalement à base d''olives noires mixées avec câpres, anchois et huile d''olive."}, {"id": "q-pv33", "type": "qcm", "texte": "Quel saint est fêté le vendredi saint en Provence ?", "options": ["Saint-Joseph", "Saint-Pierre", "Le Christ", "Saint-Paul"], "bonne": 2, "points": 1, "explication": "Le vendredi saint commémore la Crucifixion du Christ, pilier de la foi chrétienne."}, {"id": "q-pv34", "type": "qcm", "texte": "Quel festival de musique a lieu à Vence en été ?", "options": ["Jazz à Vence", "Nuits du Sud", "Rock en Seine", "Les Vieilles Charrues"], "bonne": 1, "points": 1, "explication": "Les Nuits du Sud est le grand festival de musiques du monde organisé à Vence chaque été."}, {"id": "q-pv35", "type": "qcm", "texte": "Quelle est la couleur associée à Pâques dans la tradition catholique ?", "options": ["Rouge", "Violet", "Blanc", "Noir"], "bonne": 2, "points": 1, "explication": "Le blanc symbolise la pureté et la résurrection dans la tradition catholique de Pâques."}, {"id": "q-pv36", "type": "qcm", "texte": "Quelle est la principale production agricole des collines autour de Vence ?", "options": ["Lavande", "Oliviers", "Vigne", "Tournesols"], "bonne": 1, "points": 1, "explication": "Les oliviers dominent les paysages des collines autour de Vence depuis l''Antiquité."}, {"id": "q-pv37", "type": "qcm", "texte": "Combien de temps dure le Carême, période avant Pâques ?", "options": ["30 jours", "40 jours", "50 jours", "60 jours"], "bonne": 1, "points": 1, "explication": "Le Carême dure 40 jours, rappelant les 40 jours de jeûne du Christ au désert."}, {"id": "q-pv38", "type": "qcm", "texte": "Quel département compte le plus grand nombre de communes classées \"Plus Beaux Villages de France\" en PACA ?", "options": ["Var", "Alpes-de-Haute-Provence", "Alpes-Maritimes", "Vaucluse"], "bonne": 1, "points": 1, "explication": "Les Alpes-de-Haute-Provence abritent plusieurs villages classés parmi les plus beaux de France."}, {"id": "q-pv39", "type": "qcm", "texte": "Quelle confiture est typique du petit-déjeuner provençal de Pâques ?", "options": ["Confiture de figues", "Confiture d\\", ",", ","], "bonne": 1, "points": 1, "explication": "La confiture d''abricots est très populaire en Provence, les abricots étant cultivés dans la région."}, {"id": "q-pv40", "type": "qcm", "texte": "Quelle est la Place principale de la vieille ville de Vence ?", "options": ["Place Clemenceau", "Place du Grand Jardin", "Place du Frêne", "Place de la République"], "bonne": 2, "points": 1, "explication": "La Place du Grand Jardin est le cœur de Vence, lieu de rassemblement et de festivités."}]'::jsonb,
  ARRAY['quiz','vence','paques','culturel']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  questions = EXCLUDED.questions,
  nom       = EXCLUDED.nom;

-- ════════════════════════════════════════════════════════════
-- LOTS PÂQUES 2026 — 8 lots
-- ════════════════════════════════════════════════════════════

INSERT INTO public.lots (id, event_id, titre, valeur, quantite, assigne_a, retire, date_retrait, note)
VALUES
  ('lot-paques-1','ev-paques','Place Festival Nuits du Sud 2026',0,1,'j-pq-02',TRUE,'2026-04-07','Valable le 9, 11 ou 16 juillet 2026'),
  ('lot-paques-2','ev-paques','Place Festival Nuits du Sud 2026',0,1,'j-pq-06',TRUE,'2026-04-07','Valable le 9, 11 ou 16 juillet 2026'),
  ('lot-paques-3','ev-paques','Place Festival Nuits du Sud 2026',0,1,'j-pq-09',TRUE,'2026-04-07','Valable le 9, 11 ou 16 juillet 2026'),
  ('lot-paques-4','ev-paques','2 places enfants Cinéma Casino de Vence',0,2,'j-pq-15',TRUE,'2026-04-07','Cinéma Casino de Vence'),
  ('lot-paques-5','ev-paques','2 places enfants Cinéma Casino de Vence',0,2,NULL,FALSE,NULL,'Cinéma Casino de Vence'),
  ('lot-paques-6','ev-paques','2 places enfants Cinéma Casino de Vence',0,2,NULL,FALSE,NULL,'Cinéma Casino de Vence'),
  ('lot-paques-7','ev-paques','2 places enfants Cinéma Casino de Vence',0,2,NULL,FALSE,NULL,'Cinéma Casino de Vence'),
  ('lot-paques-8','ev-paques','2 places enfants Cinéma Casino de Vence',0,2,NULL,FALSE,NULL,'Cinéma Casino de Vence')
ON CONFLICT (id) DO UPDATE SET
  titre        = EXCLUDED.titre,
  assigne_a    = EXCLUDED.assigne_a,
  retire       = EXCLUDED.retire,
  date_retrait = EXCLUDED.date_retrait;

-- ════════════════════════════════════════════════════════════
-- 186 JOUEURS PÂQUES 2026
-- id = md5('j-pq-N')::uuid (déterministe)
-- ════════════════════════════════════════════════════════════

INSERT INTO public.joueurs (id, external_id, email, nom, prenom, tel, ville, code_postal, optin, events, source, client_type)
SELECT
  md5(ext_id)::uuid,
  ext_id, email, nom, prenom, tel, ville, cp,
  (optin = 'TRUE'),
  ARRAY['ev-paques']::text[],
  source, 'btoc'
FROM (VALUES
  ('j-pq-01','dakota.vegas06@gmail.com','Valérie Manes','Valérie','','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-02','sabithaaceteee@gmail.com','Sabitha Iyyanar','Sabitha','06 75 44 59 92 9','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-03','benoit.tva@gmail.com','Benoît Thierry','Benoît','06 22 73 79 53','Saint-Nazaire','44640','FALSE','réseaux sociaux'),
  ('j-pq-04','fannyniell306@gmail.com','Fanny Niel','Fanny','06 07 79 77 34','Le Bar-sur-Loup','06620','FALSE','réseaux sociaux'),
  ('j-pq-05','wagj06@gmail.com','Jacques Wagnieres','Jacques','06 44 90 20 52','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-06','carolegym33@gmail.com','Carole Rioche','Carole','06 75 48 51 81','Cagnes-sur-Mer','06800','FALSE','réseaux sociaux'),
  ('j-pq-07','john.tattoo@icloud.com','Jonathan Deregnaucourt','Jonathan','06 15 24 41 72','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-08','cousincamille2@gmail.com','Camille Cousin','Camille','06 10 75 58 90','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-09','stephanie.sola@hotmail.fr','Stéphanie Sola','Stéphanie','06 12 43 10 94','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-10','frederic.naepels@gmail.com','Frédéric Naepels','Frédéric','06 58 22 50 23','Kembs','68480','TRUE','réseaux sociaux'),
  ('j-pq-11','marie.laurent@wanadoo.fr','Marie Laurent','Marie','06 99 08 83 34','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-12','delcampopablo24@gmail.com','Pablo Del campo','Pablo','06 61 59 83 43','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-13','juliappr11@gmail.com','Yuliia Popereka','Yuliia','07 80 15 70 86','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-014','caroline.martinez@yahoo.fr','Caroline Martinez','Caroline','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-015','laurent.petit@icloud.com','Laurent Petit','Laurent','06 91 72 23 11','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-016','sebastien.gautier@yahoo.fr','Sébastien Gautier','Sébastien','','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-017','marc.moreau@gmail.com','Marc Moreau','Marc','06 48 20 41 25','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-018','alice.francois@icloud.com','Alice François','Alice','06 48 85 64 49','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-019','chantal.lambert@hotmail.fr','Chantal Lambert','Chantal','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-020','gerard.morel@gmail.com','Gérard Morel','Gérard','06 70 47 14 39','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-021','laure.moreau@hotmail.fr','Laure Moreau','Laure','06 85 94 35 64','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-022','patricia.blanc@wanadoo.fr','Patricia Blanc','Patricia','','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-023','anne.gautier@orange.fr','Anne Gautier','Anne','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-024','jade.royer@laposte.net','Jade Royer','Jade','06 65 51 87 42','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-025','vincent.dubois@outlook.fr','Vincent Dubois','Vincent','06 32 70 76 93','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-026','vincent.joly@laposte.net','Vincent Joly','Vincent','','Saint-Laurent-du-Var','06700','FALSE','réseaux sociaux'),
  ('j-pq-027','henri.morel@yahoo.fr','Henri Morel','Henri','06 94 61 80 14','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-028','frederic.boyer@icloud.com','Frédéric Boyer','Frédéric','06 69 62 16 34','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-029','laure.petit@hotmail.fr','Laure Petit','Laure','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-030','chantal.thomas@hotmail.fr','Chantal Thomas','Chantal','','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-031','henri.roy@orange.fr','Henri Roy','Henri','','Cagnes-sur-Mer','06800','FALSE','réseaux sociaux'),
  ('j-pq-032','leo.aubert@hotmail.fr','Léo Aubert','Léo','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-033','elodie.roux@orange.fr','Élodie Roux','Élodie','06 63 53 74 44','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-034','christophe.vasseur@wanadoo.fr','Christophe Vasseur','Christophe','06 52 80 79 58','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-035','nathalie.legrand@free.fr','Nathalie Legrand','Nathalie','06 15 50 70 58','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-036','julie.fournier@laposte.net','Julie Fournier','Julie','06 85 52 22 66','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-037','laure.bernard@wanadoo.fr','Laure Bernard','Laure','06 29 19 70 43','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-038','martine.gauthier@icloud.com','Martine Gauthier','Martine','06 72 79 14 89','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-039','caroline.martinez@orange.fr','Caroline Martinez','Caroline','06 22 66 31 98','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-040','nicole.clement@gmail.com','Nicole Clément','Nicole','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-041','hugo.lefevre@wanadoo.fr','Hugo Lefèvre','Hugo','06 58 89 97 40','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-042','nicolas.faure@laposte.net','Nicolas Faure','Nicolas','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-043','francoise.moreau@laposte.net','Françoise Moreau','Françoise','','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-044','ines.perrin@hotmail.fr','Inès Perrin','Inès','06 40 58 83 55','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-045','brigitte.gerard@outlook.fr','Brigitte Gérard','Brigitte','06 16 87 73 46','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-046','celine.francois@hotmail.fr','Céline François','Céline','06 94 97 27 90','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-047','julie.richard@outlook.fr','Julie Richard','Julie','06 26 21 47 51','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-048','arthur.chevalier@icloud.com','Arthur Chevalier','Arthur','06 42 71 47 53','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-049','martine.vincent@hotmail.fr','Martine Vincent','Martine','06 60 81 56 21','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-050','arthur.david@laposte.net','Arthur David','Arthur','06 43 84 58 91','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-051','thierry.aubert@gmail.com','Thierry Aubert','Thierry','','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-052','michel.roy@outlook.fr','Michel Roy','Michel','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-053','anne.renard@orange.fr','Anne Renard','Anne','06 27 59 68 57','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-054','laure.lemaire@orange.fr','Laure Lemaire','Laure','06 45 14 98 57','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-055','chloe.lefebvre@yahoo.fr','Chloé Lefebvre','Chloé','','Saint-Laurent-du-Var','06700','FALSE','réseaux sociaux'),
  ('j-pq-056','philippe.roche@orange.fr','Philippe Roche','Philippe','06 86 12 16 52','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-057','pauline.lambert@orange.fr','Pauline Lambert','Pauline','06 39 52 28 86','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-058','alain.bertrand@icloud.com','Alain Bertrand','Alain','','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-059','cedric.clement@gmail.com','Cédric Clément','Cédric','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-060','martine.aubert@laposte.net','Martine Aubert','Martine','06 67 74 38 88','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-061','jade.perrin@laposte.net','Jade Perrin','Jade','','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-062','chantal.michel@laposte.net','Chantal Michel','Chantal','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-063','alain.leroy@wanadoo.fr','Alain Leroy','Alain','06 80 51 58 86','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-064','nathan.joly@orange.fr','Nathan Joly','Nathan','06 93 80 37 65','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-065','emilie.dumont@laposte.net','Émilie Dumont','Émilie','06 50 64 50 95','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-066','sebastien.leroy@orange.fr','Sébastien Leroy','Sébastien','06 57 26 81 17','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-067','chantal.denis@yahoo.fr','Chantal Denis','Chantal','06 16 46 86 49','Saint-Laurent-du-Var','06700','FALSE','réseaux sociaux'),
  ('j-pq-068','julien.bonnet@wanadoo.fr','Julien Bonnet','Julien','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-069','catherine.henry@hotmail.fr','Catherine Henry','Catherine','06 89 88 96 92','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-070','pascal.thomas@wanadoo.fr','Pascal Thomas','Pascal','06 53 54 10 33','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-071','laure.thomas@orange.fr','Laure Thomas','Laure','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-072','veronique.robin@outlook.fr','Véronique Robin','Véronique','06 82 86 20 16','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-073','thomas.petit@orange.fr','Thomas Petit','Thomas','06 72 87 66 63','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-074','celine.joly@orange.fr','Céline Joly','Céline','06 72 77 95 49','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-075','sophie.martin@hotmail.fr','Sophie Martin','Sophie','06 42 47 51 25','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-076','emilie.andre@wanadoo.fr','Émilie André','Émilie','06 74 81 95 55','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-077','celine.joly@gmail.com','Céline Joly','Céline','06 83 64 83 61','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-078','brigitte.girard@laposte.net','Brigitte Girard','Brigitte','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-079','jade.simon@free.fr','Jade Simon','Jade','','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-080','henri.renaud@icloud.com','Henri Renaud','Henri','','Grasse','06130','FALSE','réseaux sociaux'),
  ('j-pq-081','christian.andre@wanadoo.fr','Christian André','Christian','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-082','stephanie.roger@yahoo.fr','Stéphanie Roger','Stéphanie','','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-083','julie.perrin@outlook.fr','Julie Perrin','Julie','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-084','lucas.robert@gmail.com','Lucas Robert','Lucas','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-085','elodie.sanchez@laposte.net','Élodie Sanchez','Élodie','06 15 67 83 93','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-086','laure.durand@laposte.net','Laure Durand','Laure','06 53 20 74 92','Cagnes-sur-Mer','06800','FALSE','réseaux sociaux'),
  ('j-pq-087','david.gautier@laposte.net','David Gautier','David','06 56 57 46 59','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-088','alice.petit@yahoo.fr','Alice Petit','Alice','','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-089','louis.fournier@yahoo.fr','Louis Fournier','Louis','06 54 49 93 99','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-090','christine.morin@icloud.com','Christine Morin','Christine','06 26 95 99 97','Saint-Laurent-du-Var','06700','FALSE','réseaux sociaux'),
  ('j-pq-091','elodie.chevalier@gmail.com','Élodie Chevalier','Élodie','','Grasse','06130','FALSE','réseaux sociaux'),
  ('j-pq-092','valerie.francois@wanadoo.fr','Valérie François','Valérie','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-093','emilie.renaud@gmail.com','Émilie Renaud','Émilie','06 89 26 86 58','Grasse','06130','FALSE','réseaux sociaux'),
  ('j-pq-094','thomas.girard@laposte.net','Thomas Girard','Thomas','','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-095','laure.martinez@icloud.com','Laure Martinez','Laure','06 70 34 57 96','Cagnes-sur-Mer','06800','FALSE','réseaux sociaux'),
  ('j-pq-096','laure.roussel@free.fr','Laure Roussel','Laure','06 30 35 87 27','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-097','leo.robin@icloud.com','Léo Robin','Léo','06 25 46 20 30','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-098','elodie.vincent@free.fr','Élodie Vincent','Élodie','06 54 13 63 16','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-099','michel.robin@hotmail.fr','Michel Robin','Michel','06 93 52 28 27','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-100','laure.aubert@laposte.net','Laure Aubert','Laure','06 12 42 37 29','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-101','caroline.renaud@free.fr','Caroline Renaud','Caroline','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-102','cedric.lemaire@laposte.net','Cédric Lemaire','Cédric','06 73 86 78 12','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-103','patricia.nicolas@free.fr','Patricia Nicolas','Patricia','','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-104','martine.renaud@yahoo.fr','Martine Renaud','Martine','06 74 80 12 59','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-105','david.robin@outlook.fr','David Robin','David','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-106','frederic.michel@yahoo.fr','Frédéric Michel','Frédéric','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-107','nicolas.berger@wanadoo.fr','Nicolas Berger','Nicolas','06 68 14 47 35','Saint-Laurent-du-Var','06700','FALSE','réseaux sociaux'),
  ('j-pq-108','sophie.mathieu@outlook.fr','Sophie Mathieu','Sophie','06 79 70 42 14','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-109','francois.gauthier@outlook.fr','François Gauthier','François','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-110','aurelie.dumont@wanadoo.fr','Aurélie Dumont','Aurélie','06 76 44 20 64','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-111','camille.royer@outlook.fr','Camille Royer','Camille','','La Gaude','06610','FALSE','réseaux sociaux'),
  ('j-pq-112','thomas.duval@wanadoo.fr','Thomas Duval','Thomas','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-113','chloe.joly@outlook.fr','Chloé Joly','Chloé','06 19 95 91 61','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-114','camille.thomas@wanadoo.fr','Camille Thomas','Camille','06 14 26 18 40','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-115','raphaël.robert@wanadoo.fr','Raphaël Robert','Raphaël','06 57 66 19 83','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-116','sarah.mathieu@outlook.fr','Sarah Mathieu','Sarah','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-117','martine.david@outlook.fr','Martine David','Martine','06 88 46 98 72','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-118','michel.roger@wanadoo.fr','Michel Roger','Michel','06 97 50 95 54','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-119','manon.perrin@wanadoo.fr','Manon Perrin','Manon','06 91 32 56 75','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-120','julien.roux@hotmail.fr','Julien Roux','Julien','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-121','arthur.bertrand@orange.fr','Arthur Bertrand','Arthur','','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-122','laure.denis@orange.fr','Laure Denis','Laure','06 67 69 97 76','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-123','cedric.lefevre@wanadoo.fr','Cédric Lefèvre','Cédric','06 17 25 76 29','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-124','david.francois@yahoo.fr','David François','David','06 42 35 91 80','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-125','cedric.laurent@icloud.com','Cédric Laurent','Cédric','06 84 29 31 94','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-126','manon.dumont@gmail.com','Manon Dumont','Manon','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-127','olivier.lemaire@gmail.com','Olivier Lemaire','Olivier','06 92 48 71 41','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-128','michel.durand@wanadoo.fr','Michel Durand','Michel','06 36 53 87 28','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-129','lea.lopez@free.fr','Léa Lopez','Léa','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-130','thierry.roy@orange.fr','Thierry Roy','Thierry','','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-131','gerard.lemaire@hotmail.fr','Gérard Lemaire','Gérard','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-132','nathalie.morel@laposte.net','Nathalie Morel','Nathalie','06 49 73 12 21','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-133','charlotte.bonnet@yahoo.fr','Charlotte Bonnet','Charlotte','','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-134','julie.aubert@outlook.fr','Julie Aubert','Julie','06 65 27 43 56','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-135','antoine.petit@icloud.com','Antoine Petit','Antoine','06 19 59 74 67','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-136','manon.david@wanadoo.fr','Manon David','Manon','','Cagnes-sur-Mer','06800','FALSE','réseaux sociaux'),
  ('j-pq-137','robert.dupont@icloud.com','Robert Dupont','Robert','','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-138','romain.aubert@icloud.com','Romain Aubert','Romain','06 75 27 51 88','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-139','caroline.dumont@icloud.com','Caroline Dumont','Caroline','06 82 48 70 12','Grasse','06130','FALSE','réseaux sociaux'),
  ('j-pq-140','hugo.morin@gmail.com','Hugo Morin','Hugo','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-141','emilie.petit@laposte.net','Émilie Petit','Émilie','06 89 58 28 97','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-142','frederic.mercier@gmail.com','Frédéric Mercier','Frédéric','06 62 98 36 62','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-143','louise.durand@wanadoo.fr','Louise Durand','Louise','06 94 71 77 58','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-144','patricia.picard@yahoo.fr','Patricia Picard','Patricia','06 97 92 98 43','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-145','sylvie.perrin@hotmail.fr','Sylvie Perrin','Sylvie','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-146','camille.mathieu@laposte.net','Camille Mathieu','Camille','06 45 46 25 83','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-147','david.lopez@wanadoo.fr','David Lopez','David','','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-148','lucas.faure@laposte.net','Lucas Faure','Lucas','06 44 81 99 44','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-149','sandrine.garnier@gmail.com','Sandrine Garnier','Sandrine','','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-150','frederic.gauthier@laposte.net','Frédéric Gauthier','Frédéric','06 10 80 30 62','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-151','valerie.roussel@yahoo.fr','Valérie Roussel','Valérie','','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-152','laurent.andre@free.fr','Laurent André','Laurent','06 60 73 33 47','Cagnes-sur-Mer','06800','FALSE','réseaux sociaux'),
  ('j-pq-153','vincent.michel@yahoo.fr','Vincent Michel','Vincent','06 79 77 73 27','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-154','nathalie.garcia@yahoo.fr','Nathalie Garcia','Nathalie','06 42 33 11 53','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-155','laure.mercier@wanadoo.fr','Laure Mercier','Laure','06 61 64 75 51','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-156','catherine.lefevre@wanadoo.fr','Catherine Lefèvre','Catherine','06 10 43 59 40','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-157','julie.perrin@gmail.com','Julie Perrin','Julie','','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-158','philippe.roy@outlook.fr','Philippe Roy','Philippe','06 49 98 25 91','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-159','daniel.francois@wanadoo.fr','Daniel François','Daniel','06 87 57 63 99','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-160','lina.bonnet@hotmail.fr','Lina Bonnet','Lina','06 20 77 67 77','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-161','pascal.garcia@gmail.com','Pascal Garcia','Pascal','','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-162','claude.schmitt@laposte.net','Claude Schmitt','Claude','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-163','jade.roger@gmail.com','Jade Roger','Jade','06 68 82 17 81','Nice','06200','TRUE','réseaux sociaux'),
  ('j-pq-164','manon.dubois@free.fr','Manon Dubois','Manon','','Grasse','06130','TRUE','réseaux sociaux'),
  ('j-pq-165','francois.leroy@icloud.com','François Leroy','François','06 70 14 46 62','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-166','emilie.robin@free.fr','Émilie Robin','Émilie','06 58 58 20 97','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-167','chantal.andre@icloud.com','Chantal André','Chantal','','Grasse','06130','FALSE','réseaux sociaux'),
  ('j-pq-168','julie.perrin@laposte.net','Julie Perrin','Julie','06 78 58 39 41','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-169','pascal.mercier@orange.fr','Pascal Mercier','Pascal','06 88 12 40 36','La Gaude','06610','TRUE','réseaux sociaux'),
  ('j-pq-170','francois.roger@gmail.com','François Roger','François','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-171','olivier.durand@wanadoo.fr','Olivier Durand','Olivier','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-172','celine.clement@hotmail.fr','Céline Clément','Céline','06 76 38 62 48','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-173','vincent.andre@free.fr','Vincent André','Vincent','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-174','elodie.mathieu@free.fr','Élodie Mathieu','Élodie','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-175','sandrine.perrin@wanadoo.fr','Sandrine Perrin','Sandrine','06 63 81 77 27','Nice','06200','FALSE','réseaux sociaux'),
  ('j-pq-176','christian.gauthier@orange.fr','Christian Gauthier','Christian','','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-177','nathalie.petit@outlook.fr','Nathalie Petit','Nathalie','06 15 19 34 85','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-178','christian.gauthier@outlook.fr','Christian Gauthier','Christian','06 25 71 41 99','Saint-Laurent-du-Var','06700','TRUE','réseaux sociaux'),
  ('j-pq-179','aurelie.legrand@icloud.com','Aurélie Legrand','Aurélie','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-180','chloe.morin@outlook.fr','Chloé Morin','Chloé','06 69 22 70 50','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-181','henri.richard@hotmail.fr','Henri Richard','Henri','','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-182','emma.nicolas@wanadoo.fr','Emma Nicolas','Emma','','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-183','veronique.dumont@outlook.fr','Véronique Dumont','Véronique','06 72 68 31 55','Cagnes-sur-Mer','06800','TRUE','réseaux sociaux'),
  ('j-pq-184','thierry.vasseur@wanadoo.fr','Thierry Vasseur','Thierry','06 77 14 19 95','Vence','06140','TRUE','réseaux sociaux'),
  ('j-pq-185','sandrine.leroy@wanadoo.fr','Sandrine Leroy','Sandrine','06 57 17 89 91','Vence','06140','FALSE','réseaux sociaux'),
  ('j-pq-186','celine.vasseur@gmail.com','Céline Vasseur','Céline','06 11 12 77 45','Grasse','06130','TRUE','réseaux sociaux')
) AS v(ext_id,email,nom,prenom,tel,ville,cp,optin,source)
ON CONFLICT (id) DO UPDATE SET
  email       = EXCLUDED.email,
  nom         = EXCLUDED.nom,
  optin       = EXCLUDED.optin,
  external_id = EXCLUDED.external_id;

-- ════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ════════════════════════════════════════════════════════════

SELECT 'joueurs_paques' AS check_, COUNT(*) AS n FROM public.joueurs WHERE 'ev-paques' = ANY(events)
UNION ALL SELECT 'lots_paques', COUNT(*) FROM public.lots WHERE event_id = 'ev-paques'
UNION ALL SELECT 'banque_questions', jsonb_array_length(questions) FROM public.banques WHERE id = 'bq-paques-vence';
