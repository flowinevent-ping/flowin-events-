-- 20/11/2026 — NETTOYAGE du rejeu E2E (scenarios 5 et 7). A executer dans l'ordre, une instruction a la fois.
-- Identifiants EXACTS crees par le rejeu (aucun LIKE sur se-test-% : se-test-nice et se-test-vence existent deja et ne sont pas a nous).
-- Joueur : bf14755e-393f-430a-9af4-68c97f52ae23 · Pros : pro-test-boulangerie-e2e, pro-test-orga-festival-e2e
-- Evenements : ev-test-boulangerie-e2e-sn0lre, ev-test-super-event-e2e-test-orga-festival-e2e-jcza, ev-test-super-event-e2e-bis-test-orga-festival-e2e-r87y
-- Super events : se-test-super-event-e2e, se-test-super-event-e2e-bis · Banque : bq-test-boulangerie-e2e-ql5xwt

delete from tirages where event_id = 'ev-test-boulangerie-e2e-sn0lre' and joueur_id = 'bf14755e-393f-430a-9af4-68c97f52ae23';   -- 1
delete from participations where event_id = 'ev-test-boulangerie-e2e-sn0lre';                                                   -- 1
delete from se_reponses where event_id = 'ev-test-boulangerie-e2e-sn0lre';                                                      -- 1
delete from lots where event_id = 'ev-test-boulangerie-e2e-sn0lre';                                                             -- 1
delete from qr_stations where event_id = 'ev-test-boulangerie-e2e-sn0lre';                                                      -- 2
delete from se_lots where super_event_id in ('se-test-super-event-e2e', 'se-test-super-event-e2e-bis');                         -- 10
delete from events where id in ('ev-test-boulangerie-e2e-sn0lre', 'ev-test-super-event-e2e-test-orga-festival-e2e-jcza', 'ev-test-super-event-e2e-bis-test-orga-festival-e2e-r87y');  -- 3
delete from super_events where id in ('se-test-super-event-e2e', 'se-test-super-event-e2e-bis');                                -- 2
delete from banques where id = 'bq-test-boulangerie-e2e-ql5xwt';                                                                -- 1
delete from joueurs where id = 'bf14755e-393f-430a-9af4-68c97f52ae23';                                                          -- 1
delete from profils where email in ('flowinevent+pro-test@gmail.com', 'flowinevent+orga-test@gmail.com');                      -- 2
delete from pros where id in ('pro-test-boulangerie-e2e', 'pro-test-orga-festival-e2e');                                        -- 2
delete from auth.users where email in ('flowinevent+pro-test@gmail.com', 'flowinevent+orga-test@gmail.com');                    -- 2
-- Controle : tout doit renvoyer 0 (se_lots de se-test-nice / se-test-vence : 3 + 3 lignes, a laisser)
select (select count(*) from events where id like 'ev-test-%') ev, (select count(*) from super_events where id in ('se-test-super-event-e2e','se-test-super-event-e2e-bis')) se,
       (select count(*) from pros where id like 'pro-test-%') pros, (select count(*) from auth.users where email ilike 'flowinevent+%') auth_users,
       (select count(*) from joueurs where email ilike 'flowinevent+%') joueurs, (select count(*) from banques where id like 'bq-test-%') banques;
