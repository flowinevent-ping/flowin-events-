-- =============================================================================
-- sql/2026-11-10-tickets-animation.sql — TICKETS GAGNANTS DES ANIMATIONS DANS LE PROFIL
-- (Romain, 10/11/2026 soir : docs/DECISIONS-flowin-event.md « Tickets gagnants dans le profil »)
--
-- NON APPLIQUÉ. À appliquer à la main (SQL editor), section par section, dans l'ordre.
-- Chaque section est idempotente (rejouable sans effet de bord).
--
-- CE QUI MARCHE DÉJÀ SANS CE FICHIER
--   * Le gain d'une animation (appliquer_regle_gain -> attribuer_gain_joueur) est écrit
--     dans `tirages` (joueur_id, event_id, retrait_token, ticket_code).
--   * Profil joueur /moi : lit `tirages` par joueur_id (carrousel « Mes lots »).
--   * Espace pro (Gagnants) et super admin (/dashboard/gagnants) : lisent `tirages`.
--   * Validation en caisse : valider_lot (PIN pro) pose retire_at et déstocke lots_stock.
--
-- CE QUE CE FICHIER AJOUTE
--   1. Durée de validité par lot (lots.validite_jours) et date limite par billet
--      (tirages.valable_jusqu_au), posée à la création du gain.
--   2. « En faire profiter un ami » : tirages.offert_le + RPC offrir_ticket_ami.
--   3. Rappels 1 mois / 15 jours / 48 h : notifications DANS L'APPLICATION d'abord
--      (table joueur_notifications), e-mail UNIQUEMENT en relance (48 h, rappel non vu).
--   4. Planification quotidienne (pg_cron) : rappels in-app + appel de la fonction
--      edge `rappel-tickets` (NON DÉPLOYÉE) pour la relance e-mail.
--
-- Données : aucune valeur inventée. Sans validite_jours, la date limite est la date de
-- fin de l'animation (events.date_f) ou du super event (super_events.date_f).
-- AVANT LA SECTION 6 : remplacer <ANON_KEY> par la clé publishable / anon du projet
-- (jamais la clé service_role).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. COLONNES
-- -----------------------------------------------------------------------------
alter table public.lots    add column if not exists validite_jours integer;        -- durée de validité du lot gagné (jours), saisie par le pro
alter table public.tirages add column if not exists valable_jusqu_au date;          -- date limite d'utilisation du billet
alter table public.tirages add column if not exists offert_le timestamptz;          -- billet offert à un ami (lien partagé)
alter table public.tirages add column if not exists rappel_30j_le timestamptz;      -- rappel in-app 1 mois avant
alter table public.tirages add column if not exists rappel_15j_le timestamptz;      -- rappel in-app 15 jours avant
alter table public.tirages add column if not exists rappel_48h_le timestamptz;      -- rappel in-app 48 h avant
alter table public.tirages add column if not exists relance_email_le timestamptz;   -- relance e-mail (une seule fois)

-- -----------------------------------------------------------------------------
-- 2. DATE LIMITE : calculée à la création du gain, puis rattrapage des billets existants
-- -----------------------------------------------------------------------------
create or replace function public.date_limite_tirage(p_tirage_id bigint)
returns date
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce(
    (select (t.created_at::date + l.validite_jours)
       from lots l where l.id = lot_du_tirage(t.id) and l.validite_jours > 0),
    (select e.date_f::date from events e where e.id = t.event_id),
    (select s.date_f::date from super_events s where s.id = t.super_event_id))
  from tirages t where t.id = p_tirage_id;
$$;

create or replace function public.tirages_pose_validite()
returns trigger
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if new.valable_jusqu_au is null then
    update tirages set valable_jusqu_au = date_limite_tirage(new.id) where id = new.id;
  end if;
  return null;
end $$;

drop trigger if exists trg_tirages_pose_validite on public.tirages;
create trigger trg_tirages_pose_validite after insert on public.tirages
  for each row execute function public.tirages_pose_validite();

-- Rattrapage : billets pas encore utilisés, sans date limite.
update public.tirages t set valable_jusqu_au = public.date_limite_tirage(t.id)
 where t.valable_jusqu_au is null and t.retire_at is null and coalesce(t.statut, '') <> 'annule';

