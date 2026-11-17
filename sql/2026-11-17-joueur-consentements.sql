-- Profil participant (/moi, audit 17/11/2026) : consentements visibles et modifiables.
-- APPLIQUÉ en prod le 17/11/2026 via MCP (migration joueur_consentements_profil_2026_11_17).
-- Flowin Event = joueurs.optin ; chaque commerce = clients_commerce.optin. pro_id null = Flowin Event.
create or replace function public.mes_consentements(p_joueur_id uuid)
returns table(pro_id text, nom text, optin boolean)
language sql stable security definer set search_path to 'public' as $$
  select null::text, 'Flowin Event'::text, coalesce(j.optin,false) from joueurs j where j.id = p_joueur_id
  union all
  select c.pro_id, coalesce(nullif(p.nom_commercial,''), nullif(p.nom,''), '[commerce à compléter]'), bool_or(coalesce(c.optin,false))
    from clients_commerce c left join pros p on p.id::text = c.pro_id
   where c.joueur_id = p_joueur_id and c.pro_id is not null
   group by c.pro_id, p.nom_commercial, p.nom;
$$;
create or replace function public.maj_consentement(p_joueur_id uuid, p_pro_id text, p_optin boolean)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if p_pro_id is null then
    update joueurs set optin = coalesce(p_optin,false), optin_date = current_date where id = p_joueur_id;
  else
    update clients_commerce set optin = coalesce(p_optin,false), optin_date = now() where joueur_id = p_joueur_id and pro_id = p_pro_id;
  end if;
  return found;
end $$;
revoke all on function public.mes_consentements(uuid) from public;
revoke all on function public.maj_consentement(uuid,text,boolean) from public;
grant execute on function public.mes_consentements(uuid) to anon, authenticated;
grant execute on function public.maj_consentement(uuid,text,boolean) to anon, authenticated;
