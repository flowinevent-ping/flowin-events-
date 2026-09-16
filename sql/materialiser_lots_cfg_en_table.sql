-- FAMILLE C — lots ecrits dans events.cfg.lots, jamais dans la table `lots`.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- creerAnimation() (parcours pro /pro/jeu) ecrivait les lots dans cfg.lots.
-- Tout le reste -- ecran Lots, stock, tirage, destockage -- lit la table
-- `lots` : ces lots etaient invisibles ET inexploitables.
-- Verifie avant application : 2 events, 3 lots, 0 ligne en table
--   (« maxi assurance » 1 lot, « teste sept » 2 lots, pro-charvolin).
--
-- Requete generique : tout lot de cfg.lots dont l id calcule n existe pas
-- encore en table est cree. Rejouable sans doublon. cfg.lots est conserve
-- (lecture de compatibilite). Le code (lib/pro.ts, creerAnimation) ecrit
-- desormais aussi dans la table, l ecart ne se recreuse plus.
--
-- id : 'lot-' || event_id || '-' || rang (1, 2, ...) -- meme regle que le code.
-- partenaire_id : la fiche commerce du pro, si elle existe.
-- note : le type saisi dans le parcours (tirage / instantane), la table n a
-- pas de colonne dediee.

insert into lots (id, event_id, partenaire_id, titre, nom, quantite, valeur, valeur_euros, conditions, note)
select 'lot-' || e.id || '-' || l.rang,
       e.id,
       p.partenaire_id,
       coalesce(nullif(btrim(l.v->>'nom'), ''), 'Lot'),
       coalesce(nullif(btrim(l.v->>'nom'), ''), 'Lot'),
       coalesce((l.v->>'quantite')::int, 1),
       coalesce((l.v->>'valeur')::numeric, 0),
       (l.v->>'valeur')::numeric,
       nullif(btrim(l.v->>'conditions'), ''),
       case l.v->>'type' when 'instantane' then 'Type : gain instantané' when 'tirage' then 'Type : tirage au sort' else '' end
from events e
cross join lateral jsonb_array_elements(e.cfg->'lots') with ordinality as l(v, rang)
left join pros p on p.id = e.pro_id
where jsonb_typeof(e.cfg->'lots') = 'array'
  and not exists (select 1 from lots x where x.id = 'lot-' || e.id || '-' || l.rang);
