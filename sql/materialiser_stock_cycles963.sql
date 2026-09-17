-- lots_sans_stock — Cycles 963 (pt-cycles963).
-- Constat controle_incoherences() au 16-17/09 : lot « 1 journée de location
-- vélo » présent dans partenaires.lots (nb=5) et dans la table `lots`
-- (lot-ev-nds-cycles963-1, quantite=5), mais jamais matérialisé unité par
-- unité dans `lots_stock` (0 ligne) — contrairement à tous les autres
-- commerces NDS (bergerie, carrosserie-gp, giordano, nook, utile, pegase),
-- qui ont chacun leurs codes NDS-<SLUG>-00N. Rien d'inventé : 5 unités,
-- meme nom/valeur/conditions que partenaires.lots (déjà en base).
-- Convention reprise à l'identique (voir ls-gio-*, ls-gp-*, ls-berg-*).

insert into lots_stock (id, lot_id, code, statut, partenaire)
select 'ls-cycles963-' || n, 'lot-nds-cycles963', 'NDS-CYCLES963-' || lpad(n::text, 3, '0'), 'disponible', 'pt-cycles963'
from generate_series(1, 5) as n
where not exists (select 1 from lots_stock s where s.partenaire = 'pt-cycles963');
