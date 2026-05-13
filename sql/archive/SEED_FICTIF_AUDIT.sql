-- ============================================================
-- SEED FICTIF AUDIT — 13/05/2026
-- Préfixes : pro-test-*, ev-test-*, j-test-*, lot-test-*, 
--            part-test-*, se-test-*
-- 
-- Suppression facile :
--   DELETE FROM votes WHERE event_id LIKE 'ev-test-%';
--   DELETE FROM participations WHERE event_id LIKE 'ev-test-%';
--   DELETE FROM lots WHERE id LIKE 'lot-test-%';
--   DELETE FROM joueurs WHERE id LIKE 'j-test-%';
--   DELETE FROM events WHERE id LIKE 'ev-test-%';
--   DELETE FROM super_events WHERE id LIKE 'se-test-%';
--   DELETE FROM partenaires WHERE id LIKE 'part-test-%';
--   DELETE FROM pros WHERE id LIKE 'pro-test-%';
-- ============================================================

-- ─── PRO FICTIF ───────────────────────────────────────────
INSERT INTO public.pros (id, nom, ville, code_postal, adresse, siret, secteur, contact, email, tel)
VALUES ('pro-test-cannes','TEST · Mairie de Cannes','Cannes','06400','1 Place Bernard Cornut-Gentille','21060029300018','Collectivité','Service Animation TEST','test@flowin.fr','04 97 06 40 00')
ON CONFLICT (id) DO NOTHING;

-- ─── 5 PARTENAIRES FICTIFS ────────────────────────────────
INSERT INTO public.partenaires (id, nom, type, secteur, contact, email, tel, ville, code_postal)
VALUES
  ('part-test-1','TEST · Nuits du Sud','Local','Festival','Marie Dupont','marie@nds-test.fr','04 93 58 06 58','Vence','06140'),
  ('part-test-2','TEST · Station Isola 2000','Local','Sport hiver','Pierre Martin','pierre@isola-test.fr','04 93 23 15 15','Isola','06420'),
  ('part-test-3','TEST · Taxi Riviera','Local','Transport','Jean Roux','jean@taxi-test.fr','04 93 88 25 82','Nice','06000'),
  ('part-test-4','TEST · Cinéma Star','Local','Loisir','Sophie Blanc','sophie@cine-test.fr','04 92 54 16 36','Cannes','06400'),
  ('part-test-5','TEST · Restaurant Le Provençal','Local','Restauration','Luc Petit','luc@provencal-test.fr','04 93 38 91 70','Antibes','06600')
ON CONFLICT (id) DO NOTHING;

-- ─── SCÉNARIO 1 : EVENT SIMPLE (3 jours, 3 jeux différents) ─
-- Quiz + bonus
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, h_start, h_end, lieu, adresse, couleur, cfg, participants, joueurs_optin, gagnants, client_type)
VALUES (
  'ev-test-quiz','pro-test-cannes','TEST · Festival d''Été Cannes - Quiz','quiz','past',
  '2026-08-01','2026-08-03','10:00','22:00',
  'Boulevard de la Croisette','Croisette, 06400 Cannes','#7C2D92',
  '{"quizNbQuestions":5,"quizScoreMin":3,"quizBonus":true,"quizTimer":30,"bonusActif":true,"optinActif":true,"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-quiz"}'::jsonb,
  3, 3, 1, 'btoc'
) ON CONFLICT (id) DO NOTHING;

-- Quiz solo
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, h_start, h_end, lieu, couleur, cfg, participants, joueurs_optin, gagnants, client_type)
VALUES (
  'ev-test-quizsolo','pro-test-cannes','TEST · Festival d''Été Cannes - Quiz Solo','quizsolo','past',
  '2026-08-01','2026-08-03','10:00','22:00',
  'Boulevard de la Croisette','#F59E0B',
  '{"quizNbQuestions":5,"quizScoreMin":3,"quizTimer":30,"optinActif":true,"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-quizsolo"}'::jsonb,
  3, 3, 1, 'btoc'
) ON CONFLICT (id) DO NOTHING;

