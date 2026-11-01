-- =============================================================================
-- sql/08-resultats-tirage.sql — RÉSULTATS DE TIRAGE PAR PARTICIPANT (01/11/2026)
-- Branche feat/jeux-tickets-profil. NON APPLIQUÉ EN BASE : à appliquer à la main
-- (SQL editor), section par section, dans l'ordre. Chaque section est idempotente.
--
-- À QUOI ÇA SERT
--   Chaque commerce fait son tirage QUAND IL VEUT (manuel, ou programmé :
--   events.cfg.tirage, tirage_auto_animations()). À la FIN d'un tirage, on
--   enregistre pour CHAQUE participant son résultat (gagné / pas tiré), pour :
--     - le profil joueur : « Mes tickets » groupés par commerce, avec le statut
--       de chaque tirage séparément ;
--     - l'alerte joueur : pastille + message dans l'application (vu_le), et
--       e-mail « pas tiré » (edge function send-resultat-tirage, non déployée).
--
-- DÉFINITION D'UN « TIRAGE TERMINÉ »
--   events.cfg.tirage.fait_le passe d'absent à une date (posé par
--   tirage_auto_animations() en programmé, ou par le bouton « Terminer le
--   tirage » du pro en manuel). Un trigger enregistre alors les résultats.
--   Si le commerce refait un tirage plus tard (fait_le change), un NOUVEAU
--   tirage est enregistré : les participations postérieures au tirage précédent
--   y sont comptées, les anciennes ne le sont pas deux fois.
--   Super event : enregistrer_resultats_tirage_super() (bouton SA).
--
-- CONFIDENTIALITÉ
--   La table n'a AUCUNE policy : fermée à anon/authenticated (RLS activée, droits
--   retirés). L'application passe par deux fonctions qui ne renvoient QUE les
--   lignes du joueur demandé (son identifiant, non devinable) et jamais d'e-mail.
--   Les politiques de lecture de `joueurs` restent ouvertes en prod : ce fichier
--   n'élargit rien et n'expose aucun e-mail.
--
-- AVANT LA SECTION 4 : remplacer <ANON_KEY> par la clé anon du projet (JWT public,
-- même convention que sql/2026-11-01-tirage-auto-liste-gagnants.sql). Jamais de
-- clé service_role ici.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLE : un résultat par participant et par tirage
-- -----------------------------------------------------------------------------
create table if not exists public.tirage_resultats (
  id              uuid primary key default gen_random_uuid(),
  event_id        text,                       -- animation / commerce (null pour un tirage de super event)
  super_event_id  text,                       -- renseigné pour un tirage de super event
  tirage_ref      text not null,              -- identifiant du tirage (date de fin, ISO)
  joueur_id       uuid not null,
  statut          text not null check (statut in ('gagne', 'perdu')),
  tickets         integer not null default 1, -- tickets que le joueur avait dans ce tirage
  tirage_le       timestamptz not null default now(),
  notifie_le      timestamptz,                -- e-mail de résultat envoyé (une seule fois)
  vu_le           timestamptz,                -- résultat vu dans l'application
  created_at      timestamptz not null default now(),
  check (event_id is not null or super_event_id is not null)
);

create unique index if not exists tirage_resultats_unique
  on public.tirage_resultats (coalesce(event_id, ''), coalesce(super_event_id, ''), tirage_ref, joueur_id);
create index if not exists tirage_resultats_joueur_idx on public.tirage_resultats (joueur_id, tirage_le desc);
create index if not exists tirage_resultats_event_idx on public.tirage_resultats (event_id, tirage_ref);

alter table public.tirage_resultats enable row level security;
-- Aucune policy : lecture/écriture directes impossibles pour anon et authenticated.
revoke all on public.tirage_resultats from anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. ENREGISTRER LES RÉSULTATS D'UN TIRAGE (animation)
--    Participants = joueurs ayant une participation depuis le tirage précédent
--    (comptes de test exclus, mêmes règles que le vivier du tirage) + gagnants.
--    Sans aucun gagnant enregistré (tirages.statut <> 'annule'), rien n'est écrit :
--    on n'invente jamais un résultat. Idempotent (clé unique, on conflict do nothing).
-- -----------------------------------------------------------------------------
create extension if not exists pg_net;

