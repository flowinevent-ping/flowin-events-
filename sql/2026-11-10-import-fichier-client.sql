-- ============================================================================
-- sql/2026-11-10-import-fichier-client.sql
-- IMPORT DU FICHIER CLIENT DANS L'ESPACE PRO (registre L13, 10/11/2026).
--
-- A APPLIQUER UNE FOIS par Romain (apply_migration), apres relecture.
-- Idempotent : CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS.
--
-- Modele : le fichier client du pro reste celui de crm_pro (une ligne par joueur).
--   * Un contact importe est un joueur (table joueurs, source 'import') ;
--     s'il existe deja (meme email, sinon meme telephone), il est rattache
--     sans modifier ses coordonnees (les pros ne modifient jamais un joueur).
--   * Le rattachement pro <-> joueur vit dans contacts_importes_pro, avec le
--     consentement donne AU PRO (optin) : vrai seulement si la colonne
--     consentement du fichier dit oui.
--   * crm_pro integre ces contacts (origine 'import') ; crm_pro_consentants,
--     qui s'appuie sur crm_pro, n'a pas besoin d'etre modifiee.
--
-- Securite : import_contacts_pro est SECURITY DEFINER et verifie que l'appelant
-- est le pro lui-meme (pros.auth_id = auth.uid()) ou un super admin.
-- Limite : 5000 lignes par appel (le navigateur envoie par paquets de 500).
-- ============================================================================

begin;

-- 1. Table de rattachement pro <-> contacts importes
create table if not exists public.contacts_importes_pro (
  pro_id      text not null references public.pros(id) on delete cascade,
  joueur_id   uuid not null references public.joueurs(id) on delete cascade,
  optin       boolean not null default false,
  optin_date  timestamptz,
  importe_le  timestamptz not null default now(),
  primary key (pro_id, joueur_id)
);
create index if not exists contacts_importes_pro_joueur_idx on public.contacts_importes_pro (joueur_id);

-- Aucune lecture / ecriture directe : uniquement via les fonctions ci-dessous.
alter table public.contacts_importes_pro enable row level security;
drop policy if exists contacts_importes_pro_sa on public.contacts_importes_pro;
create policy contacts_importes_pro_sa on public.contacts_importes_pro
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());
revoke all on public.contacts_importes_pro from anon;