-- Spin
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, h_start, h_end, lieu, couleur, cfg, participants, joueurs_optin, gagnants, client_type)
VALUES (
  'ev-test-spin','pro-test-cannes','TEST · Festival d''Été Cannes - Spin','spin','past',
  '2026-08-01','2026-08-03','10:00','22:00',
  'Boulevard de la Croisette','#EF9F27',
  '{"spinDuration":6,"spinSound":true,"optinActif":true,"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-spin"}'::jsonb,
  3, 3, 1, 'btoc'
) ON CONFLICT (id) DO NOTHING;

-- ─── 9 JOUEURS FICTIFS (3 par jeu) ────────────────────────
INSERT INTO public.joueurs (id, email, nom, prenom, tel, ville, code_postal, date_naissance, gains, score_moy, optin, optin_date, last_seen, first_seen, source, events, client_type)
VALUES
  -- Quiz
  ('j-test-q1','test1@flowin.fr','TEST Dupont','Alice','06 11 11 11 11','Cannes','06400','1990-05-12',1,'4/4',TRUE,'2026-08-01','2026-08-01','2026-08-01','TEST QR',ARRAY['ev-test-quiz'],'btoc'),
  ('j-test-q2','test2@flowin.fr','TEST Martin','Bob','06 22 22 22 22','Antibes','06600','1985-09-23',0,'3/4',TRUE,'2026-08-01','2026-08-01','2026-08-01','TEST QR',ARRAY['ev-test-quiz'],'btoc'),
  ('j-test-q3','test3@flowin.fr','TEST Roux','Claire','06 33 33 33 33','Nice','06000','1992-03-15',0,'2/4',FALSE,NULL,'2026-08-01','2026-08-01','TEST QR',ARRAY['ev-test-quiz'],'btoc'),
  -- Quiz Solo
  ('j-test-s1','test4@flowin.fr','TEST Blanc','David','06 44 44 44 44','Cannes','06400','1988-07-04',1,'5/5',TRUE,'2026-08-02','2026-08-02','2026-08-02','TEST QR',ARRAY['ev-test-quizsolo'],'btoc'),
  ('j-test-s2','test5@flowin.fr','TEST Noir','Emma','06 55 55 55 55','Mougins','06250','1995-11-30',0,'4/5',TRUE,'2026-08-02','2026-08-02','2026-08-02','TEST QR',ARRAY['ev-test-quizsolo'],'btoc'),
  ('j-test-s3','test6@flowin.fr','TEST Vert','François','06 66 66 66 66','Grasse','06130','1980-02-18',0,'3/5',TRUE,'2026-08-02','2026-08-02','2026-08-02','TEST QR',ARRAY['ev-test-quizsolo'],'btoc'),
  -- Spin
  ('j-test-p1','test7@flowin.fr','TEST Rose','Gabrielle','06 77 77 77 77','Cannes','06400','1991-06-21',1,'-',TRUE,'2026-08-03','2026-08-03','2026-08-03','TEST QR',ARRAY['ev-test-spin'],'btoc'),
  ('j-test-p2','test8@flowin.fr','TEST Or','Hugo','06 88 88 88 88','Vallauris','06220','1987-12-10',0,'-',TRUE,'2026-08-03','2026-08-03','2026-08-03','TEST QR',ARRAY['ev-test-spin'],'btoc'),
  ('j-test-p3','test9@flowin.fr','TEST Argent','Inès','06 99 99 99 99','Antibes','06600','1993-04-08',0,'-',TRUE,'2026-08-03','2026-08-03','2026-08-03','TEST QR',ARRAY['ev-test-spin'],'btoc')
ON CONFLICT (id) DO NOTHING;