-- -----------------------------------------------------------------------------
-- 3. « EN FAIRE PROFITER UN AMI »
--    Le billet est au porteur : l'ami montre le lien, le commerce valide avec son PIN
--    (valider_lot, déstockage habituel). On note seulement que le billet a été offert.
-- -----------------------------------------------------------------------------
create or replace function public.offrir_ticket_ami(p_token text)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare v_n int;
begin
  update tirages set offert_le = coalesce(offert_le, now())
   where retrait_token = p_token and retire_at is null and coalesce(statut, '') <> 'annule';
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n > 0);
end $$;
revoke all on function public.offrir_ticket_ami(text) from public;
grant execute on function public.offrir_ticket_ami(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. NOTIFICATIONS DANS L'APPLICATION (rappels d'abord in-app)
--    Table fermée (RLS sans policy) : lecture par RPC, lignes du joueur seulement.
-- -----------------------------------------------------------------------------
create table if not exists public.joueur_notifications (
  id          uuid primary key default gen_random_uuid(),
  joueur_id   uuid not null,
  tirage_id   bigint,
  palier      text not null check (palier in ('30j', '15j', '48h')),
  created_at  timestamptz not null default now(),
  vu_le       timestamptz
);
create unique index if not exists joueur_notifications_unique on public.joueur_notifications (tirage_id, palier);
create index if not exists joueur_notifications_joueur_idx on public.joueur_notifications (joueur_id, created_at desc);
alter table public.joueur_notifications enable row level security;
revoke all on public.joueur_notifications from anon, authenticated;

create or replace function public.mes_notifications(p_joueur_id uuid)
returns table (id uuid, tirage_id bigint, palier text, created_at timestamptz, vu_le timestamptz,
               lot_nom text, retrait_token text, valable_jusqu_au date)
language sql stable security definer
set search_path to 'public'
as $$
  select n.id, n.tirage_id, n.palier, n.created_at, n.vu_le, t.lot_nom, t.retrait_token, t.valable_jusqu_au
    from joueur_notifications n join tirages t on t.id = n.tirage_id
   where n.joueur_id = p_joueur_id and t.retire_at is null
   order by n.created_at desc limit 50;
$$;
grant execute on function public.mes_notifications(uuid) to anon, authenticated;

create or replace function public.marquer_notifications_vues(p_joueur_id uuid, p_ids uuid[])
returns void
language sql security definer
set search_path to 'public'
as $$
  update joueur_notifications set vu_le = now()
   where joueur_id = p_joueur_id and id = any(p_ids) and vu_le is null;
$$;
grant execute on function public.marquer_notifications_vues(uuid, uuid[]) to anon, authenticated;

-- Rappels du jour : un par palier et par billet, jamais deux fois. Renvoie le nombre créé.
create or replace function public.tickets_rappels_du_jour()
returns integer
language plpgsql security definer
set search_path to 'public'
as $$
declare v_n int := 0; v_k int;
begin
  -- 48 h
  with c as (
    select id, joueur_id from tirages
     where joueur_id is not null and retire_at is null and coalesce(statut, '') <> 'annule'
       and valable_jusqu_au is not null and rappel_48h_le is null
       and valable_jusqu_au - current_date between 0 and 2
  ), i as (
    insert into joueur_notifications (joueur_id, tirage_id, palier)
    select joueur_id, id, '48h' from c on conflict do nothing returning tirage_id
  ) update tirages set rappel_48h_le = now() where id in (select id from c);
  get diagnostics v_k = row_count; v_n := v_n + v_k;
  -- 15 jours
  with c as (
    select id, joueur_id from tirages
     where joueur_id is not null and retire_at is null and coalesce(statut, '') <> 'annule'
       and valable_jusqu_au is not null and rappel_15j_le is null and rappel_48h_le is null
       and valable_jusqu_au - current_date between 3 and 15
  ), i as (
    insert into joueur_notifications (joueur_id, tirage_id, palier)
    select joueur_id, id, '15j' from c on conflict do nothing returning tirage_id
  ) update tirages set rappel_15j_le = now() where id in (select id from c);
  get diagnostics v_k = row_count; v_n := v_n + v_k;
  -- 1 mois
  with c as (
    select id, joueur_id from tirages
     where joueur_id is not null and retire_at is null and coalesce(statut, '') <> 'annule'
       and valable_jusqu_au is not null and rappel_30j_le is null and rappel_15j_le is null and rappel_48h_le is null
       and valable_jusqu_au - current_date between 16 and 30
  ), i as (
    insert into joueur_notifications (joueur_id, tirage_id, palier)
    select joueur_id, id, '30j' from c on conflict do nothing returning tirage_id
  ) update tirages set rappel_30j_le = now() where id in (select id from c);
  get diagnostics v_k = row_count; v_n := v_n + v_k;
  return v_n;
