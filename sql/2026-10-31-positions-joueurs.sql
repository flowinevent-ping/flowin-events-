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

-- Le parcours joueur ecrit avec la cle publique : insertion seule, et seulement
-- avec consentement. Aucune lecture publique (lecture reservee au SA connecte).
drop policy if exists positions_joueurs_insert_public on public.positions_joueurs;
create policy positions_joueurs_insert_public
  on public.positions_joueurs for insert to public
  with check (consentement = true);

drop policy if exists positions_joueurs_select_sa on public.positions_joueurs;
create policy positions_joueurs_select_sa
  on public.positions_joueurs for select to authenticated
  using ((select role from public.profiles where auth_user_id = auth.uid()) = 'sa');
