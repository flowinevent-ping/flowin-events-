-- ============================================================
-- FLOWIN · SEED FICTIF POUR AUDIT · 13/05/2026
-- ⚠️  DONNÉES DE TEST — À SUPPRIMER APRÈS AUDIT  ⚠️
--
-- IDENTIFICATION TRIPLE des données test :
--   1. IDs préfixés : pro-test-*, ev-test-*, j-test-*,
--                     lot-test-*, part-test-*, se-test-*
--   2. Noms préfixés : "TEST ..." (visible dashboard)
--   3. Tags TEXT[]   : ARRAY['TEST'] (pros, partenaires, joueurs)
--   4. Description   : '[FICTIF AUDIT - À SUPPRIMER]' (events)
--   5. Notes         : '[FICTIF AUDIT]' (pros, partenaires)
--
-- POUR SUPPRIMER PROPREMENT :
--   Exécuter sql/CLEAN_TEST_DATA.sql dans Supabase SQL Editor
-- ============================================================

INSERT INTO public.pros (id, nom, ville, code_postal, secteur, contact, email, tel, tags, notes) VALUES
  ('pro-test-cannes','TEST Mairie de Cannes','Cannes','06400','Collectivite','Service Animation','test-cannes@flowin.fr','04 97 06 40 00',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('pro-test-antibes','TEST Mairie Antibes','Antibes','06600','Collectivite','Service Animation','test-antibes@flowin.fr','04 92 90 50 00',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('pro-test-grasse','TEST Mairie Grasse','Grasse','06130','Collectivite','Service Animation','test-grasse@flowin.fr','04 97 05 50 00',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('pro-test-nice','TEST Mairie Nice','Nice','06000','Collectivite','Service Animation','test-nice@flowin.fr','04 97 13 20 00',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('pro-test-mougins','TEST Mairie Mougins','Mougins','06250','Collectivite','Service Animation','test-mougins@flowin.fr','04 92 92 50 00',ARRAY['TEST'],'[FICTIF AUDIT]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.partenaires (id, nom, type, secteur, contact, email, tel, ville, code_postal, tags, notes) VALUES
  ('part-test-1','TEST Nuits du Sud','Local','Festival','Marie Dupont','marie@nds-test.fr','04 93 58 06 58','Vence','06140',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('part-test-2','TEST Station Isola 2000','Local','Sport hiver','Pierre Martin','pierre@isola-test.fr','04 93 23 15 15','Isola','06420',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('part-test-3','TEST Taxi Riviera','Local','Transport','Jean Roux','jean@taxi-test.fr','04 93 88 25 82','Nice','06000',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('part-test-4','TEST Cinema Star','Local','Loisir','Sophie Blanc','sophie@cine-test.fr','04 92 54 16 36','Cannes','06400',ARRAY['TEST'],'[FICTIF AUDIT]'),
  ('part-test-5','TEST Restaurant Le Provencal','Local','Restauration','Luc Petit','luc@provencal-test.fr','04 93 38 91 70','Antibes','06600',ARRAY['TEST'],'[FICTIF AUDIT]')
ON CONFLICT (id) DO NOTHING;

-- Scénario 1 : 3 jeux Cannes (Quiz, Quiz Solo, Spin)
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, lieu, couleur, cfg, participants, joueurs_optin, gagnants, client_type, description) VALUES
  ('ev-test-quiz','pro-test-cannes','TEST Festival Ete Cannes - Quiz','quiz','past','2026-08-01','2026-08-03','Croisette Cannes','#7C2D92','{"audit_id":"AUDIT-20260513-A","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-quiz","optinActif":true,"quizNbQuestions":5,"quizScoreMin":3,"quizBonus":true,"quizTimer":30,"quizRecapFin":true,"quizPartage":true,"quizUneFoisParJour":true,"quizShuffle":true,"quizBanques":["bq-test-cannes"],"bonusActif":true,"bonusList":[{"id":"frequence","label":"Vous etes venu(e)...","type":"single","options":[{"label":"En famille","val":"famille"},{"label":"Entre amis","val":"amis"},{"label":"En couple","val":"couple"},{"label":"Seul(e)","val":"seul"}]},{"id":"ambiance","label":"Je trouve lambiance...","type":"single","options":[{"label":"Genial","val":"genial"},{"label":"Top","val":"top"},{"label":"Moyen","val":"moyen"}]},{"id":"retour","label":"Souhaitez-vous revenir ?","type":"single","options":[{"label":"Oui","val":"oui"},{"label":"Peut-etre","val":"peutetre"},{"label":"Non","val":"non"}]}],"customQuestions":[{"id":"decouverte","label":"Comment nous avez-vous connu ?","type":"single","options":[{"label":"Instagram","val":"instagram"},{"label":"Facebook","val":"facebook"},{"label":"Site mairie","val":"mairie"},{"label":"Affiche","val":"affiche"},{"label":"Bouche a oreille","val":"bouche"}]}]}'::jsonb,3,3,1,'btoc','[FICTIF AUDIT - À SUPPRIMER]'),
  ('ev-test-quizsolo','pro-test-cannes','TEST Festival Ete Cannes - Quiz Solo','quizsolo','past','2026-08-01','2026-08-03','Croisette Cannes','#F59E0B','{"audit_id":"AUDIT-20260513-Aqs","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-quizsolo","optinActif":true,"quizNbQuestions":10,"quizTimer":20,"quizTimerVisible":true,"quizPartage":true,"quizUneFoisParJour":true,"classementPublic":true,"quizBanques":["bq-test-cannes"],"bonusActif":true,"bonusList":[{"id":"frequence","label":"Vous etes venu(e)...","type":"single","options":[{"label":"En famille","val":"famille"},{"label":"Entre amis","val":"amis"},{"label":"En couple","val":"couple"},{"label":"Seul(e)","val":"seul"}]},{"id":"ambiance","label":"Je trouve lambiance...","type":"single","options":[{"label":"Genial","val":"genial"},{"label":"Top","val":"top"},{"label":"Moyen","val":"moyen"}]}],"customQuestions":[{"id":"decouverte","label":"Comment nous avez-vous connu ?","type":"single","options":[{"label":"Instagram","val":"instagram"},{"label":"Facebook","val":"facebook"}]}]}'::jsonb,3,3,1,'btoc','[FICTIF AUDIT - À SUPPRIMER]'),
  ('ev-test-spin','pro-test-cannes','TEST Festival Ete Cannes - Spin','spin','past','2026-08-01','2026-08-03','Croisette Cannes','#EF9F27','{"audit_id":"AUDIT-20260513-Bmulti","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-spin","optinActif":true,"spinDuration":6,"spinSound":true}'::jsonb,3,3,1,'btoc','[FICTIF AUDIT - À SUPPRIMER]')
ON CONFLICT (id) DO NOTHING;

-- Scénario 2 : 5 events Super Event Riviera
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, lieu, couleur, cfg, participants, joueurs_optin, client_type, super_event_id, description) VALUES
  ('ev-test-se-cannes','pro-test-cannes','TEST SE Quiz Cannes','quiz','past','2026-09-15','2026-09-15','Cannes','#7C2D92','{"audit_id":"AUDIT-20260513-C1","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-cannes"}'::jsonb,3,3,'btoc','se-test-riviera','[FICTIF AUDIT - À SUPPRIMER]'),
  ('ev-test-se-antibes','pro-test-antibes','TEST SE QuizSolo Antibes','quizsolo','past','2026-09-15','2026-09-15','Antibes','#F59E0B','{"audit_id":"AUDIT-20260513-C2","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-antibes"}'::jsonb,3,3,'btoc','se-test-riviera','[FICTIF AUDIT - À SUPPRIMER]'),
  ('ev-test-se-grasse','pro-test-grasse','TEST SE Spin Grasse','spin','past','2026-09-15','2026-09-15','Grasse','#EF9F27','{"audit_id":"AUDIT-20260513-C3","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-grasse"}'::jsonb,3,3,'btoc','se-test-riviera','[FICTIF AUDIT - À SUPPRIMER]'),
  ('ev-test-se-nice','pro-test-nice','TEST SE Quiz Nice','quiz','past','2026-09-15','2026-09-15','Nice','#7C2D92','{"audit_id":"AUDIT-20260513-C4","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-nice"}'::jsonb,3,3,'btoc','se-test-riviera','[FICTIF AUDIT - À SUPPRIMER]'),
  ('ev-test-se-mougins','pro-test-mougins','TEST SE Spin Mougins','spin','past','2026-09-15','2026-09-15','Mougins','#EF9F27','{"audit_id":"AUDIT-20260513-C5","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-mougins"}'::jsonb,3,3,'btoc','se-test-riviera','[FICTIF AUDIT - À SUPPRIMER]'),
  ('ev-test-vote','pro-test-cannes','TEST Vote Concerts Riviera','vote','past','2026-09-20','2026-09-20','Plage de Cannes','#3B5CC4','{"audit_id":"AUDIT-20260513-D","voteMode":"stars","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-vote","voteChoix":[{"id":"c1","label":"Rock"},{"id":"c2","label":"Jazz"},{"id":"c3","label":"Pop"}],"voteResultatsLive":true}'::jsonb,3,3,'btoc','se-test-vote','[FICTIF AUDIT - À SUPPRIMER]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.super_events (id, nom, pros, events, date_d, date_f, description) VALUES
  ('se-test-riviera','TEST Super Event Riviera',ARRAY['pro-test-cannes','pro-test-antibes','pro-test-grasse','pro-test-nice','pro-test-mougins'],ARRAY['ev-test-se-cannes','ev-test-se-antibes','ev-test-se-grasse','ev-test-se-nice','ev-test-se-mougins'],'2026-09-15','2026-09-15','5 villes 5 jeux 1 journee'),
  ('se-test-vote','TEST Super Event Vote',ARRAY['pro-test-cannes','pro-test-antibes','pro-test-grasse','pro-test-nice','pro-test-mougins'],ARRAY['ev-test-vote'],'2026-09-20','2026-09-20','Vote concerts')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.joueurs (id, email, nom, prenom, tel, ville, code_postal, gains, score_moy, optin, optin_date, last_seen, first_seen, source, events, client_type, tags) VALUES
  ('j-test-q1','test1@flowin.fr','TEST Dupont','Alice','06 11 11 11 11','Cannes','06400',1,'4/4',TRUE,'2026-08-01','2026-08-01','2026-08-01','TEST',ARRAY['ev-test-quiz'],'btoc',ARRAY['TEST']),
  ('j-test-q2','test2@flowin.fr','TEST Martin','Bob','06 22 22 22 22','Antibes','06600',0,'3/4',TRUE,'2026-08-01','2026-08-01','2026-08-01','TEST',ARRAY['ev-test-quiz'],'btoc',ARRAY['TEST']),
  ('j-test-q3','test3@flowin.fr','TEST Roux','Claire','06 33 33 33 33','Nice','06000',0,'2/4',FALSE,NULL,'2026-08-01','2026-08-01','TEST',ARRAY['ev-test-quiz'],'btoc',ARRAY['TEST']),
  ('j-test-s1','test4@flowin.fr','TEST Blanc','David','06 44 44 44 44','Cannes','06400',1,'5/5',TRUE,'2026-08-02','2026-08-02','2026-08-02','TEST',ARRAY['ev-test-quizsolo'],'btoc',ARRAY['TEST']),
  ('j-test-s2','test5@flowin.fr','TEST Noir','Emma','06 55 55 55 55','Mougins','06250',0,'4/5',TRUE,'2026-08-02','2026-08-02','2026-08-02','TEST',ARRAY['ev-test-quizsolo'],'btoc',ARRAY['TEST']),
  ('j-test-s3','test6@flowin.fr','TEST Vert','Francois','06 66 66 66 66','Grasse','06130',0,'3/5',TRUE,'2026-08-02','2026-08-02','2026-08-02','TEST',ARRAY['ev-test-quizsolo'],'btoc',ARRAY['TEST']),
  ('j-test-p1','test7@flowin.fr','TEST Rose','Gabrielle','06 77 77 77 77','Cannes','06400',1,'-',TRUE,'2026-08-03','2026-08-03','2026-08-03','TEST',ARRAY['ev-test-spin'],'btoc',ARRAY['TEST']),
  ('j-test-p2','test8@flowin.fr','TEST Or','Hugo','06 88 88 88 88','Vallauris','06220',0,'-',TRUE,'2026-08-03','2026-08-03','2026-08-03','TEST',ARRAY['ev-test-spin'],'btoc',ARRAY['TEST']),
  ('j-test-p3','test9@flowin.fr','TEST Argent','Ines','06 99 99 99 99','Antibes','06600',0,'-',TRUE,'2026-08-03','2026-08-03','2026-08-03','TEST',ARRAY['ev-test-spin'],'btoc',ARRAY['TEST'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lots (id, event_id, partenaire_id, nom, valeur, quantite, assigne_a, retire, note) VALUES
  ('lot-test-q1','ev-test-quiz','part-test-1','TEST Place VIP Nuits du Sud',60,1,'j-test-q1',TRUE,'12 juillet'),
  ('lot-test-q2','ev-test-quiz','part-test-2','TEST Forfait saison ski Isola',450,1,NULL,FALSE,'Saison 2026/27'),
  ('lot-test-q3','ev-test-quiz','part-test-3','TEST Trajet taxi Nice-Vence',80,1,NULL,FALSE,'Aller simple'),
  ('lot-test-s1','ev-test-quizsolo','part-test-1','TEST Place VIP Nuits du Sud',60,1,'j-test-s1',TRUE,'12 juillet'),
  ('lot-test-s2','ev-test-quizsolo','part-test-2','TEST Forfait saison ski Isola',450,1,NULL,FALSE,'Saison 2026/27'),
  ('lot-test-s3','ev-test-quizsolo','part-test-3','TEST Trajet taxi Nice-Vence',80,1,NULL,FALSE,'Aller simple'),
  ('lot-test-p1','ev-test-spin','part-test-1','TEST Place VIP Nuits du Sud',60,1,'j-test-p1',TRUE,'12 juillet'),
  ('lot-test-p2','ev-test-spin','part-test-2','TEST Forfait saison ski Isola',450,1,NULL,FALSE,'Saison 2026/27'),
  ('lot-test-p3','ev-test-spin','part-test-3','TEST Trajet taxi Nice-Vence',80,1,NULL,FALSE,'Aller simple')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.votes (event_id, joueur_id, cible_id, cible_type, note) VALUES
  ('ev-test-vote','j-test-q1','c1','concert',5),
  ('ev-test-vote','j-test-s1','c2','concert',4),
  ('ev-test-vote','j-test-p1','c3','concert',5);

INSERT INTO public.participations (event_id, joueur_id, score, completed) VALUES
  ('ev-test-quiz','j-test-q1',4,TRUE),
  ('ev-test-quiz','j-test-q2',3,TRUE),
  ('ev-test-quiz','j-test-q3',2,FALSE),
  ('ev-test-quizsolo','j-test-s1',5,TRUE),
  ('ev-test-quizsolo','j-test-s2',4,TRUE),
  ('ev-test-quizsolo','j-test-s3',3,TRUE),
  ('ev-test-spin','j-test-p1',0,TRUE),
  ('ev-test-spin','j-test-p2',0,TRUE),
  ('ev-test-spin','j-test-p3',0,TRUE);




-- ─── SCÉNARIO A-bis : Spin seul ───────────────────────────
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, lieu, couleur, cfg, participants, joueurs_optin, gagnants, client_type, description) VALUES
  ('ev-test-spin-only','pro-test-cannes','TEST · Anim Boutique Cannes - Spin','spin','past','2026-06-15','2026-06-15','Centre commercial Cannes','#EF9F27',
   '{"audit_id":"AUDIT-20260513-Aspin","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-spin-only","optinActif":true,"spinDuration":6,"spinSound":true,"spinSegments":[{"label":"-10%","color":"#EF4444","gain":"10pct"},{"label":"Gratuit","color":"#10B981","gain":"free"},{"label":"Retry","color":"#6B7280","gain":"retry"},{"label":"-20%","color":"#F59E0B","gain":"20pct"},{"label":"Cadeau","color":"#8B5CF6","gain":"cadeau"}]}'::jsonb,
   3,3,1,'btoc','[FICTIF AUDIT - À SUPPRIMER]')
ON CONFLICT (id) DO NOTHING;

-- ─── SCÉNARIO A-ter : Tombola seule ───────────────────────
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, lieu, couleur, cfg, participants, joueurs_optin, gagnants, client_type, description) VALUES
  ('ev-test-tombola-only','pro-test-cannes','TEST · Fête Quartier Cannes - Tombola','tombola','past','2026-07-01','2026-07-01','Place du Marché Cannes','#10B981',
   '{"audit_id":"AUDIT-20260513-Ator","qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-tombola-only","optinActif":true,"tombolaTickets":100,"tombolaCagnotte":3,"tombolaTirageType":"manuel"}'::jsonb,
   3,3,1,'btoc','[FICTIF AUDIT - À SUPPRIMER]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lots (id, event_id, partenaire_id, nom, valeur, quantite, assigne_a, retire, note) VALUES
  ('lot-test-spin1','ev-test-spin-only','part-test-1','TEST · Place VIP NDS',60,1,'j-test-spin1',TRUE,'Spin seul'),
  ('lot-test-spin2','ev-test-spin-only','part-test-2','TEST · Forfait Isola',450,1,NULL,FALSE,'Spin seul'),
  ('lot-test-spin3','ev-test-spin-only','part-test-3','TEST · Taxi Nice-Vence',80,1,NULL,FALSE,'Spin seul'),
  ('lot-test-tom1','ev-test-tombola-only','part-test-1','TEST · Place VIP NDS',60,1,'j-test-tom1',TRUE,'Tombola'),
  ('lot-test-tom2','ev-test-tombola-only','part-test-2','TEST · Forfait Isola',450,1,NULL,FALSE,'Tombola'),
  ('lot-test-tom3','ev-test-tombola-only','part-test-3','TEST · Taxi Nice-Vence',80,1,NULL,FALSE,'Tombola')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.joueurs (id, email, nom, prenom, tel, ville, code_postal, gains, score_moy, optin, optin_date, last_seen, first_seen, source, events, client_type, tags) VALUES
  ('j-test-spin1','spin1@flowin.fr','TEST Spin','Joueur1','06 10 00 00 01','Cannes','06400',1,'-',TRUE,'2026-06-15','2026-06-15','2026-06-15','TEST',ARRAY['ev-test-spin-only'],'btoc',ARRAY['TEST']),
  ('j-test-spin2','spin2@flowin.fr','TEST Spin','Joueur2','06 10 00 00 02','Antibes','06600',0,'-',TRUE,'2026-06-15','2026-06-15','2026-06-15','TEST',ARRAY['ev-test-spin-only'],'btoc',ARRAY['TEST']),
  ('j-test-spin3','spin3@flowin.fr','TEST Spin','Joueur3','06 10 00 00 03','Nice','06000',0,'-',TRUE,'2026-06-15','2026-06-15','2026-06-15','TEST',ARRAY['ev-test-spin-only'],'btoc',ARRAY['TEST']),
  ('j-test-tom1','tom1@flowin.fr','TEST Tombola','Joueur1','06 20 00 00 01','Cannes','06400',1,'-',TRUE,'2026-07-01','2026-07-01','2026-07-01','TEST',ARRAY['ev-test-tombola-only'],'btoc',ARRAY['TEST']),
  ('j-test-tom2','tom2@flowin.fr','TEST Tombola','Joueur2','06 20 00 00 02','Antibes','06600',0,'-',TRUE,'2026-07-01','2026-07-01','2026-07-01','TEST',ARRAY['ev-test-tombola-only'],'btoc',ARRAY['TEST']),
  ('j-test-tom3','tom3@flowin.fr','TEST Tombola','Joueur3','06 20 00 00 03','Mougins','06250',0,'-',TRUE,'2026-07-01','2026-07-01','2026-07-01','TEST',ARRAY['ev-test-tombola-only'],'btoc',ARRAY['TEST'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.participations (event_id, joueur_id, score, completed) VALUES
  ('ev-test-spin-only','j-test-spin1',0,TRUE),
  ('ev-test-spin-only','j-test-spin2',0,TRUE),
  ('ev-test-spin-only','j-test-spin3',0,TRUE),
  ('ev-test-tombola-only','j-test-tom1',0,TRUE),
  ('ev-test-tombola-only','j-test-tom2',0,TRUE),
  ('ev-test-tombola-only','j-test-tom3',0,TRUE);


-- ─── BANQUE DE QUESTIONS TEST (Quiz Cannes) ───────────────
INSERT INTO public.banques (id, nom, description, events, questions) VALUES (
  'bq-test-cannes','TEST Banque Quiz Cannes','[FICTIF AUDIT - 5 questions test culture provençale]',
  ARRAY['ev-test-quiz','ev-test-quizsolo'],
  '[
    {"id":"q-test-1","type":"qcm","texte":"Quel est le plat traditionnel de Nice ?","options":["Pissaladière","Cassoulet","Choucroute","Bouillabaisse"],"bonne":0,"points":1,"explication":"La pissaladière est une tarte niçoise aux oignons et anchois."},
    {"id":"q-test-2","type":"qcm","texte":"Le Festival de Cannes a lieu chaque année en :","options":["Mars","Mai","Juillet","Septembre"],"bonne":1,"points":1,"explication":"Le Festival se déroule traditionnellement en mai."},
    {"id":"q-test-3","type":"qcm","texte":"Quelle ville est surnommée la capitale du parfum ?","options":["Nice","Cannes","Grasse","Antibes"],"bonne":2,"points":1,"explication":"Grasse est mondialement connue pour son industrie du parfum."},
    {"id":"q-test-4","type":"qcm","texte":"Quel artiste a vécu à Vence et y a peint une chapelle ?","options":["Picasso","Matisse","Renoir","Chagall"],"bonne":1,"points":1,"explication":"Henri Matisse a réalisé la Chapelle du Rosaire de Vence."},
    {"id":"q-test-5","type":"qcm","texte":"La promenade des Anglais se trouve à :","options":["Cannes","Monaco","Nice","Antibes"],"bonne":2,"points":1,"explication":"La célèbre Promenade des Anglais longe la Baie des Anges à Nice."}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ─── VÉRIFICATION ─────────────────────────────────────────
SELECT 'PROS test' as scope, count(*) FROM public.pros WHERE id LIKE 'pro-test-%'
UNION ALL SELECT 'PARTENAIRES', count(*) FROM public.partenaires WHERE id LIKE 'part-test-%'
UNION ALL SELECT 'EVENTS', count(*) FROM public.events WHERE id LIKE 'ev-test-%'
UNION ALL SELECT 'SUPER EVENTS', count(*) FROM public.super_events WHERE id LIKE 'se-test-%'
UNION ALL SELECT 'JOUEURS', count(*) FROM public.joueurs WHERE id LIKE 'j-test-%'
UNION ALL SELECT 'LOTS', count(*) FROM public.lots WHERE id LIKE 'lot-test-%'
UNION ALL SELECT 'VOTES', count(*) FROM public.votes WHERE event_id LIKE 'ev-test-%'
UNION ALL SELECT 'PARTICIPATIONS', count(*) FROM public.participations WHERE event_id LIKE 'ev-test-%'
UNION ALL SELECT 'BANQUES', count(*) FROM public.banques WHERE id LIKE 'bq-test-%'
UNION ALL SELECT 'AUDIT events', count(*) FROM public.events WHERE cfg->>'audit_id' LIKE 'AUDIT-%';
