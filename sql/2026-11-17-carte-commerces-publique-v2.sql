-- Appliquée en prod le 17/11/2026 (migration MCP « carte_commerces_publique_v2 »). Ne pas rejouer.
-- Voir docs/audit-2026-11-17/EXPERT-3-carte.md. Données publiques seulement.
create or replace function public.carte_commerces_publique_v2()
returns table (cle text, nom text, adresse text, lat double precision, lng double precision,
               logo text, type text, jeux text[], lien_jeu text, lot text, horaires text, en_cours boolean)
language sql stable security definer
set search_path to 'public'
as $$
  with s as (
    select coalesce(e.pro_id, e.id) cle, e.*, p.nom_commercial, p.nom pro_nom,
           (select coalesce(nullif(l.titre, ''), nullif(l.nom, '')) from lots l
             where l.event_id = e.id and coalesce(l.retire, false) = false
               and (l.valide_au is null or l.valide_au >= current_date)
             order by coalesce(l.valeur_euros, l.valeur, 0) desc limit 1) lot_titre
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
         array_remove(array_agg(distinct module), null),
         coalesce(
           max(case when super_event_id is null and status = 'live' then '/jouer?ev=' || id end),
           max(case when super_event_id is not null and status = 'live' then '/se/' || super_event_id end)),
         coalesce(max(nullif(gain_immediat, '')), max(lot_titre)),
         max(nullif(horaires, '')),
         bool_or(status = 'live')
    from s group by cle;
$$;
revoke all on function public.carte_commerces_publique_v2() from public;
grant execute on function public.carte_commerces_publique_v2() to anon, authenticated;