-- ─── 3 LOTS PAR JEU (9 lots total, 3 gagnants par jeu = 1 lot par gagnant) ─
-- Quiz : 3 lots
INSERT INTO public.lots (id, event_id, partenaire_id, nom, valeur, quantite, assigne_a, retire, note) VALUES
  ('lot-test-q1','ev-test-quiz','part-test-1','TEST · Place VIP Nuits du Sud',60,1,'j-test-q1',TRUE,'Soirée 12 juillet'),
  ('lot-test-q2','ev-test-quiz','part-test-2','TEST · Forfait saison ski Isola',450,1,NULL,FALSE,'Saison 2026/27'),
  ('lot-test-q3','ev-test-quiz','part-test-3','TEST · Trajet taxi Nice-Vence',80,1,NULL,FALSE,'Aller simple')
ON CONFLICT (id) DO NOTHING;

-- Quiz Solo : 3 lots
INSERT INTO public.lots (id, event_id, partenaire_id, nom, valeur, quantite, assigne_a, retire, note) VALUES
  ('lot-test-s1','ev-test-quizsolo','part-test-1','TEST · Place VIP Nuits du Sud',60,1,'j-test-s1',TRUE,'Soirée 12 juillet'),
  ('lot-test-s2','ev-test-quizsolo','part-test-2','TEST · Forfait saison ski Isola',450,1,NULL,FALSE,'Saison 2026/27'),
  ('lot-test-s3','ev-test-quizsolo','part-test-3','TEST · Trajet taxi Nice-Vence',80,1,NULL,FALSE,'Aller simple')
ON CONFLICT (id) DO NOTHING;

-- Spin : 3 lots
INSERT INTO public.lots (id, event_id, partenaire_id, nom, valeur, quantite, assigne_a, retire, note) VALUES
  ('lot-test-p1','ev-test-spin','part-test-1','TEST · Place VIP Nuits du Sud',60,1,'j-test-p1',TRUE,'Soirée 12 juillet'),
  ('lot-test-p2','ev-test-spin','part-test-2','TEST · Forfait saison ski Isola',450,1,NULL,FALSE,'Saison 2026/27'),
  ('lot-test-p3','ev-test-spin','part-test-3','TEST · Trajet taxi Nice-Vence',80,1,NULL,FALSE,'Aller simple')
ON CONFLICT (id) DO NOTHING;

-- ─── SCÉNARIO 2 : SUPER EVENT (5 pros, 1 jeu par pro) ─────
-- Pros additionnels pour super event
INSERT INTO public.pros (id, nom, ville, code_postal, secteur) VALUES
  ('pro-test-antibes','TEST · Mairie Antibes','Antibes','06600','Collectivité'),
  ('pro-test-grasse','TEST · Mairie Grasse','Grasse','06130','Collectivité'),
  ('pro-test-nice','TEST · Mairie Nice','Nice','06000','Collectivité'),
  ('pro-test-mougins','TEST · Mairie Mougins','Mougins','06250','Collectivité')
ON CONFLICT (id) DO NOTHING;

-- 5 events liés au super event (1 par pro, modules variés)
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, lieu, couleur, cfg, participants, joueurs_optin, client_type, super_event_id) VALUES
  ('ev-test-se-cannes','pro-test-cannes','TEST · SE Quiz Cannes','quiz','past','2026-09-15','2026-09-15','Cannes','#7C2D92','{"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-cannes"}'::jsonb,3,3,'btoc','se-test-riviera'),
  ('ev-test-se-antibes','pro-test-antibes','TEST · SE QuizSolo Antibes','quizsolo','past','2026-09-15','2026-09-15','Antibes','#F59E0B','{"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-antibes"}'::jsonb,3,3,'btoc','se-test-riviera'),
  ('ev-test-se-grasse','pro-test-grasse','TEST · SE Spin Grasse','spin','past','2026-09-15','2026-09-15','Grasse','#EF9F27','{"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-grasse"}'::jsonb,3,3,'btoc','se-test-riviera'),
  ('ev-test-se-nice','pro-test-nice','TEST · SE Quiz Nice','quiz','past','2026-09-15','2026-09-15','Nice','#7C2D92','{"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-nice"}'::jsonb,3,3,'btoc','se-test-riviera'),
  ('ev-test-se-mougins','pro-test-mougins','TEST · SE Spin Mougins','spin','past','2026-09-15','2026-09-15','Mougins','#EF9F27','{"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-se-mougins"}'::jsonb,3,3,'btoc','se-test-riviera')
