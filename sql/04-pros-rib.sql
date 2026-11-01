-- ============================================================================
-- 04 — PROS_RIB : coordonnées bancaires du pro (31/10/2026)
-- ============================================================================
-- PREREQUIS : 01-identite-super-admin.sql (est_super_admin) et la table public.pros.
-- A APPLIQUER A LA MAIN. Rejouable sans dommage.
--
-- A QUOI ELLES SERVENT : rembourser le pro (garantie « Flowin vous rembourse
-- la différence ») et lui faire des virements. JAMAIS pour le prélèvement de
-- l'abonnement : le mandat SEPA est géré par GoCardless, Flowin ne collecte
-- pas d'IBAN pour cela.
--
-- SECURITE :
--   * table dédiée, jamais dans un jsonb public ;
--   * RLS active, AUCUN accès anon ;
--   * le pro propriétaire (pros.auth_id = auth.uid()) lit / écrit SA ligne ;
--     il ne relit JAMAIS l'IBAN complet : la colonne `iban` n'est pas lisible
--     par le rôle authenticated (droits par colonne), seul `iban_masque` l'est ;
--   * le Super Admin (compte inscrit dans flowin_super_admins, voir 01) lit tout, via la
--     politique SA et la fonction rib_pro_complet().
--
-- Tant que ce fichier n'est pas appliqué, l'onglet « Coordonnées bancaires »
-- du profil pro affiche un message « bientôt disponible » et n'enregistre rien.
-- ============================================================================

-- 1. Identite du Super Admin : table flowin_super_admins et fonction est_super_admin() viennent de
--    01-identite-super-admin.sql (une seule definition, pas de copie ici).

-- 2. La table
create table if not exists public.pros_rib (
  pro_id       text primary key references public.pros(id) on delete cascade,
  titulaire    text not null,
  iban         text not null,                -- compact, majuscules, sans espace
  iban_masque  text not null,                -- « FR76 •••• •••• 345 »
  bic          text not null,
  usage        text not null default 'remboursements_virements'
               check (usage = 'remboursements_virements'),
  updated_at   timestamptz not null default now(),
  updated_by   uuid default auth.uid(),
  constraint pros_rib_iban_format check (iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$'),
  constraint pros_rib_bic_format  check (bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$')
);

-- Controle modulo 97 en base aussi (le navigateur le fait deja ; ceinture et bretelles).
create or replace function public.iban_mod97_ok(p text)
returns boolean language plpgsql immutable as $$
declare r text; reste int := 0; c text; v text; i int; j int;
begin
  if p is null or p !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$' then return false; end if;
  r := substr(p, 5) || substr(p, 1, 4);
  for i in 1..length(r) loop
    c := substr(r, i, 1);
    if c ~ '[A-Z]' then v := (ascii(c) - 55)::text; else v := c; end if;
    for j in 1..length(v) loop
      reste := (reste * 10 + substr(v, j, 1)::int) % 97;
    end loop;
  end loop;
  return reste = 1;
end $$;

alter table public.pros_rib drop constraint if exists pros_rib_iban_mod97;
alter table public.pros_rib add constraint pros_rib_iban_mod97 check (public.iban_mod97_ok(iban));

-- 3. RLS
alter table public.pros_rib enable row level security;
revoke all on public.pros_rib from anon;
revoke all on public.pros_rib from authenticated;

-- Le pro : lecture des colonnes NON sensibles uniquement, ecriture complete.
grant select (pro_id, titulaire, iban_masque, bic, usage, updated_at) on public.pros_rib to authenticated;
grant insert (pro_id, titulaire, iban, iban_masque, bic, usage) on public.pros_rib to authenticated;
grant update (titulaire, iban, iban_masque, bic, usage, updated_at, updated_by) on public.pros_rib to authenticated;
grant delete on public.pros_rib to authenticated;

drop policy if exists pros_rib_proprietaire on public.pros_rib;
create policy pros_rib_proprietaire on public.pros_rib
  for all to authenticated
  using (exists (select 1 from public.pros p where p.id = pros_rib.pro_id and p.auth_id = auth.uid()))
  with check (exists (select 1 from public.pros p where p.id = pros_rib.pro_id and p.auth_id = auth.uid()));

drop policy if exists pros_rib_super_admin on public.pros_rib;
create policy pros_rib_super_admin on public.pros_rib
  for all to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

-- 4. Lecture complete reservee au SA (l'IBAN entier n'est lisible que par cette fonction).
create or replace function public.rib_pro_complet(p_pro text)
returns table(pro_id text, titulaire text, iban text, bic text, updated_at timestamptz)
language sql stable security definer
set search_path to 'public'
as $$
  select r.pro_id, r.titulaire, r.iban, r.bic, r.updated_at
    from public.pros_rib r
   where r.pro_id = p_pro and public.est_super_admin()
$$;
revoke all on function public.rib_pro_complet(text) from public, anon;
grant execute on function public.rib_pro_complet(text) to authenticated;

-- 5. Horodatage
create or replace function public.pros_rib_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists pros_rib_touch on public.pros_rib;
create trigger pros_rib_touch before insert or update on public.pros_rib
  for each row execute function public.pros_rib_touch();
