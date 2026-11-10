-- APPLIQUÉ en production le 10/11/2026 (migrations qr_stations_colonnes_2026_11_10 + qr_stations_origine_acces_2026_11_10, version sans DROP). Vérifié : QR super admin (cree_par sa), QR pro (cree_par pro, visible par le pro, refus sur l'animation d'un autre), liens /q/<code> -> 302 vers le jeu avec la source.
-- QR codes : à coller dans Supabase > SQL Editor, puis cliquer « Run ». Sans risque, rejouable.
alter table public.qr_stations add column if not exists support text;
alter table public.qr_stations add column if not exists type_qr text;
alter table public.qr_stations add column if not exists cree_par text;

create or replace function public.qr_code_aleatoire()
returns text language plpgsql volatile as $$
declare c text;
begin
  loop
    c := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    exit when not exists (select 1 from public.qr_stations q where q.code_court = c);
  end loop;
  return c;
end $$;
alter table public.qr_stations add column if not exists code_court text;
update public.qr_stations set code_court = public.qr_code_aleatoire() where code_court is null;
alter table public.qr_stations alter column code_court set default public.qr_code_aleatoire();
alter table public.qr_stations alter column code_court set not null;
create unique index if not exists uniq_qr_stations_code_court on public.qr_stations (code_court);
create unique index if not exists uniq_qr_stations_event_source on public.qr_stations (event_id, source_qr);

create or replace function public.qr_stations_origine()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.cree_par := case when public.est_super_admin() then 'sa' else 'pro' end;
  return new;
end $$;
drop trigger if exists trg_qr_stations_origine on public.qr_stations;
create trigger trg_qr_stations_origine before insert on public.qr_stations
  for each row execute function public.qr_stations_origine();

create or replace function public.qr_est_proprietaire(p_event text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.events e join public.pros p on p.id = e.pro_id where e.id = p_event and p.auth_id = auth.uid());
$$;
grant execute on function public.qr_est_proprietaire(text) to anon, authenticated, service_role;

drop policy if exists qr_stations_auth_gestion on public.qr_stations;
create policy qr_stations_auth_gestion on public.qr_stations for all to authenticated
  using (public.est_super_admin() or public.qr_est_proprietaire(event_id))
  with check (public.est_super_admin() or public.qr_est_proprietaire(event_id));
drop policy if exists qr_stations_lecture_publies on public.qr_stations;
create policy qr_stations_lecture_publies on public.qr_stations for select to authenticated using (publie);
grant select, insert, update, delete on public.qr_stations to authenticated;

create or replace function public.qr_assurer_defauts(p_event_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.events e where e.id = p_event_id) then return; end if;
  insert into public.qr_stations (event_id, nom, source_qr, publie, support, type_qr) values
    (p_event_id, 'En magasin', 'magasin', true, 'Entrée / vitrine', 'physique'),
    (p_event_id, 'Réseaux sociaux', 'reseaux-instagram', true, 'Instagram', 'digital'),
    (p_event_id, 'Tracking', 'tracking', true, 'Support publicitaire', 'physique')
  on conflict (event_id, source_qr) do nothing;
end $$;
grant execute on function public.qr_assurer_defauts(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
