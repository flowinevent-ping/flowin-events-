-- Reparation de l identifiant du super event « Fetes du haut et moyen pays ».
-- Applique le 04/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- Constat : l identifiant saisi a la main est parti brut en base —
--   'Fetes du haut et moyen pays Vençois '  (espace final et cedille compris).
-- Consequences : /dashboard/operations/<id> renvoyait « Super event
-- introuvable » (l URL encodee ne redonne jamais l espace final), et la station
-- creee dans la foulee en a herite, QR compris — creerSuperEvent derive
-- l identifiant de station de celui du super event par
-- `d.id.replace(/^se-/, 'ev-')`, qui ne fait rien quand le prefixe est absent.
--
-- Verifie avant execution : aucune contrainte de cle etrangere ne reference
-- super_events.id ni events.id, et une seule ligne pointait vers ce super event
-- (1 event, 0 ticket, 0 reponse, 0 tirage, 0 lot, 0 facture, 0 bon de commande).
-- Le renommage est donc sans perte.
--
-- La cause racine est corrigee dans le code au meme commit :
--   - app/dashboard/wizard-super-event/page.tsx : l identifiant saisi a la main
--     passe desormais par slugSuperEvent(), comme celui deduit du nom.
--   - lib/nds.ts, creerSuperEvent() : refuse un identifiant non slugifie plutot
--     que de l ecrire.

update super_events
   set id     = 'se-fetes-du-haut-et-moyen-pays-vencois',
       events = array['ev-fetes-du-haut-et-moyen-pays-vencois-charvolin-9kfw']
 where id = 'Fetes du haut et moyen pays Vençois ';

update events
   set id              = 'ev-fetes-du-haut-et-moyen-pays-vencois-charvolin-9kfw',
       super_event_id  = 'se-fetes-du-haut-et-moyen-pays-vencois'
 where id = 'Fetes du haut et moyen pays Vençois -charvolin-9kfw';
