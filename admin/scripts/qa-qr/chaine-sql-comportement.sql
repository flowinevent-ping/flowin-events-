-- Tests de COMPORTEMENT de la chaine SQL (base locale jetable, apres chaine-sql.sh). Chaque test affiche OK ou KO.
-- Les donnees sont fictives (domaine .invalid). Rien ne sort de la base locale.
\set ON_ERROR_STOP 0
create temp table resultats (nom text, ok boolean, detail text);
grant all on resultats to public;

-- Jeu de donnees
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a9', 'pro-a@test.invalid'),
  ('00000000-0000-4000-8000-0000000000b9', 'pro-b@test.invalid'),
  ('00000000-0000-4000-8000-0000000000f9', 'sa@test.invalid') on conflict do nothing;
insert into public.flowin_super_admins (auth_id, email) values ('00000000-0000-4000-8000-0000000000f9', 'sa@test.invalid') on conflict do nothing;
insert into public.pros (id, nom, auth_id, email, siret, statut, onboarding_source) values
  ('pro-t-a', 'Pro A', '00000000-0000-4000-8000-0000000000a9', 'pro-a@test.invalid', '12345678901234', 'en_attente', 'premiere-fois'),
  ('pro-t-b', 'Pro B', '00000000-0000-4000-8000-0000000000b9', 'pro-b@test.invalid', '', 'valide', null);
insert into public.events (id, pro_id, nom, module, status) values
  ('ev-t-a', 'pro-t-a', 'Boulangerie A', 'quiz', 'live'),
  ('ev-t-b', 'pro-t-b', 'Garage B', 'quiz', 'live');
insert into public.joueurs (id, email, prenom, nom, tel, optin) values
  ('00000000-0000-4000-8000-00000000c001', 'oui@test.invalid', 'Alice', 'Martin', '0600000001', true),
  ('00000000-0000-4000-8000-00000000c002', 'non@test.invalid', 'Bob', 'Durand', '0600000002', false);
insert into public.participations (event_id, joueur_id, score, completed) values
  ('ev-t-a', '00000000-0000-4000-8000-00000000c001', 3, true),
  ('ev-t-a', '00000000-0000-4000-8000-00000000c002', 2, true),
  ('ev-t-b', '00000000-0000-4000-8000-00000000c002', 1, true);

-- 05 : le pro ne voit les coordonnees que des joueurs qui ont consenti
set role anon;
insert into resultats select '05 consentant : email visible', (select email from public.crm_pro_consentants('pro-t-a') where prenom = 'Alice') = 'oui@test.invalid', null;
insert into resultats select '05 non consentant : email masque', (select email is null and tel is null and prenom is null and nom = 'D.' from public.crm_pro_consentants('pro-t-a') where joueur_id = '00000000-0000-4000-8000-00000000c002'), null;
insert into resultats select '05 non consentant : reste compte (parties)', (select nb_parties = 1 from public.crm_pro_consentants('pro-t-a') where joueur_id = '00000000-0000-4000-8000-00000000c002'), null;
insert into resultats select '05 pro A ne voit pas les joueurs du pro B seulement', (select count(*) = 2 from public.crm_pro_consentants('pro-t-a')), null;
insert into resultats select '05 liste par ids : consentants seulement', (select count(*) = 1 from public.joueurs_consentants_par_ids(array['00000000-0000-4000-8000-00000000c001','00000000-0000-4000-8000-00000000c002']::uuid[])), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null

-- 05 : la politique SA lit joueurs connecte, pas anon-authentifie simple
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f9', false);
insert into resultats select '05 SA connecte voit les joueurs', (select count(*) >= 2 from public.joueurs), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null

-- 06 : droits du pro
update public.pros set droits = jsonb_set(jsonb_set(droits, '{creer_animation}', 'false'), '{creer_banques}', 'false') where id = 'pro-t-b';
set role anon;
do $$ begin
  insert into public.events (id, pro_id, nom, module, status) values ('ev-t-refus', 'pro-t-b', 'Doit etre refuse', 'quiz', 'pending');
  insert into resultats values ('06 droit coupe : creation refusee', false, 'insert accepte');
exception when insufficient_privilege then
  insert into resultats values ('06 droit coupe : creation refusee', true, sqlerrm);
end $$;
do $$ begin
  update public.pros set droits = '{"creer_animation":true}'::jsonb where id = 'pro-t-b';
  insert into resultats values ('06 un pro ne se redonne pas un droit', (select (droits->>'creer_animation')::boolean = false from public.pros where id='pro-t-b'), 'maj acceptee ou ignoree');
