-- ECRAN SA DE CONTROLE — compteurs d incoherences.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
-- 16/09 (lot 4) : + QR de suivi a valider, + diffusions demandees (referentiel 17).
--
-- Une ligne par controle : combien d elements sont en defaut, et lesquels
-- (10 exemples). Lue par /dashboard/controle. Chaque controle correspond a
-- une famille d erreurs deja rencontree (docs/audit-parcours.html,
-- docs/patterns-bugs-connus.md). 0 partout = etat sain, verifiable sans
-- relire le code.
-- Le gabarit master (se-master-superevent) est exclu de tous les controles.

create or replace function public.controle_incoherences()
returns jsonb
language sql stable security definer
set search_path to 'public'
as $function$
with ev as (
  select * from events where super_event_id is distinct from 'se-master-superevent'
),
c as (
  select 'jeu_vide' cle, e.id, e.nom from ev e
   where e.module in ('quiz','quizmaster','quizsolo','nds2026')
     and coalesce(jsonb_array_length(case when jsonb_typeof(e.cfg->'quizBanques')='array' then e.cfg->'quizBanques' end),0) = 0
     and coalesce(jsonb_array_length(case when jsonb_typeof(e.cfg->'customQuestions')='array' then e.cfg->'customQuestions' end),0) = 0
  union all
  select 'sans_qr', e.id, e.nom from ev e
   where not (coalesce(e.cfg,'{}'::jsonb) ? 'qrUrl')
  union all
  select 'lots_cfg', e.id, e.nom from ev e
   where jsonb_typeof(e.cfg->'lots') = 'array' and jsonb_array_length(e.cfg->'lots') > 0
     and not exists (select 1 from lots l where l.event_id = e.id)
  union all
  select 'event_sans_pro', e.id, e.nom from ev e where e.pro_id is null
  union all
  select 'station_sans_gps', e.id, e.nom from ev e
   where e.super_event_id is not null and (e.lat is null or e.lng is null)
  union all
  select 'pro_sans_partenaire', p.id, p.nom from pros p
   where p.partenaire_id is null
  union all
  select 'pro_sans_event', p.id, p.nom from pros p
   where not exists (select 1 from ev e where e.pro_id = p.id)
  union all
  select 'pro_sans_compte', p.id, p.nom from pros p where p.auth_id is null
  union all
  select 'lots_sans_stock', pa.id, pa.nom from partenaires pa
   where jsonb_typeof(pa.lots) = 'array' and jsonb_array_length(pa.lots) > 0
     and not exists (select 1 from lots_stock s where s.partenaire = pa.id)
  union all
  select 'gagnant_a_appeler', t.id::text, coalesce(t.joueur_nom, '—') || ' · ' || coalesce(t.lot_nom, '') from tirages t
   where t.statut <> 'annule' and t.type = 'grand' and t.super_event_id is not null
     and t.notifie_at is null and t.retire_at is null
  union all
  select 'demande_en_attente', d.id::text, coalesce(d.pro_id, '') || ' → ' || coalesce(d.super_event_id, '') from demandes_rattachement_super_event d
   where d.statut = 'en_attente'
  union all
  select 'qr_suivi_a_valider', q.event_id, coalesce(e.nom, q.event_id) || ' · ' || q.nom from qr_stations q
    join ev e on e.id = q.event_id
   where coalesce(q.publie, false) = false
  union all
  select 'diffusion_a_traiter', e.id, e.nom from ev e
   where e.cfg->'diffusion_demandee'->>'statut' = 'en_attente_sa'
     and (coalesce((e.cfg->'diffusion_demandee'->>'physique')::boolean, false)
          or coalesce((e.cfg->'diffusion_demandee'->>'qr_tracking')::boolean, false))
  union all
  select 'se_sans_dates', s.id, s.nom from super_events s
   where s.id <> 'se-master-superevent' and (s.date_d is null or s.date_f is null)
),
libs(cle, libelle, cible, rang) as (values
  ('jeu_vide','Jeux à questions sans aucune question','events',1),
  ('sans_qr','Events sans lien de QR (cfg.qrUrl)','events',2),
  ('lots_cfg','Lots saisis dans cfg.lots mais absents de la table lots','events',3),
  ('event_sans_pro','Events sans pro rattaché','events',4),
  ('station_sans_gps','Stations de super event sans coordonnées (carte vide)','events',5),
  ('pro_sans_partenaire','Pros sans fiche commerce liée (logo, site, contrat)','pros',6),
  ('pro_sans_event','Pros sans aucun event','pros',7),
  ('pro_sans_compte','Pros sans compte de connexion','pros',8),
  ('lots_sans_stock','Commerces avec lots engagés mais aucune unité de stock','partenaires',9),
  ('gagnant_a_appeler','Gagnants de super event jamais confirmés (à appeler)','tirages',10),
  ('demande_en_attente','Demandes de participation en attente','demandes',11),
  ('qr_suivi_a_valider','QR de suivi demandés, à valider (onglet QR & liens de la station)','events',12),
  ('diffusion_a_traiter','Supports imprimés ou QR de suivi demandés à la création','events',13),
  ('se_sans_dates','Super events sans dates','super_events',14))
select coalesce(jsonb_agg(jsonb_build_object(
  'cle', l.cle, 'libelle', l.libelle, 'cible', l.cible,
  'n', (select count(*) from c where c.cle = l.cle),
  'exemples', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'nom', x.nom))
                        from (select id, nom from c where c.cle = l.cle order by nom limit 10) x), '[]'::jsonb)
) order by l.rang), '[]'::jsonb)
from libs l;
$function$;
grant execute on function public.controle_incoherences() to public, anon, authenticated;
notify pgrst, 'reload schema';
