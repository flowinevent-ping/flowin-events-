-- =============================================================================
-- sql/2026-11-19-super-event-phases.sql — Super Event en deux phases (avant / pendant)
-- Décision de Romain (19/11/2026) : « avant l'événement ils gagnent des places ou des lots que
-- tu choisis (organisateur) ; pendant, ils jouent aux lots des commerces et jouent sur place ».
-- Doc : docs/SUPER-EVENT-phases-2026-11-19.md
--
-- NON APPLIQUÉ EN BASE. À exécuter EN UNE FOIS dans l'éditeur SQL Supabase (projet
-- ywcqtupgoxfzkddqkztk).
-- ORDRE D'APPLICATION OBLIGATOIRE :
--   1. sql/2026-11-18-tirage-correctifs.sql  (crée _tirage_acces et la version sécurisée du tirage)
--   2. ce fichier                            (remplace tirage_super_event par la version « phases »)
-- Le bloc 0 refuse de s'exécuter si l'étape 1 n'a pas été faite.
--
-- ADDITIF ET IDEMPOTENT : add column if not exists, contraintes ajoutées seulement si absentes,
-- create or replace. Aucun DROP, aucune donnée modifiée.
--
-- RÈGLES :
--   - Phases actives seulement si super_events.cfg_jeu->'phases'->>'debutJeu' est renseigné et
--     précède date_d. Sinon : une seule phase, tirage identique à la version du 18/11.
--     se-nds-2026 est exclu (pas d'échéance) : son tirage ne change pas.
--   - Phase « avant » : de debutJeu à la veille de date_d. Phase « pendant » : date_d → date_f.
--   - Phase d'un lot : colonne phase si renseignée, sinon lots de l'organisateur (se_lots) =
--     « avant », lots des stations (lots) = « pendant ».
--   - Tirage d'un lot : seuls les joueurs ayant joué PENDANT LA PÉRIODE DE SA PHASE entrent
--     au tirage (tickets comptés sur cette période). Toujours un tirage au sort.
--   - tirage_super_event accepte désormais aussi l'id d'un lot de l'organisateur (se_lots).
-- Le code (admin/) fonctionne avant ce SQL : sans colonne phase, l'écran « Les phases » et le
-- tirage par phase restent masqués.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Garde-fou d'ordre : le correctif du 18/11 doit être appliqué avant.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public._tirage_acces(text, text, text)') is null then
    raise exception 'Appliquer d''abord sql/2026-11-18-tirage-correctifs.sql (fonction _tirage_acces absente).';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Colonnes phase (nullables : null = phase déduite de l'origine du lot).
-- -----------------------------------------------------------------------------
alter table public.se_lots add column if not exists phase text;
alter table public.lots    add column if not exists phase text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'se_lots_phase_check') then
    alter table public.se_lots add constraint se_lots_phase_check check (phase is null or phase in ('avant', 'pendant'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lots_phase_check') then
    alter table public.lots add constraint lots_phase_check check (phase is null or phase in ('avant', 'pendant'));
  end if;
end $$;

comment on column public.se_lots.phase is 'Super Event : avant | pendant. Null = avant (lot de l''organisateur).';
comment on column public.lots.phase    is 'Super Event : avant | pendant. Null = pendant (lot d''une station de commerce).';

-- -----------------------------------------------------------------------------
-- 2. Fenêtre des phases d'un super event (lecture seule).
-- -----------------------------------------------------------------------------
create or replace function public._se_phases(p_se_id text)
returns table(actif boolean, debut date, date_d date, date_f date)
language sql stable
set search_path to 'public'
as $function$
  select (s.cfg_jeu -> 'phases' ->> 'debutJeu') is not null
         and s.date_d is not null
         and (s.cfg_jeu -> 'phases' ->> 'debutJeu')::date < s.date_d
         and s.id <> 'se-nds-2026',
         (s.cfg_jeu -> 'phases' ->> 'debutJeu')::date,
         s.date_d,
         coalesce(s.date_f, s.date_d)
    from super_events s
   where s.id = p_se_id;
$function$;

-- -----------------------------------------------------------------------------
-- 3. tirage_super_event, version « phases ». Même signature, mêmes droits (18/11), mêmes
--    garde-fous : verrou par lot, quantité, un gain par joueur et par super event,
--    comptes de test exclus, chances proportionnelles aux tickets.
-- -----------------------------------------------------------------------------
create or replace function public.tirage_super_event(p_lot_id text, p_nb integer default 1)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  v_se text; v_event text; v_part text; v_nom text; v_titre text; v_val numeric;
  v_qte int; v_phase text; v_orga boolean := false;
  v_global boolean; v_restant int; v_nb int;
  f record; v_du date; v_au date;
begin
  perform pg_advisory_xact_lock(hashtext('tirage-lot:' || coalesce(p_lot_id, '')));

  -- Lot d'une station (table lots)…
  select e.super_event_id, lo.event_id, lo.partenaire_id,
         coalesce(nullif(btrim(lo.nom), ''), lo.titre), lo.titre,
         coalesce(lo.valeur_euros, lo.valeur), coalesce(lo.quantite, 1), lo.phase
    into v_se, v_event, v_part, v_nom, v_titre, v_val, v_qte, v_phase
    from lots lo join events e on e.id = lo.event_id
   where lo.id = p_lot_id;

  -- … ou lot de l'organisateur (se_lots : une ligne = un exemplaire).
  if not found then
    select sl.super_event_id, sl.libelle, sl.valeur, sl.phase
      into v_se, v_nom, v_val, v_phase
      from se_lots sl where sl.id = p_lot_id;
    if not found then return; end if;
    v_orga := true; v_event := null; v_part := null; v_titre := v_nom;
    select count(*) into v_qte from se_lots where super_event_id = v_se and libelle is not distinct from v_nom;
  end if;
  if v_se is null then return; end if;

  if not public._tirage_acces(v_event, v_se, v_part) then
    raise exception 'Accès refusé : connectez-vous (super admin ou pro organisateur).' using errcode = '42501';
  end if;

  select coalesce(tirage_global, true) into v_global from super_events where id = v_se;

  -- Fenêtre de la phase du lot (aucune si phases inactives).
  select * into f from public._se_phases(v_se);
  if f.actif then
    v_phase := coalesce(v_phase, case when v_orga then 'avant' else 'pendant' end);
    if v_phase = 'avant' then v_du := f.debut;  v_au := f.date_d - 1;
    else                      v_du := f.date_d; v_au := f.date_f; end if;
  end if;

  select greatest(v_qte - count(*), 0) into v_restant
    from tirages t
   where t.super_event_id = v_se and t.statut <> 'annule'
     and t.lot_nom in (v_nom, v_titre)
     and (case when v_orga then t.event_id is null else t.event_id = v_event end);
  v_nb := least(greatest(coalesce(p_nb, 1), 0), v_restant);
  if v_nb <= 0 then return; end if;

  return query
  with vivier as (
    select pa.joueur_id, greatest(sum(coalesce(pa.tickets, 1)), 1) as tk
      from participations pa
      join events e on e.id = pa.event_id
     where pa.joueur_id is not null
       and e.super_event_id = v_se
       and (v_global or v_orga or pa.event_id = v_event)
       and (v_du is null
            or coalesce(pa.played_date, (pa.created_at at time zone 'Europe/Paris')::date) between v_du and v_au)
     group by pa.joueur_id
  ), elig as (
    select v.joueur_id, v.tk
      from vivier v join joueurs j on j.id = v.joueur_id
     where lower(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')) not like '%collin%'
       and lower(btrim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,''))) <> 'lucie giordano'
       and v.joueur_id not in (select t.joueur_id from tirages t
                                where t.super_event_id = v_se and t.statut <> 'annule' and t.joueur_id is not null)
  ), pick as (
    select joueur_id from elig order by power(random(), 1.0 / tk) desc limit v_nb
  )
  insert into tirages (type, partenaire_id, lot_nom, lot_valeur, joueur_id, joueur_nom, joueur_email, joueur_tel,
                       ticket_code, retrait_token, super_event_id, event_id)
  select 'grand', v_part, v_nom, v_val, j.id,
         coalesce(nullif(btrim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')), ''), j.email),
         j.email, j.tel, j.ticket_code, replace(gen_random_uuid()::text, '-', ''), v_se, v_event
    from pick k join joueurs j on j.id = k.joueur_id
  returning *;
end;
$function$;

-- Droits inchangés depuis le 18/11 (rappelés : create or replace les conserve).
revoke execute on function public.tirage_super_event(text, integer) from public, anon;
grant execute on function public.tirage_super_event(text, integer) to authenticated, service_role;

commit;
notify pgrst, 'reload schema';

-- Contrôles après application (lecture seule) :
-- select column_name from information_schema.columns where table_name in ('se_lots','lots') and column_name = 'phase';
-- select * from public._se_phases('se-nds-2026');   -- actif = false

-- =============================================================================
-- ROLLBACK (commenté, ne pas exécuter sans Romain) :
--   1. Rejouer la section « tirage_super_event » de sql/2026-11-18-tirage-correctifs.sql
--      (version sans phases).
--   2. Puis, si besoin :
-- begin;
-- drop function if exists public._se_phases(text);
-- alter table public.se_lots drop constraint if exists se_lots_phase_check;
-- alter table public.lots    drop constraint if exists lots_phase_check;
-- alter table public.se_lots drop column if exists phase;
-- alter table public.lots    drop column if exists phase;
-- commit;
-- notify pgrst, 'reload schema';
-- =============================================================================