create or replace function public.enregistrer_resultats_tirage(p_event_id text, p_ref text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  v_ref text;
  v_prec timestamptz;
  v_n integer := 0;
begin
  select ev.id, ev.cfg into e from events ev where ev.id = p_event_id;
  if not found then return 0; end if;

  v_ref := coalesce(nullif(btrim(p_ref), ''), nullif(e.cfg -> 'tirage' ->> 'fait_le', ''),
                    to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));

  select max(tr.tirage_le) into v_prec
    from tirage_resultats tr where tr.event_id = p_event_id and tr.tirage_ref <> v_ref;

  with gagnants as (
    select distinct tg.joueur_id
      from tirages tg
     where tg.event_id = p_event_id and tg.joueur_id is not null
       and coalesce(tg.statut, '') <> 'annule'
       and (v_prec is null or tg.created_at > v_prec)
  ), participants as (
    select pa.joueur_id, greatest(sum(coalesce(pa.tickets, 1)), 1)::integer as tickets
      from participations pa
      join joueurs j on j.id = pa.joueur_id
     where pa.event_id = p_event_id and pa.joueur_id is not null
       and (v_prec is null or pa.created_at > v_prec)
       and lower(btrim(coalesce(j.prenom, '') || ' ' || coalesce(j.nom, ''))) not like '%collin%'
       and lower(btrim(coalesce(j.prenom, '') || ' ' || coalesce(j.nom, ''))) <> 'lucie giordano'
     group by pa.joueur_id
  ), tous as (
    select g.joueur_id, coalesce(p.tickets, 1) as tickets, 'gagne'::text as statut
      from gagnants g left join participants p on p.joueur_id = g.joueur_id
    union all
    select p.joueur_id, p.tickets, 'perdu'
      from participants p where not exists (select 1 from gagnants g where g.joueur_id = p.joueur_id)
  ), ins as (
    insert into tirage_resultats (event_id, tirage_ref, joueur_id, statut, tickets)
    select p_event_id, v_ref, t.joueur_id, t.statut, t.tickets
      from tous t
     where exists (select 1 from gagnants)          -- jamais de résultat sans tirage réel
    on conflict do nothing
    returning 1
  )
  select count(*) into v_n from ins;

  if v_n > 0 then
    perform public._notifier_resultats_tirage(p_event_id, null, v_ref, e.cfg);
  end if;
  return v_n;
end;
$$;

