-- JEU DE DONNEES DE TEST (fictif, base locale jetable) — audit QR du 01/11.
-- Aucune coordonnee reelle : tout est invente pour le test, rien n'est envoye nulle part.
-- 3 animations « normales » (quiz / roue / tombola) + 1 Quiz Master + 1 terminee + 1 brouillon.
-- Plusieurs animations portent VOLONTAIREMENT les memes slugs (magasin, caisse, tracking,
-- reseaux-instagram) : c'est le cas qui provoque des melanges si l'URL ne porte que le slug.

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'pro-a@test.invalid'),
  ('00000000-0000-4000-8000-00000000000b', 'pro-b@test.invalid'),
  ('00000000-0000-4000-8000-0000000000fa', 'sa@test.invalid');
insert into public.flowin_super_admins (auth_id, email) values ('00000000-0000-4000-8000-0000000000fa', 'sa@test.invalid');

insert into public.pros (id, nom, auth_id) values
  ('pro-qa-a', 'Pro A (test)', '00000000-0000-4000-8000-00000000000a'),
  ('pro-qa-b', 'Pro B (test)', '00000000-0000-4000-8000-00000000000b');

insert into public.events (id, pro_id, nom, module, status, date_d, date_f, cfg) values
  ('ev-qa-boulangerie', 'pro-qa-a', 'Boulangerie Dupont',  'quiz',       'live',    null, null, '{"master":{"id":"quiz"}}'),
  ('ev-qa-fleuriste',   'pro-qa-a', 'Fleuriste Rosa',      'spin',       'live',    null, null, '{"master":{"id":"spin"}}'),
  ('ev-qa-garage',      'pro-qa-b', 'Garage Martin',       'tombola',    'live',    null, null, '{"master":{"id":"tombola"}}'),
  ('ev-qa-cafe',        'pro-qa-b', 'Cafe du Port',        'quizmaster', 'live',    null, null, '{}'),
  ('ev-qa-termine',     'pro-qa-a', 'Pizzeria Fermee',     'quiz',       'past',    '2025-01-01', '2025-01-31', '{"master":{"id":"quiz"}}'),
  ('ev-qa-brouillon',   'pro-qa-b', 'Librairie Brouillon', 'quiz',       'pending', null, null, '{"master":{"id":"quiz"}}');

-- QR par defaut (3) pour chaque animation, via la fonction livree dans 08.
select public.qr_assurer_defauts(id) from public.events where id like 'ev-qa-%';

-- QR supplementaires : physiques (caisse, vitrine) et digitaux (reseaux-*), memes slugs d'une animation a l'autre.
insert into public.qr_stations (event_id, nom, source_qr, support, type_qr, publie)
select e.id, v.nom, v.source_qr, v.support, v.type_qr, true
  from public.events e
 cross join (values
   ('Caisse',                 'caisse',                   'Caisse',            'physique'),
   ('Vitrine rue principale', 'vitrine-rue-principale',  'Entrée / vitrine',  'physique'),
   ('Facebook concours',      'reseaux-facebook-concours','Facebook',          'digital'),
   ('TikTok',                 'reseaux-tiktok',           'TikTok',            'digital')
 ) as v(nom, source_qr, support, type_qr)
 where e.id in ('ev-qa-boulangerie','ev-qa-fleuriste','ev-qa-garage','ev-qa-cafe','ev-qa-termine','ev-qa-brouillon');

-- Un QR masque (desactive par le Super Admin) sur la boulangerie.
insert into public.qr_stations (event_id, nom, source_qr, support, type_qr, publie)
values ('ev-qa-boulangerie', 'Ancienne affiche', 'ancienne-affiche', 'Autre', 'physique', false);

insert into public.joueurs (id, email, prenom, nom) values
  ('j-qa-1', 'joueur1@test.invalid', 'Alice', 'Test'),
  ('j-qa-2', 'joueur2@test.invalid', 'Bob', 'Test');
