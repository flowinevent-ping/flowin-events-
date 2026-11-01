-- SUPPLEMENT DE TEST (base locale JETABLE seulement, jamais applique en prod).
-- Tables et types qui existent en production, que le code lit, mais dont le DDL n'est PAS dans sql/.
-- Colonnes reduites au strict necessaire pour que les fichiers 01 a 10 s'executent ; deduites du code.

-- Les vues du schema consolide qui lisent joueurs.id / participations.joueur_id sont retirees (le test n'en depend pas).
do $$ declare v record; begin
  for v in select distinct c.relname from pg_depend d join pg_rewrite r on r.oid = d.objid join pg_class c on c.oid = r.ev_class
            where d.refobjid in ('public.joueurs'::regclass, 'public.participations'::regclass, 'public.votes'::regclass) and c.relkind = 'v' loop
    execute format('drop view if exists public.%I cascade', v.relname);
  end loop;
end $$;

-- En prod joueurs.id est un uuid (les fonctions du depot le supposent) ; le schema consolide du depot le met en text.
alter table public.joueurs alter column id drop default;
alter table public.joueurs alter column id type uuid using (case when id ~* '^[0-9a-f-]{36}$' then id::uuid else gen_random_uuid() end);
alter table public.joueurs alter column id set default gen_random_uuid();
alter table public.participations alter column joueur_id type uuid using (case when joueur_id ~* '^[0-9a-f-]{36}$' then joueur_id::uuid else null end);
alter table public.votes alter column joueur_id type uuid using (case when joueur_id ~* '^[0-9a-f-]{36}$' then joueur_id::uuid else null end);

-- Colonnes de joueurs lues par crm_pro / les tirages (existent en prod).
alter table public.joueurs add column if not exists optin boolean;
alter table public.joueurs add column if not exists first_seen timestamptz default now();
alter table public.joueurs add column if not exists tranche_age text;
alter table public.joueurs add column if not exists source text;
alter table public.joueurs add column if not exists external_id text;
alter table public.joueurs add column if not exists email_lower text generated always as (lower(email)) stored;

create table if not exists public.tirages (
  id uuid primary key default gen_random_uuid(),
  event_id text, super_event_id text, partenaire_id text,
  joueur_id uuid, joueur_nom text, joueur_email text,
  lot_nom text, statut text default 'gagne', tickets integer default 1,
  ticket_code text, retrait_token text,
  type text, created_at timestamptz not null default now()
);

create table if not exists public.demandes_rattachement_super_event (
  id uuid primary key default gen_random_uuid(),
  pro_id text, super_event_id text not null, event_id text,
  statut text not null default 'en_attente', note_sa text,
  lat double precision, lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.se_tickets (
  id uuid primary key default gen_random_uuid(),
  super_event_id text, joueur_id uuid, event_id text, jour date, type text,
  created_at timestamptz not null default now()
);

-- pg_net / pg_cron n'existent pas en local : seul le nom net.http_post est simule (le test ne l'appelle pas).
create schema if not exists net;
create or replace function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb, timeout_milliseconds integer default 5000)
returns bigint language sql as $$ select 0::bigint $$;

alter table public.joueurs add column if not exists sexe text;
alter table public.participations add column if not exists source text;

-- pg_cron : simulation minimale (schema cron, table job, fonctions schedule / unschedule).
create schema if not exists cron;
create table if not exists cron.job (jobid bigserial primary key, jobname text, schedule text, command text);
create or replace function cron.schedule(p_nom text, p_cron text, p_cmd text) returns bigint language sql as
  $$ insert into cron.job (jobname, schedule, command) values (p_nom, p_cron, p_cmd) returning jobid $$;
create or replace function cron.unschedule(p_id bigint) returns boolean language sql as
  $$ delete from cron.job where jobid = p_id returning true $$;

-- pros.statut existe en prod (ecrit par lib/proCreation.ts : 'en_attente' / 'valide'), absent du DDL du depot.
alter table public.pros add column if not exists statut text default 'valide';
-- auth.jwt() (Supabase) : lit les claims poses par le test.
create or replace function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

-- Colonnes lues / ecrites par le code (lib/banques.ts, lib/nds.ts) et par les verrous de 06 (new.pro_id), absentes du schema du depot.
alter table public.banques add column if not exists pro_id text;
alter table public.banques add column if not exists tags text[] default '{}';
alter table public.banques add column if not exists event_ids text[] default '{}';
alter table public.banques add column if not exists statut text default 'brouillon';
alter table public.super_events add column if not exists pro_id text;
alter table public.super_events add column if not exists status text default 'upcoming';
alter table public.super_events add column if not exists geofence_m integer;
alter table public.super_events add column if not exists tirage_global boolean default false;
alter table public.super_events add column if not exists logo_url text;
alter table public.super_events add column if not exists module text;
alter table public.super_events add column if not exists cfg_jeu jsonb default '{}'::jsonb;

-- Colonnes de lots lues par l'espace pro (titre, valeur_euros, conditions, emoji, description) : presentes en prod.
alter table public.lots add column if not exists titre text;
alter table public.lots add column if not exists valeur_euros numeric;
alter table public.lots add column if not exists conditions text;
alter table public.lots add column if not exists emoji text;
alter table public.lots add column if not exists description text;

-- operation_stats.sql / operation_reponses.sql (deja en prod) : colonne fuseau des super events, table se_reponses.
alter table public.super_events add column if not exists fuseau text;
alter table public.super_events add column if not exists bascule_h integer;
create table if not exists public.se_reponses (
  id uuid primary key default gen_random_uuid(),
  event_id text, super_event_id text, joueur_id uuid, score numeric,
  quiz_reponses jsonb, bonus_reponses jsonb, ts timestamptz default now()
);
alter table public.se_reponses enable row level security;
create policy test_permissif on public.se_reponses for all to anon, authenticated using (true) with check (true);

-- En prod l'espace pro et le dashboard lisent avec la cle publique : les tables de base (super_events, banques, partenaires,
-- tirages...) ont une politique permissive ; le schema du depot les laisse en RLS sans politique. On reproduit le regime de prod.
-- (Ne s'applique qu'aux tables deja presentes a ce stade ; les tables des fichiers 01 a 10 gardent leurs propres politiques.)
do $$ declare t record; begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
              and not exists (select 1 from pg_policy p where p.polrelid = c.oid) loop
    execute format('create policy test_permissif on public.%I for all to anon, authenticated using (true) with check (true)', t.relname);
  end loop;
end $$;