exception when others then
  insert into resultats values ('06 un pro ne se redonne pas un droit', true, sqlerrm);
end $$;
do $$ begin
  insert into public.banques (id, nom, pro_id) values ('bq-t-refus', 'Doit etre refusee', 'pro-t-b');
  insert into resultats values ('06 droit banques coupe : creation refusee', false, 'insert accepte');
exception when insufficient_privilege then insert into resultats values ('06 droit banques : creation refusee', true, sqlerrm); end $$;
do $$ begin
  insert into public.super_events (id, nom, pro_id) values ('se-t-refus', 'Doit etre refuse', 'pro-t-b');
  insert into resultats values ('06 super event : creation refusee (droit coupe par defaut)', false, 'insert accepte');
exception when insufficient_privilege then insert into resultats values ('06 super event : creation refusee (droit coupe par defaut)', true, sqlerrm); end $$;
insert into public.events (id, pro_id, nom, module, status) values ('ev-t-ok-a', 'pro-t-a', 'Pro A garde ses droits', 'quiz', 'pending');
insert into resultats select '06 pro avec droit : creation acceptee', exists (select 1 from public.events where id = 'ev-t-ok-a'), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f9', false);
insert into public.events (id, pro_id, nom, module, status) values ('ev-t-sa', 'pro-t-b', 'SA cree pour le pro', 'quiz', 'pending');
insert into resultats select '06 Super Admin connecte jamais bloque', exists (select 1 from public.events where id = 'ev-t-sa'), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null

-- 03 : commande, virement valide par le SA, facture, mise en service
set role anon;
do $$ begin
  insert into public.commandes_animation (id, raison_sociale, siret, adresse, cp, ville, contact_nom, email, tel, signataire_nom, cgv_acceptee, signature_acceptee, pro_id)
  values ('AM-20261101-TEST0001', 'Boulangerie A SARL', '12345678901234', '1 rue Test', '06140', 'Vence', 'Contact Test', 'pro-a@test.invalid', '0600000000', 'Contact Test', true, true, 'pro-t-a');
  insert into resultats values ('03 commande anonyme : insertion', true, null);
exception when others then insert into resultats values ('03 commande anonyme : insertion', false, sqlerrm);
end $$;
do $$ begin perform 1 from public.commandes_animation; insert into resultats values ('03 anon ne lit pas les commandes', false, 'lecture possible');
exception when insufficient_privilege then insert into resultats values ('03 anon ne lit pas les commandes', true, null); end $$;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a9', false);
insert into resultats select '03 le pro lit SA commande', (select count(*) = 1 from public.commandes_animation where pro_id = 'pro-t-a'), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b9', false);
insert into resultats select '03 un autre pro ne voit rien', (select count(*) = 0 from public.commandes_animation), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null

set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f9', false); select set_config('request.jwt.claims', '{"email":"sa@test.invalid"}', false);
select public.admin_marquer_virement_recu('AM-20261101-TEST0001', 'test');
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
insert into resultats select '03 virement valide : statut payee', (select statut = 'payee' from public.commandes_animation where id='AM-20261101-TEST0001'), null;
insert into resultats select '03 montant recalcule en base (990 HT = 1188 TTC)', (select montant_ttc = 1188 from public.commandes_animation where id='AM-20261101-TEST0001'), null;
insert into resultats select '03 facture emise (numero FL-AM-)', (select count(*) = 1 and bool_and(numero like 'FL-AM-%') from public.factures_animation where commande_id='AM-20261101-TEST0001'), null;
insert into resultats select '03 espace pro active (statut valide)', (select statut = 'valide' and acces_active_at is not null from public.pros where id='pro-t-a'), null;

-- 03 : commande passee SANS compte, rattachee ensuite par l'email confirme de la session (pas par le SIRET)
set role anon;
insert into public.commandes_animation (id, raison_sociale, siret, adresse, cp, ville, contact_nom, email, tel, signataire_nom, cgv_acceptee, signature_acceptee)
values ('AM-20261101-TEST0002', 'Garage B SARL', '98765432109876', '2 rue Test', '06140', 'Vence', 'Contact B', 'pro-b@test.invalid', '0600000000', 'Contact B', true, true);
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a9', false); select set_config('request.jwt.claims', '{"email":"pro-a@test.invalid"}', false);
insert into resultats select '03 pro A : rien a rattacher (email different)', public.rattacher_mes_commandes() = 0, null;
insert into resultats select '03 pro A ne voit pas la commande sans compte de B', (select count(*) = 0 from public.commandes_animation where id = 'AM-20261101-TEST0002'), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b9', false); select set_config('request.jwt.claims', '{"email":"pro-b@test.invalid"}', false);
insert into resultats select '03 pro B : commande rattachee par son email', public.rattacher_mes_commandes() = 1, null;
insert into resultats select '03 pro B voit desormais sa commande', (select count(*) = 1 from public.commandes_animation where id = 'AM-20261101-TEST0002'), null;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null

