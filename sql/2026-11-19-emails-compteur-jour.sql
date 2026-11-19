-- Compteur journalier des emails envoyés par Gmail SMTP (garde-fou ~500/jour de Gmail).
-- NON APPLIQUÉ. À appliquer une fois (apply_migration) avant le déploiement Gmail.
-- Sans cette table, le module _shared/mailer.ts retombe sur un compteur en mémoire (moins fiable).
create table if not exists public.emails_compteur_jour (
  jour date primary key,
  n integer not null default 0,
  maj timestamptz not null default now()
);
alter table public.emails_compteur_jour enable row level security; -- aucune policy : service_role uniquement

-- Réserve atomiquement p_n envois pour aujourd'hui (Europe/Paris). Renvoie le nouveau total,
-- ou -1 si le plafond p_max serait dépassé (rien n'est réservé).
create or replace function public.emails_reserver(p_n integer, p_max integer)
returns integer language plpgsql security definer set search_path = public as $$
declare v integer; d date := (now() at time zone 'Europe/Paris')::date;
begin
  insert into emails_compteur_jour(jour, n) values (d, 0) on conflict (jour) do nothing;
  update emails_compteur_jour set n = n + p_n, maj = now()
   where jour = d and n + p_n <= p_max returning n into v;
  return coalesce(v, -1);
end $$;
revoke all on function public.emails_reserver(integer, integer) from public, anon, authenticated;
