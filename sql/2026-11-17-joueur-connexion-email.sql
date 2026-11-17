-- Connexion participant par lien e-mail (decision Romain 17/11/2026).
-- Relie la session Supabase Auth (lien magique) au joueur par l'e-mail VERIFIE de l'utilisateur
-- authentifie (auth.users, jamais un e-mail fourni par le client). Ne cree rien, ne modifie rien.
create or replace function public.moi_joueur_par_session()
returns table(id uuid, prenom text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select j.id, j.prenom
  from auth.users u
  join public.joueurs j on j.email_lower = lower(u.email)
  where u.id = auth.uid()
    and u.email is not null
    and u.email_confirmed_at is not null
  limit 1
$$;

revoke all on function public.moi_joueur_par_session() from public, anon;
grant execute on function public.moi_joueur_par_session() to authenticated;
