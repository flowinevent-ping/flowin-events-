-- =============================================================================
-- STATISTIQUES PRO (lot 5 E / lot 6 C, 24/11/2026) : une RPC en lecture seule, agrégats uniquement.
-- NON APPLIQUÉ : à relire puis appliquer par l'agent principal (additif, aucune table touchée).
--
-- stats_pro_audience(p_events text[], p_jours integer default null) -> jsonb
--   * Appelant connecté obligatoire. Ne renvoie QUE les animations dont pros.auth_id = auth.uid(),
--     ou toutes pour est_super_admin(). Un identifiant d'animation d'un autre pro est ignoré en silence.
--   * Aucune donnée personnelle individuelle : comptes et parts seulement. Un code postal
--     porté par moins de 3 personnes est rangé dans « autres ».
--     Moins de 5 joueurs : parts masquées (petit_echantillon = true), pour qu'une part ne désigne pas une personne.
--   * Colonnes lues (vérifiées en base le 24/11) : visites(event_id, etape, created_at) = flashs ;
--     participations(event_id, joueur_id, created_at, scan_distance_m) ; joueurs(optin, genre, age_tranche,
--     code_postal, ville, adresse). joueurs.tranche_age est VIDE (0 ligne sur 842), age_tranche est remplie (643).
--   * Genre : F / Femme -> femmes ; H / Homme -> hommes ; tout le reste (vide, « Garçon ») -> non_renseigne.
--     Jamais de catégorie « autre ».
--   * Chalandise : distance mesurée au scan (participations.scan_distance_m, 500 m / 1 km / 3 km / plus loin).
--     Domicile : joueurs.adresse n'est remplie pour personne aujourd'hui (0 sur 842) ; la fonction ne renvoie que
--     le nombre d'adresses connues, le géocodage (accordé par Romain) viendra quand il y aura des adresses.
--   * p_jours : fenêtre en jours (7, 30...) ; null = depuis toujours.
-- Retour arrière : en pied de fichier.
-- =============================================================================

create or replace function public.stats_pro_audience(p_events text[], p_jours integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ev text[];
  v_depuis timestamptz;
  v_flashs bigint;
  v_res jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('refuse', true);
  end if;

  select coalesce(array_agg(e.id), '{}'::text[]) into v_ev
    from events e
   where p_events is not null and cardinality(p_events) <= 500 and e.id = any (p_events)
     and (public.est_super_admin()
          or exists (select 1 from pros p where p.id = e.pro_id and p.auth_id = auth.uid()));

  v_depuis := case when p_jours is null or p_jours <= 0 then null else now() - make_interval(days => p_jours) end;

  select count(*) into v_flashs
    from visites v
   where v.event_id = any (v_ev) and v.etape is null and (v_depuis is null or v.created_at >= v_depuis);

  with j as (
    select j.id, coalesce(j.optin, false) as optin,
           case when j.genre in ('F', 'Femme') then 'femmes' when j.genre in ('H', 'Homme') then 'hommes' else 'non_renseigne' end as genre,
           nullif(btrim(j.age_tranche), '') as age, nullif(btrim(j.code_postal), '') as cp,
           nullif(btrim(j.ville), '') as ville, nullif(btrim(j.adresse), '') as adresse
      from joueurs j
     where j.id in (select pa.joueur_id from participations pa
                     where pa.event_id = any (v_ev) and (v_depuis is null or pa.created_at >= v_depuis))
  ),
  t as (
    select count(*) as n, count(*) filter (where optin) as optin, count(*) filter (where adresse is not null) as adr,
           count(*) filter (where cp is not null) as cp_n from j
  ),
  g as (
    select jsonb_build_object('hommes', count(*) filter (where genre = 'hommes'),
                              'femmes', count(*) filter (where genre = 'femmes'),
                              'non_renseigne', count(*) filter (where genre = 'non_renseigne')) as v from j
  ),
  a as (
    select coalesce(jsonb_agg(jsonb_build_object('tranche', age, 'n', n) order by age), '[]'::jsonb) as v
      from (select age, count(*) as n from j where age is not null group by age) x
  ),
  c as (
    select coalesce(jsonb_agg(jsonb_build_object('cp', cp, 'ville', ville, 'n', n) order by n desc, cp), '[]'::jsonb) as v
      from (select cp, mode() within group (order by ville) as ville, count(*) as n
              from j where cp is not null group by cp having count(*) >= 3 order by count(*) desc limit 5) x
  ),
  s as (
    select jsonb_build_object(
             'connus', count(*),
             'moins_500', count(*) filter (where pa.scan_distance_m < 500),
             'de_500_a_1000', count(*) filter (where pa.scan_distance_m >= 500 and pa.scan_distance_m < 1000),
             'de_1000_a_3000', count(*) filter (where pa.scan_distance_m >= 1000 and pa.scan_distance_m < 3000),
             'plus_loin', count(*) filter (where pa.scan_distance_m >= 3000)) as v
      from participations pa
     where pa.event_id = any (v_ev) and pa.scan_distance_m is not null and (v_depuis is null or pa.created_at >= v_depuis)
  )
  select jsonb_build_object(
           'flashs', v_flashs,
           'joueurs', t.n,
           'optin', t.optin,
           'petit_echantillon', t.n < 5,
           'genre', case when t.n < 5 then null else g.v end,
           'ages', case when t.n < 5 then null else a.v end,
           'cp', case when t.n < 5 then null else c.v end,
           'cp_total', t.cp_n,
           'adresses_connues', t.adr,
           'scan', s.v)
    into v_res
    from t, g, a, c, s;
  return v_res;
end;
$$;

-- Droits : jamais anon / public (règle du 21/11 : revoke explicite des droits par défaut).
revoke all on function public.stats_pro_audience(text[], integer) from public, anon;
grant execute on function public.stats_pro_audience(text[], integer) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RETOUR ARRIÈRE (à exécuter seulement pour annuler) :
--   drop function if exists public.stats_pro_audience(text[], integer);
-- Aucune table, colonne ni politique n'est créée ou modifiée par ce fichier.
-- -----------------------------------------------------------------------------
