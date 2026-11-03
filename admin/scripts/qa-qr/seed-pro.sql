-- JEU DE DONNEES FICTIF pour les captures de l'espace pro (base locale jetable flowin_chain, apres chaine-sql.sh).
-- Tout est invente (domaine .invalid) ; aucun contact reel.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'boulangerie@test.invalid'),
  ('00000000-0000-4000-8000-0000000000b1', 'garage@test.invalid'),
  ('00000000-0000-4000-8000-0000000000c1', 'nouveau@test.invalid'),
  ('00000000-0000-4000-8000-0000000000f1', 'sa@test.invalid') on conflict do nothing;
insert into public.flowin_super_admins (auth_id, email) values ('00000000-0000-4000-8000-0000000000f1', 'sa@test.invalid') on conflict do nothing;

insert into public.pros (id, nom, auth_id, email, siret, siren, forme_juridique, code_naf, activite_naf, adresse, ville, code_postal, tel, contact, statut, onboarding_source) values
  ('pro-demo', 'Boulangerie du Port (test)', '00000000-0000-4000-8000-0000000000a1', 'boulangerie@test.invalid', '12345678901234', '123456789', 'SARL', '10.71C', 'Boulangerie', '1 rue du Port', 'Vence', '06140', '0600000000', 'Alice Test', 'valide', 'premiere-fois'),
  ('pro-b', 'Garage Martin (test)', '00000000-0000-4000-8000-0000000000b1', 'garage@test.invalid', '', '', '', '', '', '', 'Vence', '06140', '', 'Bob Test', 'valide', null),
  ('pro-nouveau', 'Librairie Neuve (test)', '00000000-0000-4000-8000-0000000000c1', 'nouveau@test.invalid', '98765432109876', '987654321', 'SAS', '47.61Z', 'Librairie', '2 rue Neuve', 'Vence', '06140', '0600000001', 'Clara Test', 'en_attente', 'premiere-fois');
update public.pros set droits = jsonb_set(droits, '{creer_banques}', 'false') where id = 'pro-b';

insert into public.super_events (id, nom, pro_id, status, date_d, date_f, description) values
  ('se-demo-2026', 'Festival de demonstration 2026', null, 'live', current_date - 3, current_date + 5, 'Super event de test');
insert into public.events (id, pro_id, nom, module, status, date_d, date_f, super_event_id, cfg, lat, lng) values
  ('ev-demo-boulangerie', 'pro-demo', 'Boulangerie du Port', 'quiz', 'live', current_date - 3, current_date + 5, 'se-demo-2026', '{"master":{"id":"quiz"}}', 43.7222, 7.1067),
  ('ev-demo-garage', 'pro-b', 'Garage Martin', 'quiz', 'live', current_date - 3, current_date + 5, 'se-demo-2026', '{"master":{"id":"quiz"}}', 43.7231, 7.1089),
  ('ev-demo-auto', 'pro-demo', 'Anniversaire de la boulangerie', 'spin', 'live', null, null, null, '{"master":{"id":"spin"}}', null, null),
  ('ev-demo-brouillon', 'pro-demo', 'Jeu de Noel (brouillon)', 'tombola', 'pending', current_date + 30, current_date + 40, null, '{"master":{"id":"tombola"}}', null, null);
update public.super_events set events = array['ev-demo-boulangerie','ev-demo-garage'], pros = array['pro-demo','pro-b'] where id = 'se-demo-2026';

insert into public.joueurs (id, email, prenom, nom, tel, code_postal, genre, optin, first_seen) values
  ('00000000-0000-4000-8000-00000000d001', 'alice@test.invalid', 'Alice', 'Martin', '0600000011', '06140', 'F', true,  now() - interval '2 days'),
  ('00000000-0000-4000-8000-00000000d002', 'bob@test.invalid',   'Bob',   'Durand', '0600000012', '06140', 'H', false, now() - interval '2 days'),
  ('00000000-0000-4000-8000-00000000d003', 'carla@test.invalid', 'Carla', 'Lopez',  '0600000013', '06100', 'F', true,  now() - interval '1 day'),
  ('00000000-0000-4000-8000-00000000d004', 'david@test.invalid', 'David', 'Petit',  '0600000014', '06200', 'H', false, now() - interval '1 day');
insert into public.participations (event_id, joueur_id, score, completed, played_date, tickets, source_qr, created_at) values
  ('ev-demo-boulangerie', '00000000-0000-4000-8000-00000000d001', 4, true, current_date - 2, 1, 'caisse', now() - interval '2 days'),
  ('ev-demo-boulangerie', '00000000-0000-4000-8000-00000000d002', 3, true, current_date - 2, 0, 'caisse', now() - interval '2 days'),
  ('ev-demo-boulangerie', '00000000-0000-4000-8000-00000000d003', 4, true, current_date - 1, 1, 'vitrine', now() - interval '1 day'),
  ('ev-demo-garage',      '00000000-0000-4000-8000-00000000d004', 2, true, current_date - 1, 0, 'accueil', now() - interval '1 day'),
  ('ev-demo-garage',      '00000000-0000-4000-8000-00000000d003', 4, true, current_date,     1, 'accueil', now()),
  ('ev-demo-auto',        '00000000-0000-4000-8000-00000000d001', 4, true, current_date - 1, 1, 'caisse', now() - interval '1 day');

insert into public.lots (id, event_id, nom, valeur, quantite) values
  ('lot-demo-1', 'ev-demo-boulangerie', 'Un panier de viennoiseries', 15, 5),
  ('lot-demo-2', 'ev-demo-auto', 'Une tarte aux fruits', 20, 3);

insert into public.banques (id, nom, pro_id, description, statut, questions) values
  ('bq-demo-1', 'Culture generale du port', 'pro-demo', 'Questions de test', 'valide',
   '[{"id":"q1","type":"quiz","texte":"Quelle est la capitale de la France ?","choix":["Paris","Lyon","Nice"],"bonne":0}]'::jsonb);

select public.qr_assurer_defauts(id) from public.events where id like 'ev-demo-%';

-- Commandes : une payee (virement valide par le SA) liee au compte, une en attente
set role anon;
insert into public.commandes_animation (id, raison_sociale, siret, adresse, cp, ville, contact_nom, email, tel, signataire_nom, cgv_acceptee, signature_acceptee, pro_id, offre, kit)
values ('AM-20261101-DEMO0001', 'Boulangerie du Port SARL', '12345678901234', '1 rue du Port', '06140', 'Vence', 'Alice Test', 'boulangerie@test.invalid', '0600000000', 'Alice Test', true, true, 'pro-demo', 'annuelle', 'digital');
insert into public.commandes_animation (id, raison_sociale, siret, adresse, cp, ville, contact_nom, email, tel, signataire_nom, cgv_acceptee, signature_acceptee, pro_id, offre, kit)
values ('AM-20261101-DEMO0002', 'Librairie Neuve SAS', '98765432109876', '2 rue Neuve', '06140', 'Vence', 'Clara Test', 'nouveau@test.invalid', '0600000001', 'Clara Test', true, true, 'pro-nouveau', 'annuelle', 'physique');
reset role;
select set_config('request.jwt.claims', '{"email":"sa@test.invalid"}', false) \g /dev/null
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f1', false) \g /dev/null
select public.admin_marquer_virement_recu('AM-20261101-DEMO0001', 'seed');
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
-- Le test ne doit pas changer l'etat « en attente » du compte nouveau (sa commande reste a valider)
update public.pros set statut = 'en_attente' where id = 'pro-nouveau';
