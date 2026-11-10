-- =============================================================================
-- 2026-11-10 · Super admin : carte du réseau, carte publique des commerces,
--              relance des lots (pro), gestion des QR (renommer / archiver).
-- Appliqué via Supabase MCP (apply_migration) sur ywcqtupgoxfzkddqkztk.
-- Idempotent. Aucune donnée inventée, aucune donnée personnelle exposée.
-- =============================================================================

-- 1. Relance des lots : palier 'relance' dans joueur_notifications.
--    Le CHECK est recréé avec TOUTES les valeurs connues ('30j','15j','48h' du
--    rappel automatique, 'cadeau' d'un autre chantier, 'relance' ici).
alter table public.joueur_notifications drop constraint if exists joueur_notifications_palier_check;
alter table public.joueur_notifications add constraint joueur_notifications_palier_check
  check (palier in ('30j', '15j', '48h', 'cadeau', 'relance'));

-- Relance in-app des gagnants qui n'ont pas utilisé leur lot.
-- Appelant : super admin, ou pro propriétaire du lot (commerce partenaire ou animation).
-- Une relance répétée remet la notification « non vue » (index unique tirage_id, palier).
create or replace function public.pro_relancer_lots(p_tirage_ids bigint[])
returns integer
language plpgsql security definer
set search_path to 'public'
as $$
declare n integer;
begin
  with ok as (
    select t.id, t.joueur_id
      from tirages t
     where t.id = any(p_tirage_ids)
       and t.retire_at is null
       and coalesce(t.statut, '') <> 'annule'
       and t.joueur_id is not null
       and (
         est_super_admin()
         or t.partenaire_id in (select p.partenaire_id from pros p where p.auth_id = auth.uid() and p.partenaire_id is not null)
         or t.event_id in (select e.id from events e join pros p on p.id = e.pro_id where p.auth_id = auth.uid())
       )
  ), ins as (
    insert into joueur_notifications (joueur_id, tirage_id, palier)
    select joueur_id, id, 'relance' from ok
    on conflict (tirage_id, palier) do update set created_at = now(), vu_le = null
    returning tirage_id
  )
  update tirages set relance_envoyee_at = now() where id in (select tirage_id from ins);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.pro_relancer_lots(bigint[]) from public, anon;
grant execute on function public.pro_relancer_lots(bigint[]) to authenticated;

-- 2. QR : archivage (le QR reste valable au scan, il disparaît des listes).
alter table public.qr_stations add column if not exists archive_le timestamptz;

-- 3. Carte du réseau (super admin) : un point par commerce (pro, sinon station).
create or replace function public.carte_reseau_sa()
returns table (cle text, nom text, adresse text, lat double precision, lng double precision,
               logo text, type text, jeux text[], nb_animations integer, nb_super_events integer,
               actif boolean, pro_id text)
language sql stable security definer
set search_path to 'public'
as $$
  with s as (
    select coalesce(e.pro_id, e.id) cle, e.*, p.nom_commercial, p.nom pro_nom
      from events e left join pros p on p.id = e.pro_id
     where est_super_admin() and e.lat is not null and e.lng is not null
  )
  select cle,
         coalesce(max(nullif(nom_commercial, '')), max(nullif(pro_nom, '')), max(nullif(lieu, '')), max(nullif(nom, ''))),
         max(nullif(adresse, '')), avg(lat), avg(lng), max(nullif(photo_url, '')),
         case when bool_or(super_event_id is null) and bool_or(super_event_id is not null) then 'les_deux'
              when bool_or(super_event_id is not null) then 'super_event' else 'animation' end,
         array_remove(array_agg(distinct module), null),
         count(*) filter (where super_event_id is null)::int,
         count(distinct super_event_id)::int,
         bool_or(status in ('live', 'upcoming')),
         max(pro_id)
    from s group by cle;
$$;
revoke all on function public.carte_reseau_sa() from public, anon;
grant execute on function public.carte_reseau_sa() to authenticated;

-- 4. Carte publique des commerces (sans login) : animations actives uniquement.
--    Données publiques seulement : nom, adresse, GPS, logo, type de jeu.
create or replace function public.carte_commerces_publique()
returns table (cle text, nom text, adresse text, lat double precision, lng double precision,
               logo text, type text, jeux text[])
language sql stable security definer
set search_path to 'public'
as $$
  with s as (
    select coalesce(e.pro_id, e.id) cle, e.*, p.nom_commercial, p.nom pro_nom
      from events e left join pros p on p.id = e.pro_id
     where e.lat is not null and e.lng is not null
       and e.status in ('live', 'upcoming')
       and (e.date_f is null or e.date_f >= current_date)
  )
  select md5(cle),
         coalesce(max(nullif(nom_commercial, '')), max(nullif(pro_nom, '')), max(nullif(lieu, '')), max(nullif(nom, ''))),
         max(nullif(adresse, '')), avg(lat), avg(lng), max(nullif(photo_url, '')),
         case when bool_or(super_event_id is null) and bool_or(super_event_id is not null) then 'les_deux'
              when bool_or(super_event_id is not null) then 'super_event' else 'animation' end,
         array_remove(array_agg(distinct module), null)
    from s group by cle;
$$;
grant execute on function public.carte_commerces_publique() to anon, authenticated;