-- 2. RPC d'import
-- p_contacts : tableau jsonb d'objets
--   { prenom, nom, email, tel, genre ('Homme'|'Femme'|''), ville, code_postal, optin (bool) }
-- Renvoie { total, crees, rattaches, ignores }.
create or replace function public.import_contacts_pro(p_pro text, p_contacts jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c        jsonb;
  v_email    text;
  v_tel      text;
  v_genre    text;
  v_optin    boolean;
  v_id       uuid;
  v_ext      text;
  v_total    int := 0;
  v_crees    int := 0;
  v_ratt     int := 0;
  v_ign      int := 0;
begin
  -- Controle d'acces : le pro lui-meme ou un super admin.
  if auth.uid() is null
     or not (exists (select 1 from pros p where p.id = p_pro and p.auth_id = auth.uid())
             or public.est_super_admin()) then
    raise exception 'acces refuse' using errcode = '42501';
  end if;
  if p_contacts is null or jsonb_typeof(p_contacts) <> 'array' then
    raise exception 'format invalide' using errcode = '22023';
  end if;
  if jsonb_array_length(p_contacts) > 5000 then
    raise exception 'trop de lignes (5000 maximum par envoi)' using errcode = '54000';
  end if;

  for v_c in select * from jsonb_array_elements(p_contacts) loop
    v_total := v_total + 1;
    v_email := nullif(lower(btrim(coalesce(v_c->>'email', ''))), '');
    if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then v_email := null; end if;
    v_tel := nullif(regexp_replace(coalesce(v_c->>'tel', ''), '[^0-9+]', '', 'g'), '');
    if v_email is null and v_tel is null then v_ign := v_ign + 1; continue; end if;
    v_genre := case lower(btrim(coalesce(v_c->>'genre', ''))) when 'homme' then 'Homme' when 'femme' then 'Femme' else '' end;
    v_optin := coalesce((v_c->>'optin')::boolean, false);

    -- Joueur existant : par email, sinon par telephone.
    v_id := null;
    if v_email is not null then
      select j.id into v_id from joueurs j where j.email_lower = v_email order by j.created_at limit 1;
    end if;
    if v_id is null and v_tel is not null then
      select j.id into v_id from joueurs j where j.tel = v_tel order by j.created_at limit 1;
    end if;

    if v_id is null then
      -- Meme convention d'external_id que les parcours joueurs (lib/joueurs.ts).
      v_ext := case when v_email is not null
                    then 'j-' || left(regexp_replace(v_email, '[^a-z0-9]', '-', 'g'), 40)
                    else 'imp-' || p_pro || '-' || v_tel end;
      insert into joueurs (external_id, email, prenom, nom, tel, genre, ville, code_postal,
                           source, optin, optin_date, first_seen, client_type)
      values (v_ext, coalesce(v_email, ''), btrim(coalesce(v_c->>'prenom', '')), btrim(coalesce(v_c->>'nom', '')),
              coalesce(v_tel, ''), v_genre, btrim(coalesce(v_c->>'ville', '')), btrim(coalesce(v_c->>'code_postal', '')),
              'import', v_optin, case when v_optin then now() end, now(), 'btoc')
      on conflict (external_id) do nothing
      returning id into v_id;
      if v_id is null then
        select j.id into v_id from joueurs j where j.external_id = v_ext;
        v_ratt := v_ratt + 1;
      else
        v_crees := v_crees + 1;
      end if;
    else
      v_ratt := v_ratt + 1;
    end if;

    insert into contacts_importes_pro (pro_id, joueur_id, optin, optin_date)
    values (p_pro, v_id, v_optin, case when v_optin then now() end)
    on conflict (pro_id, joueur_id) do update
      set optin = contacts_importes_pro.optin or excluded.optin,
          optin_date = coalesce(contacts_importes_pro.optin_date, excluded.optin_date),
          importe_le = now();
  end loop;

  return jsonb_build_object('total', v_total, 'crees', v_crees, 'rattaches', v_ratt, 'ignores', v_ign);
end;
$$;
revoke all on function public.import_contacts_pro(text, jsonb) from public, anon;
grant execute on function public.import_contacts_pro(text, jsonb) to authenticated, service_role;

-- 3. crm_pro : integre les contacts importes (origine 'import', consentement au pro).
--    Meme signature que sql/crm_pro.sql (create or replace sans rupture).
create or replace function public.crm_pro(p_pro text)
returns table(
  joueur_id uuid, prenom text, nom text, email text, tel text,
  code_postal text, ville text, genre text, tranche_age text, optin boolean,
  source text, origines text[], operations jsonb,
  nb_parties bigint, nb_tickets bigint, nb_gains bigint, lots text[],
  premiere date, derniere date
)
language sql stable security definer
set search_path to 'public'
as $function$
  with ev as (
    select e.id, e.super_event_id,
           case when e.super_event_id is not null then 'se:' || e.super_event_id else 'ev:' || e.id end as cle,
           coalesce(se.nom, nullif(btrim(e.nom), ''), e.id) as op_nom
      from events e
      left join super_events se on se.id = e.super_event_id
     where e.pro_id = p_pro
       and e.super_event_id is distinct from 'se-master-superevent'
  ),
  pa as (
    select p.joueur_id, ev.cle, ev.op_nom, coalesce(p.tickets, 0) as tickets,
           coalesce(p.played_date, p.created_at::date) as jour, nullif(btrim(p.source_qr), '') as source_qr
      from participations p
      join ev on ev.id = p.event_id
     where p.joueur_id is not null
  ),
  gt as (
    select t.joueur_id, t.lot_nom, t.created_at::date as jour,
           coalesce('se:' || t.super_event_id, 'ev:' || t.event_id) as cle,
           coalesce(se.nom, nullif(btrim(e.nom), ''), t.super_event_id, t.event_id) as op_nom
      from tirages t
      left join super_events se on se.id = t.super_event_id
      left join events e on e.id = t.event_id
     where t.joueur_id is not null and t.statut <> 'annule'
       and (t.event_id in (select id from ev)
            or t.partenaire_id = (select partenaire_id from pros where id = p_pro))
  ),
  -- Contacts importes par le pro (fichier client, source 'import').
  imp as (
    select ci.joueur_id, bool_or(ci.optin) as optin
      from contacts_importes_pro ci
     where ci.pro_id = p_pro
     group by ci.joueur_id
  ),
  base as (select joueur_id from pa union select joueur_id from gt union select joueur_id from imp),
  ops as (
    select joueur_id, jsonb_agg(jsonb_build_object('cle', cle, 'nom', op_nom, 'parties', n, 'derniere', d) order by d desc nulls last) as operations
      from (
        select joueur_id, cle, max(op_nom) as op_nom, sum(n) as n, max(d) as d
          from (
            select joueur_id, cle, op_nom, count(*) as n, max(jour) as d from pa group by joueur_id, cle, op_nom
            union all
            select joueur_id, cle, op_nom, 0, max(jour) from gt group by joueur_id, cle, op_nom
          ) u
         group by joueur_id, cle
      ) x
     group by joueur_id
  ),
  gains as (
    select joueur_id, count(*) as n, array_agg(distinct lot_nom) filter (where lot_nom is not null) as lots
      from gt group by joueur_id
  ),
  agg as (
    select joueur_id, count(*) as nb_parties, sum(tickets) as nb_tickets, min(jour) as premiere, max(jour) as derniere,
           array_remove(array_agg(distinct source_qr), null) as origines_qr
      from pa group by joueur_id
  )
  select b.joueur_id, j.prenom, j.nom, j.email, j.tel, j.code_postal, j.ville,
         coalesce(nullif(j.genre, ''), nullif(j.sexe, '')),
         coalesce(nullif(j.tranche_age, ''), nullif(j.age_tranche, '')),
         (coalesce(j.optin, false) or coalesce(im.optin, false)), coalesce(nullif(btrim(j.source), ''), case when im.joueur_id is not null then 'import' end),
         coalesce((select array_agg(distinct x) from unnest(array_remove(coalesce(a.origines_qr, '{}') || array[nullif(btrim(j.source), ''), case when im.joueur_id is not null then 'import' end], null)) x), '{}'),
         o.operations, coalesce(a.nb_parties, 0), coalesce(a.nb_tickets, 0), coalesce(g.n, 0), coalesce(g.lots, '{}'),
         a.premiere, a.derniere
    from base b
    left join joueurs j on j.id = b.joueur_id
    left join agg a on a.joueur_id = b.joueur_id
    left join ops o on o.joueur_id = b.joueur_id
    left join gains g on g.joueur_id = b.joueur_id
    left join imp im on im.joueur_id = b.joueur_id
   order by a.derniere desc nulls last
$function$;

commit;

notify pgrst, 'reload schema';

-- ============================================================================
-- RETOUR ARRIERE (commente) : a executer seulement pour annuler l'import.
-- ----------------------------------------------------------------------------
-- begin;
--   -- 1. Remettre crm_pro d'origine : rejouer le contenu de sql/crm_pro.sql.
--   -- 2. Retirer la fonction d'import et la table de rattachement :
--   drop function if exists public.import_contacts_pro(text, jsonb);
--   drop table if exists public.contacts_importes_pro;
--   -- 3. (optionnel) Joueurs crees par un import et jamais venus jouer :
--   -- delete from public.joueurs j where j.source = 'import'
--   --   and not exists (select 1 from public.participations p where p.joueur_id = j.id)
--   --   and not exists (select 1 from public.tirages t where t.joueur_id = j.id);
-- commit;
-- notify pgrst, 'reload schema';
-- ============================================================================