-- Même chose pour un tirage de super event (tirage_super_event(), bouton SA).
create or replace function public.enregistrer_resultats_tirage_super(p_super_event_id text, p_ref text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_prec timestamptz;
  v_n integer := 0;
begin
  if not exists (select 1 from super_events s where s.id = p_super_event_id) then return 0; end if;
  v_ref := coalesce(nullif(btrim(p_ref), ''), to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  select max(tr.tirage_le) into v_prec
    from tirage_resultats tr where tr.super_event_id = p_super_event_id and tr.tirage_ref <> v_ref;

  with gagnants as (
    select distinct tg.joueur_id from tirages tg
     where tg.super_event_id = p_super_event_id and tg.joueur_id is not null
       and coalesce(tg.statut, '') <> 'annule' and (v_prec is null or tg.created_at > v_prec)
  ), participants as (
    select pa.joueur_id, greatest(sum(coalesce(pa.tickets, 1)), 1)::integer as tickets
      from participations pa
      join events ev on ev.id = pa.event_id and ev.super_event_id = p_super_event_id
      join joueurs j on j.id = pa.joueur_id
     where pa.joueur_id is not null and (v_prec is null or pa.created_at > v_prec)
       and lower(btrim(coalesce(j.prenom, '') || ' ' || coalesce(j.nom, ''))) not like '%collin%'
       and lower(btrim(coalesce(j.prenom, '') || ' ' || coalesce(j.nom, ''))) <> 'lucie giordano'
     group by pa.joueur_id
  ), tous as (
    select g.joueur_id, coalesce(p.tickets, 1) as tickets, 'gagne'::text as statut
      from gagnants g left join participants p on p.joueur_id = g.joueur_id
    union all
    select p.joueur_id, p.tickets, 'perdu'
      from participants p where not exists (select 1 from gagnants g where g.joueur_id = p.joueur_id)
  ), ins as (
    insert into tirage_resultats (super_event_id, tirage_ref, joueur_id, statut, tickets)
    select p_super_event_id, v_ref, t.joueur_id, t.statut, t.tickets
      from tous t where exists (select 1 from gagnants)
    on conflict do nothing
    returning 1
  )
  select count(*) into v_n from ins;

  if v_n > 0 then
    perform public._notifier_resultats_tirage(null, p_super_event_id, v_ref, '{}'::jsonb);
  end if;
  return v_n;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3. TRIGGER : fin de tirage = cfg.tirage.fait_le posé ou modifié
--    (tirage_auto_animations() le pose déjà ; le pro le pose en manuel via
--    « Terminer le tirage »). Aucune modification de tirage_auto_animations().
-- -----------------------------------------------------------------------------
create or replace function public.trg_resultats_apres_tirage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enregistrer_resultats_tirage(new.id, new.cfg -> 'tirage' ->> 'fait_le');
  return new;
exception when others then
  -- Un souci ici ne doit JAMAIS empêcher d'enregistrer le tirage lui-même.
  raise warning 'resultats tirage: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists events_resultats_apres_tirage on public.events;
create trigger events_resultats_apres_tirage
  after update of cfg on public.events
  for each row
  when (nullif(new.cfg -> 'tirage' ->> 'fait_le', '') is not null
        and (new.cfg -> 'tirage' ->> 'fait_le') is distinct from (old.cfg -> 'tirage' ->> 'fait_le'))
  execute function public.trg_resultats_apres_tirage();


-- -----------------------------------------------------------------------------
-- 4. ALERTE E-MAIL « PAS TIRÉ » : appel de l'edge function send-resultat-tirage
--    (NON DÉPLOYÉE). Réglage du commerce : events.cfg.tirage.notifierPerdants
--    (défaut oui ; false = éteint). L'envoi est idempotent : la fonction réserve
--    chaque ligne (notifie_le) avant d'écrire, une seule fois par participant et
--    par tirage. Sans pg_net ou sans la fonction déployée : aucun effet, rien ne casse.
-- -----------------------------------------------------------------------------
create or replace function public._notifier_resultats_tirage(p_event_id text, p_super_event_id text, p_ref text, p_cfg jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_cfg -> 'tirage' ->> 'notifierPerdants', 'true') = 'false' then return; end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then return; end if;
  begin
    perform net.http_post(
      url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/send-resultat-tirage',
      body := jsonb_build_object('event_id', p_event_id, 'super_event_id', p_super_event_id, 'tirage_ref', p_ref),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <ANON_KEY>'),
      timeout_milliseconds := 5000
    );
  exception when others then
    raise warning 'notifier resultats tirage: %', sqlerrm;
  end;
end;
$$;
revoke all on function public._notifier_resultats_tirage(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.enregistrer_resultats_tirage(text, text) from public, anon, authenticated;
revoke all on function public.trg_resultats_apres_tirage() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 5. LECTURE PAR LE JOUEUR (profil) : uniquement SES lignes, jamais d'e-mail
-- -----------------------------------------------------------------------------
create or replace function public.mes_resultats_tirage(p_joueur_id uuid)
returns table (
  id uuid, event_id text, super_event_id text, commerce_nom text, super_event_nom text,
  tirage_ref text, tirage_le timestamptz, statut text, tickets integer, vu_le timestamptz,
  lot_nom text, retrait_token text
)
language sql
stable
security definer
set search_path = public
as $$
  select tr.id, tr.event_id, tr.super_event_id,
         coalesce(nullif(btrim(ev.cfg -> 'front' ->> 'titre'), ''), ev.nom, pr.nom) as commerce_nom,
         se.nom as super_event_nom,
         tr.tirage_ref, tr.tirage_le, tr.statut, tr.tickets, tr.vu_le,
         g.lot_nom, g.retrait_token
    from tirage_resultats tr
    left join events ev on ev.id = tr.event_id
    left join pros pr on pr.id = ev.pro_id
    left join super_events se on se.id = coalesce(tr.super_event_id, ev.super_event_id)
    left join lateral (
      select tg.lot_nom, tg.retrait_token
        from tirages tg
       where tr.statut = 'gagne' and tg.joueur_id = tr.joueur_id
         and coalesce(tg.statut, '') <> 'annule'
         and ((tr.event_id is not null and tg.event_id = tr.event_id)
              or (tr.super_event_id is not null and tg.super_event_id = tr.super_event_id))
       order by tg.created_at desc limit 1
    ) g on true
   where tr.joueur_id = p_joueur_id
   order by tr.tirage_le desc
   limit 200;
$$;

create or replace function public.marquer_resultats_vus(p_joueur_id uuid, p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_n integer;
begin
  update tirage_resultats set vu_le = now()
   where joueur_id = p_joueur_id and id = any(p_ids) and vu_le is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

grant execute on function public.mes_resultats_tirage(uuid) to anon, authenticated;
grant execute on function public.marquer_resultats_vus(uuid, uuid[]) to anon, authenticated;
-- Tirage de super event : lancé par le Super Admin (bouton « Terminer le tirage » de la fiche).
grant execute on function public.enregistrer_resultats_tirage_super(text, text) to anon, authenticated;