ON CONFLICT (id) DO NOTHING;

-- Super event
INSERT INTO public.super_events (id, nom, pros, events, date_d, date_f, description) VALUES
  ('se-test-riviera','TEST · Super Event Riviera',
   ARRAY['pro-test-cannes','pro-test-antibes','pro-test-grasse','pro-test-nice','pro-test-mougins'],
   ARRAY['ev-test-se-cannes','ev-test-se-antibes','ev-test-se-grasse','ev-test-se-nice','ev-test-se-mougins'],
   '2026-09-15','2026-09-15','5 villes 5 jeux 1 journée')
ON CONFLICT (id) DO NOTHING;

-- ─── SCÉNARIO 3 : SUPER EVENT VOTE (1 jour, 3 concerts, étoiles) ─
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, lieu, couleur, cfg, participants, joueurs_optin, client_type, super_event_id) VALUES
  ('ev-test-vote','pro-test-cannes','TEST · Vote Concerts Riviera','vote','past','2026-09-20','2026-09-20','Plage de Cannes','#3B5CC4',
   '{"voteMode":"stars","voteTitre":"Votez votre concert préféré","voteDesc":"3 concerts en compétition","voteResultatsLive":true,"voteChoix":[{"id":"c1","label":"Concert Rock","img":""},{"id":"c2","label":"Concert Jazz","img":""},{"id":"c3","label":"Concert Pop","img":""}],"qrUrl":"https://flowin-events.vercel.app/parcours/?ev=ev-test-vote"}'::jsonb,
   3,3,'btoc','se-test-vote')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.super_events (id, nom, pros, events, date_d, date_f, description) VALUES
  ('se-test-vote','TEST · Super Event Vote Riviera',
   ARRAY['pro-test-cannes','pro-test-antibes','pro-test-grasse','pro-test-nice','pro-test-mougins'],
   ARRAY['ev-test-vote'],
   '2026-09-20','2026-09-20','Vote des concerts 5 villes')
ON CONFLICT (id) DO NOTHING;

-- 3 votes étoiles fictifs
INSERT INTO public.votes (event_id, joueur_id, cible_id, cible_type, note) VALUES
  ('ev-test-vote','j-test-q1','c1','concert',5),
  ('ev-test-vote','j-test-s1','c2','concert',4),
  ('ev-test-vote','j-test-p1','c3','concert',5);

-- ─── VÉRIFICATION ─────────────────────────────────────────
SELECT 'PROS test' as scope, count(*) FROM public.pros WHERE id LIKE 'pro-test-%'
UNION ALL SELECT 'PARTENAIRES test', count(*) FROM public.partenaires WHERE id LIKE 'part-test-%'
UNION ALL SELECT 'EVENTS test', count(*) FROM public.events WHERE id LIKE 'ev-test-%'
UNION ALL SELECT 'SUPER EVENTS test', count(*) FROM public.super_events WHERE id LIKE 'se-test-%'
UNION ALL SELECT 'JOUEURS test', count(*) FROM public.joueurs WHERE id LIKE 'j-test-%'
UNION ALL SELECT 'LOTS test', count(*) FROM public.lots WHERE id LIKE 'lot-test-%'
UNION ALL SELECT 'VOTES test', count(*) FROM public.votes WHERE event_id LIKE 'ev-test-%';
