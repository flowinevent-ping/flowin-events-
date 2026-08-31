-- Lot 7 de la reorganisation dashboard (31/08/2026) : modeles d event reutilisables.
-- Applique en prod via Supabase MCP, repris ici pour que le schema reste dans le repo.
--
-- Un modele fige ce qui est reutilisable d un event (module, contenu du jeu,
-- lots types, visibilite pro) SANS aucune donnee d edition : ni participants,
-- ni gagnants, ni dates, ni pro client. Creer un event depuis un modele
-- pre-remplit le wizard, il ne cree rien tout seul.
create table if not exists public.event_modeles (
  id           text primary key,
  nom          text not null,
  description  text,
  module       text not null,
  cfg          jsonb not null default '{}'::jsonb,   -- memes cles que events.cfg
  lots         jsonb not null default '[]'::jsonb,   -- [{nom,type,quantite,valeur,conditions}]
  pro_visib    jsonb not null default '{}'::jsonb,
  couleur      text,
  score_min    integer not null default 0,
  origine_event_id text,
  created_at   timestamptz not null default now()
);

comment on table public.event_modeles is
  'Modeles d event reutilisables (lot 7 reorga dashboard 08/2026). Aucune donnee d edition : structure seulement.';

alter table public.event_modeles enable row level security;

-- IMPORTANT : ce projet n a PAS de session Supabase Auth, tout tourne sur la
-- cle anon. Une policy restreinte a `authenticated` casserait la prod
-- silencieusement (regression vecue le 31/08 sur 2 RPC). Role public, comme
-- toutes les autres tables du projet (cf. flowin_anon_all_events).
drop policy if exists flowin_anon_all_event_modeles on public.event_modeles;
create policy flowin_anon_all_event_modeles
  on public.event_modeles for all to public
  using (true) with check (true);

create index if not exists event_modeles_module_idx on public.event_modeles (module);