-- 08 : offre « satisfait ou rembourse » SUSPENDUE : une commande ne peut pas porter la garantie (meme fabriquee a la main)
set role anon;
insert into public.commandes_animation (id, raison_sociale, siret, adresse, cp, ville, contact_nom, email, tel, signataire_nom, cgv_acceptee, signature_acceptee, offre, panier_moyen, garantie, garantie_certifiee_le, garantie_certifiee_par, flux_journalier)
values ('AM-20261101-GARA0001', 'Garantie Test', '11111111111111', '3 rue Test', '06140', 'Vence', 'G Test', 'garantie@test.invalid', '0600000000', 'G Test', true, true, 'annuelle', 20, true, now(), 'G Test', '15+');
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
insert into resultats select '08 garantie suspendue : commande enregistree sans garantie', (select garantie = false and garantie_certifiee_le is null from public.commandes_animation where id = 'AM-20261101-GARA0001'), null;
do $$ begin perform public.souscrire_garantie_animation('AM-20261101-GARA0001', 20, '15+', 'G Test'); insert into resultats values ('08 garantie suspendue : souscription apres coup refusee', false, 'acceptee');
exception when others then insert into resultats values ('08 garantie suspendue : souscription apres coup refusee', sqlerrm like 'garantie_suspendue%', sqlerrm); end $$;
update public.facturation_config set garantie_active = true where id = 1;
set role anon;
insert into public.commandes_animation (id, raison_sociale, siret, adresse, cp, ville, contact_nom, email, tel, signataire_nom, cgv_acceptee, signature_acceptee, offre, panier_moyen, garantie, garantie_certifiee_le, garantie_certifiee_par, flux_journalier)
values ('AM-20261101-GARA0002', 'Garantie Test 2', '22222222222222', '3 rue Test', '06140', 'Vence', 'G Test', 'garantie2@test.invalid', '0600000000', 'G Test', true, true, 'annuelle', 20, true, now(), 'G Test', '15+');
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null
insert into resultats select '08 garantie reactivee : la garantie est de nouveau enregistree', (select garantie = true from public.commandes_animation where id = 'AM-20261101-GARA0002'), null;
update public.facturation_config set garantie_active = false where id = 1;

-- 11 : Nuits du Sud : seule la position est posee, la configuration n'est pas touchee ; FHMP : cfg_jeu fusionnee, pas ecrasee
insert into public.super_events (id, nom, status, module, cfg_jeu, date_d, date_f) values ('se-nds-2026', 'Nuits du Sud 2026', 'live', 'nds2026', '{"garde":"oui"}'::jsonb, '2026-07-09', '2026-07-18') on conflict (id) do nothing;
insert into public.super_events (id, nom, status, module, cfg_jeu) values ('se-fetes-du-haut-et-moyen-pays-vencois', 'Fetes du haut et moyen pays', 'live', 'nds2026', '{"garde":"oui"}'::jsonb) on conflict (id) do nothing;
\i :chemin_sql11
insert into resultats select '11 NDS : position Vence posee, jeu / dates / config intacts', (select lat is not null and module = 'nds2026' and cfg_jeu = '{"garde":"oui"}'::jsonb and date_d = '2026-07-09' from public.super_events where id='se-nds-2026'), null;
insert into resultats select '11 FHMP : demo ajoutee sans ecraser cfg_jeu', (select module = 'quiz' and cfg_jeu ? 'garde' and cfg_jeu ? 'customQuestions' and logo_url = '/demo/fhmp-logo.svg' from public.super_events where id='se-fetes-du-haut-et-moyen-pays-vencois'), null;

-- 04 : RIB du pro : fermé à anon
set role anon;
do $$ begin perform 1 from public.pros_rib; insert into resultats values ('04 anon ne lit pas le RIB', false, 'lecture possible');
exception when insufficient_privilege then insert into resultats values ('04 anon ne lit pas le RIB', true, null); end $$;
reset role; select set_config('request.jwt.claim.sub', '', false) \g /dev/null

select case when ok then 'OK ' else 'KO ' end || nom || coalesce(' [' || detail || ']', '') from resultats order by ok, nom;
