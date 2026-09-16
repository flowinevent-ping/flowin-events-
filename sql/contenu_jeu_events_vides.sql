-- FAMILLE G — 4 events a questions sortis sans aucune question.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- Verifie avant application (quizBanques vide ET customQuestions vide) :
--   ev-nds-2026-ay4n9a (quiz, pro-nds-2026), ev-charvolin-qt4gxc,
--   ev-charvolin-uqzchj, ev-fetes-du-haut-et-moyen-pays-vencois-charvolin-9kfw
--   (Quiz + bonus, pro-charvolin).
--
-- Regle : rien n est invente, le contenu vient du GABARIT marque blanche.
--   1. la station du gabarit master tenue par le MEME pro (Charvolin :
--      ev-master-superevent-charvolin) -> ses cles de contenu de jeu ;
--   2. a defaut, la premiere station du gabarit portant des banques.
-- Cles reprises : banques quiz, nombre de questions, chrono, bonus, sondage,
-- et, pour le module Quiz + bonus, la mise en page marque blanche.
-- Les cles deja renseignees de l event (lots, qrUrl, dates...) sont conservees ;
-- quizBanques, vide, est remplace.

with cible as (
  select e.id, e.pro_id, e.module, e.cfg
  from events e
  where e.module in ('quiz', 'quizmaster', 'quizsolo', 'nds2026')
    and e.super_event_id is distinct from 'se-master-superevent'
    and coalesce(jsonb_array_length(case when jsonb_typeof(e.cfg->'quizBanques') = 'array' then e.cfg->'quizBanques' end), 0) = 0
    and coalesce(jsonb_array_length(case when jsonb_typeof(e.cfg->'customQuestions') = 'array' then e.cfg->'customQuestions' end), 0) = 0
),
source as (
  select c.id,
         coalesce(
           (select m.cfg from events m
             where m.super_event_id = 'se-master-superevent' and m.pro_id = c.pro_id
               and jsonb_array_length(coalesce(m.cfg->'quizBanques', '[]')) > 0
             order by m.id limit 1),
           (select m.cfg from events m
             where m.super_event_id = 'se-master-superevent'
               and jsonb_array_length(coalesce(m.cfg->'quizBanques', '[]')) > 0
             order by m.id limit 1)
         ) scfg
  from cible c
),
contenu as (
  select c.id,
         jsonb_strip_nulls(jsonb_build_object(
           'quizBanques', s.scfg->'quizBanques',
           'quizNbQuestions', s.scfg->'quizNbQuestions',
           'quizTimer', s.scfg->'quizTimer',
           'quizBonusList', s.scfg->'quizBonusList',
           'bonusList', s.scfg->'bonusList',
           'sondage', s.scfg->'sondage'
         ))
         || case when c.module = 'nds2026' then jsonb_strip_nulls(jsonb_build_object(
           'mbLayout', s.scfg->'mbLayout',
           'mbUI', s.scfg->'mbUI',
           'uiMaster', s.scfg->'uiMaster',
           'bonusPopup', s.scfg->'bonusPopup'
         )) else '{}'::jsonb end as ajout
  from cible c join source s on s.id = c.id
  where s.scfg is not null
)
update events e
   set cfg = (coalesce(e.cfg, '{}'::jsonb) - 'quizBanques') || (k.ajout - (select coalesce(array_agg(x), '{}') from jsonb_object_keys(e.cfg - 'quizBanques') x))
  from contenu k
 where e.id = k.id;
