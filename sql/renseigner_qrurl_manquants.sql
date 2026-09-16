-- FAMILLE G — events sans cfg.qrUrl.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- Verifie avant application : 3 events hors gabarit sans qrUrl, tous crees
-- par des chemins qui ne l ecrivaient pas (creerSuperEvent, creerAnimation) :
--   ev-fetes-du-haut-et-moyen-pays-vencois-charvolin-9kfw, ev-charvolin-qt4gxc,
--   ev-charvolin-uqzchj.
-- La valeur est deterministe, meme regle que lib/wizard.ts urlQr() :
--   https://flowin-events.vercel.app/parcours/<module>?ev=<id>
-- Les deux chemins l ecrivent desormais a la creation.

update events
   set cfg = jsonb_set(coalesce(cfg, '{}'::jsonb), '{qrUrl}',
         to_jsonb('https://flowin-events.vercel.app/parcours/' || coalesce(nullif(module, ''), 'quiz') || '?ev=' || id), true)
 where not (coalesce(cfg, '{}'::jsonb) ? 'qrUrl')
   and super_event_id is distinct from 'se-master-superevent';
