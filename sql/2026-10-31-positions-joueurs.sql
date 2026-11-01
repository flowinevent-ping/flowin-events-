-- POSITIONS DES JOUEURS « AUTOUR DE MOI » (super event, 31/10/2026)
--
-- A APPLIQUER A LA MAIN (non applique par l'agent). Tant que la table n'existe
-- pas, l'insertion echoue en silence : le tri « autour de moi » fonctionne
-- quand meme, rien n'est enregistre.
--
-- Regles (Romain, 31/10) :
--  - la position n'est demandee QUE sur un bouton explicite (jamais au chargement) ;
--  - elle n'est enregistree QUE si le joueur coche la case de consentement
--    (non cochee par defaut) ;
--  - coordonnees ARRONDIES a 2 decimales (~1 km), une ligne par demande, pas de
--    suivi continu ; liee au super event / a l'animation et, si connu, au joueur.

create table if not exists public.positions_joueurs (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  super_event_id  text not null,
  event_id        text,
  joueur_id       text,
  visiteur_id     text,
  lat             numeric(6,2) not null check (lat between -90 and 90),
  lng             numeric(6,2) not null check (lng between -180 and 180),
  consentement    boolean not null check (consentement = true)
);

comment on table public.positions_joueurs is
  'Position approximative (arrondie ~1 km) partagee volontairement par un joueur depuis la carte du super event. Consentement explicite obligatoire.';

create index if not exists positions_joueurs_se_idx on public.positions_joueurs (super_event_id, created_at desc);

alter table public.positions_joueurs enable row level security;
-- Droits de table explicites (ne pas dependre des droits par defaut du projet) : le joueur (anon)
-- insere seulement ; la lecture est ouverte au role authenticated, puis filtree par la politique SA.
revoke all on public.positions_joueurs from anon, authenticated;
grant insert on public.positions_joueurs to anon, authenticated;
grant select on public.positions_joueurs to authenticated;
grant all on public.positions_joueurs to service_role;

-- Le parcours joueur ecrit avec la cle publique : insertion seule, et seulement
-- avec consentement. Aucune lecture publique (lecture reservee au SA connecte).
drop policy if exists positions_joueurs_insert_public on public.positions_joueurs;
create policy positions_joueurs_insert_public
  on public.positions_joueurs for insert to public
  with check (consentement = true);

-- Lecture : Super Admin uniquement, via est_super_admin() (sql/01-identite-super-admin.sql,
-- a appliquer AVANT). L'ancienne version lisait la table `profiles`, qui n'existe pas en prod :
-- la politique echouait a la creation. Sans 01, aucune lecture n'est ouverte (securise par defaut).
drop policy if exists positions_joueurs_select_sa on public.positions_joueurs;
do $$
begin
  if to_regprocedure('public.est_super_admin()') is not null then
    execute 'create policy positions_joueurs_select_sa on public.positions_joueurs for select to authenticated using (public.est_super_admin())';
  else
    raise notice 'est_super_admin() absente : appliquer sql/01-identite-super-admin.sql puis rejouer ce fichier pour ouvrir la lecture au Super Admin.';
  end if;
end $$;