end $$;
revoke all on function public.tickets_rappels_du_jour() from public, anon, authenticated;

-- Relances e-mail (règle Romain : e-mail UNIQUEMENT en relance) :
-- billet à 48 h, rappel in-app non vu, jamais relancé, e-mail connu.
create or replace function public.tickets_relances_email()
returns table (tirage_id bigint, email text, prenom text, lot_nom text, retrait_token text, valable_jusqu_au date)
language sql stable security definer
set search_path to 'public'
as $$
  select t.id, j.email, j.prenom, t.lot_nom, t.retrait_token, t.valable_jusqu_au
    from tirages t
    join joueurs j on j.id = t.joueur_id
    join joueur_notifications n on n.tirage_id = t.id and n.palier = '48h' and n.vu_le is null
   where t.retire_at is null and t.relance_email_le is null and coalesce(btrim(j.email), '') <> ''
     and t.valable_jusqu_au >= current_date;
$$;
revoke all on function public.tickets_relances_email() from public, anon, authenticated;

create or replace function public.marquer_relance_email(p_tirage_id bigint)
returns void
language sql security definer
set search_path to 'public'
as $$ update tirages set relance_email_le = now() where id = p_tirage_id and relance_email_le is null; $$;
revoke all on function public.marquer_relance_email(bigint) from public, anon, authenticated;
-- (fonctions réservées à service_role : la fonction edge rappel-tickets)

-- -----------------------------------------------------------------------------
-- 5. (À DÉCIDER PAR ROMAIN — laissé en commentaire) refuser un billet expiré en caisse.
--    valider_lot est déjà une chaîne de wrappers (PIN) : ne l'activer qu'après accord.
-- -----------------------------------------------------------------------------
-- -- Dans valider_lot, avant l'appel à _valider_lot_sans_pin :
-- -- if exists (select 1 from tirages where retrait_token = p_token
-- --              and valable_jusqu_au is not null and valable_jusqu_au < current_date) then
-- --   return jsonb_build_object('ok', false, 'raison', 'expire', 'message', 'Billet expiré.');
-- -- end if;

-- -----------------------------------------------------------------------------
-- 6. PLANIFICATION (pg_cron) : tous les jours à 9 h 07 (heure UTC)
-- -----------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'tickets-rappels') then perform cron.unschedule('tickets-rappels'); end if;
  perform cron.schedule('tickets-rappels', '7 9 * * *', $c$
    select public.tickets_rappels_du_jour();
    select net.http_post(
      url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/rappel-tickets',
      headers := '{"Content-Type":"application/json","apikey":"<ANON_KEY>"}'::jsonb,
      body := '{}'::jsonb);
  $c$);
end $$;

notify pgrst, 'reload schema';

-- =============================================================================
-- RETOUR ARRIÈRE (à exécuter À LA MAIN si besoin)
-- =============================================================================
-- select cron.unschedule('tickets-rappels');
-- drop function if exists public.marquer_relance_email(bigint);
-- drop function if exists public.tickets_relances_email();
-- drop function if exists public.tickets_rappels_du_jour();
-- drop function if exists public.marquer_notifications_vues(uuid, uuid[]);
-- drop function if exists public.mes_notifications(uuid);
-- drop table if exists public.joueur_notifications;
-- drop function if exists public.offrir_ticket_ami(text);
-- drop trigger if exists trg_tirages_pose_validite on public.tirages;
-- drop function if exists public.tirages_pose_validite();
-- drop function if exists public.date_limite_tirage(bigint);
-- alter table public.tirages drop column if exists relance_email_le, drop column if exists rappel_48h_le,
--   drop column if exists rappel_15j_le, drop column if exists rappel_30j_le,
--   drop column if exists offert_le, drop column if exists valable_jusqu_au;
-- alter table public.lots drop column if exists validite_jours;
-- notify pgrst, 'reload schema';
