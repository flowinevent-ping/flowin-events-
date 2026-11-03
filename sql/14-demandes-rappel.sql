-- 14 — Demandes de rappel (formulaire « Demander un rappel » des plaquettes)
-- NON APPLIQUÉ. À appliquer avec apply_migration (projet ywcqtupgoxfzkddqkztk) AVANT de fusionner la PR
-- qui change les plaquettes : sans cette table, le formulaire échouerait.
-- Rejouable sans dommage. Prérequis : 01 (est_super_admin) et la table public.pros.
--
-- Avant : le formulaire n'envoyait qu'un email (fonction edge notify-rappel, non déployée) : rien n'était
-- conservé, un message pouvait se perdre. Maintenant : la demande est D'ABORD enregistrée en base (jamais
-- perdue), rattachée à la fiche pro si l'email correspond, visible dans le dashboard avec alerte « nouvelle ».
-- L'email reste un doublon de confort (envoyé après, sans bloquer).

create table if not exists public.demandes_rappel (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  statut      text not null default 'nouvelle' check (statut in ('nouvelle','traitee')),
  prenom      text not null check (char_length(prenom) between 2 and 80),
  nom         text not null check (char_length(nom) between 2 and 80),
  entreprise  text not null check (char_length(entreprise) between 2 and 160),
  ville       text not null check (char_length(ville) between 2 and 120),
  tel         text not null check (char_length(tel) <= 40),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  creneau     text check (char_length(creneau) <= 60),
  message     text check (char_length(message) <= 1000),
  origine     text check (char_length(origine) <= 60),
  commercial  text check (char_length(commercial) <= 60),
  pro_id      text references public.pros(id) on delete set null,
  traitee_at  timestamptz,
  traitee_par text,
  note_interne text
);
create index if not exists demandes_rappel_statut_idx on public.demandes_rappel (statut, created_at desc);
create index if not exists demandes_rappel_pro_idx on public.demandes_rappel (pro_id) where pro_id is not null;

alter table public.demandes_rappel enable row level security;
revoke all on public.demandes_rappel from anon, authenticated;
grant select, update on public.demandes_rappel to authenticated;
grant all on public.demandes_rappel to service_role;

drop policy if exists demandes_rappel_lecture on public.demandes_rappel;
create policy demandes_rappel_lecture on public.demandes_rappel for select to authenticated
  using (public.est_super_admin()
         or exists (select 1 from public.pros p where p.id = demandes_rappel.pro_id and p.auth_id = auth.uid()));
drop policy if exists demandes_rappel_maj on public.demandes_rappel;
create policy demandes_rappel_maj on public.demandes_rappel for update to authenticated
  using (public.est_super_admin()) with check (public.est_super_admin());

-- Dépôt public : seule porte d'entrée. Validation en base, champ piège, anti-doublon (même email + même
-- message dans les 2 minutes), rattachement à la fiche pro par email (jamais par SIRET ni par nom).
create or replace function public.deposer_demande_rappel(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prenom text := left(btrim(coalesce(p->>'prenom','')), 80);
  v_nom text := left(btrim(coalesce(p->>'nom','')), 80);
  v_ent text := left(btrim(coalesce(p->>'entreprise','')), 160);
  v_ville text := left(btrim(coalesce(p->>'ville','')), 120);
  v_tel text := left(btrim(coalesce(p->>'tel','')), 40);
  v_email text := left(btrim(coalesce(p->>'email','')), 200);
  v_msg text := left(btrim(coalesce(p->>'message','')), 1000);
  v_id uuid; v_pro text;
begin
  if btrim(coalesce(p->>'site_web','')) <> '' then return jsonb_build_object('ok', true); end if;   -- champ piège : on fait semblant
  if length(v_prenom) < 2 or length(v_nom) < 2 or length(v_ent) < 2 or length(v_ville) < 2
     or length(regexp_replace(v_tel, '[^0-9+]', '', 'g')) < 8
     or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or (p->>'consentement') is distinct from 'true' then
    return jsonb_build_object('ok', false, 'erreur', 'champs invalides');
  end if;
  select id into v_id from public.demandes_rappel
   where lower(email) = lower(v_email) and coalesce(message,'') = v_msg and created_at > now() - interval '2 minutes' limit 1;
  if v_id is not null then return jsonb_build_object('ok', true, 'id', v_id); end if;
  select id into v_pro from public.pros where lower(email) = lower(v_email) order by id limit 1;
  insert into public.demandes_rappel (prenom, nom, entreprise, ville, tel, email, creneau, message, origine, commercial, pro_id)
  values (v_prenom, v_nom, v_ent, v_ville, v_tel, v_email, left(btrim(coalesce(p->>'creneau','')), 60), nullif(v_msg,''),
          left(btrim(coalesce(p->>'origine','')), 60), left(btrim(coalesce(p->>'commercial','')), 60), v_pro)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;
revoke all on function public.deposer_demande_rappel(jsonb) from public;
grant execute on function public.deposer_demande_rappel(jsonb) to anon, authenticated, service_role;

-- Vérifications : select count(*) from public.demandes_rappel;
--   select public.deposer_demande_rappel('{"prenom":"Test","nom":"Test","entreprise":"Test SARL","ville":"Vence","tel":"0600000000","email":"test@example.com","consentement":"true"}'::jsonb);
--   (puis supprimer la ligne de test)
