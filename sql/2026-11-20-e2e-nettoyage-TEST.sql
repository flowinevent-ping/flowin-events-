-- 20/11/2026 — NETTOYAGE des donnees de test E2E (a executer par Romain, dans cet ordre, une instruction a la fois).
-- Chaque DELETE est limite aux identifiants TEST crees par l'agent. Comptes attendus (SELECT de controle en bas).
-- Joueurs test : 8c89cef8-591c-4544-be6c-deb57bc370b1 (joueur-test), 68c44fa9-ba5c-43d8-9b35-03ec8544714f (ami-test)
-- Pros test : pro-test-boulangerie-e2e, pro-test-orga-festival-e2e ; super event : se-test-super-event-e2e

delete from joueur_notifications where joueur_id in ('8c89cef8-591c-4544-be6c-deb57bc370b1','68c44fa9-ba5c-43d8-9b35-03ec8544714f');          -- 1
delete from tirages where event_id like 'ev-test-%' or super_event_id = 'se-test-super-event-e2e'
  or joueur_id in ('8c89cef8-591c-4544-be6c-deb57bc370b1','68c44fa9-ba5c-43d8-9b35-03ec8544714f');                                              -- 5
delete from se_gains where super_event_id = 'se-test-super-event-e2e' or event_id like 'ev-test-%';                                              -- 0
delete from se_tickets where super_event_id = 'se-test-super-event-e2e' or event_id like 'ev-test-%';                                            -- 2
delete from se_reponses where super_event_id = 'se-test-super-event-e2e' or event_id like 'ev-test-%';                                           -- 5
delete from participations where event_id like 'ev-test-%';                                                                                      -- 5
delete from clients_commerce where pro_id in ('pro-test-boulangerie-e2e','pro-test-orga-festival-e2e');                                          -- 1
delete from lots_stock where lot_id in (select id from lots where event_id like 'ev-test-%');                                                    -- 0
delete from lots where event_id like 'ev-test-%';                                                                                                -- 9
delete from qr_stations where event_id like 'ev-test-%';                                                                                         -- 15
delete from se_lots where super_event_id = 'se-test-super-event-e2e';                                                                            -- 4
delete from demandes_rattachement_super_event where super_event_id = 'se-test-super-event-e2e';                                                  -- 1
delete from events where id like 'ev-test-%';                                                                                                    -- 6
delete from super_events where id = 'se-test-super-event-e2e';                                                                                   -- 1
delete from banques where id like 'bq-test-%';                                                                                                   -- 4
update pros set partenaire_id = null where id in ('pro-test-boulangerie-e2e');
delete from partenaires where id = 'test-part-boulangerie-e2e';                                                                                  -- 1
delete from pros where id in ('pro-test-boulangerie-e2e','pro-test-orga-festival-e2e');                                                          -- 2
delete from joueurs where id in ('8c89cef8-591c-4544-be6c-deb57bc370b1','68c44fa9-ba5c-43d8-9b35-03ec8544714f');                                 -- 2
-- profils : ligne par compte auth (supprimee en cascade avec auth.users si FK, sinon l'effacer d'abord)
delete from profils where email in ('flowinevent+pro-test@gmail.com','flowinevent+orga-test@gmail.com');                                         -- 2
delete from auth.users where email in ('flowinevent+pro-test@gmail.com','flowinevent+orga-test@gmail.com');                                      -- 2

-- Controle : tout doit renvoyer 0
select (select count(*) from events where id like 'ev-test-%') ev, (select count(*) from super_events where id = 'se-test-super-event-e2e') se,
       (select count(*) from pros where id like 'pro-test-%') pros, (select count(*) from joueurs where email ilike 'flowinevent+%') joueurs,
       (select count(*) from auth.users where email ilike 'flowinevent+%') auth_users, (select count(*) from tirages where event_id like 'ev-test-%' or super_event_id = 'se-test-super-event-e2e') tirages,
       (select count(*) from lots where event_id like 'ev-test-%') lots, (select count(*) from qr_stations where event_id like 'ev-test-%') qr,
       (select count(*) from banques where id like 'bq-test-%') banques, (select count(*) from partenaires where id like 'test-part-%') partenaires;
