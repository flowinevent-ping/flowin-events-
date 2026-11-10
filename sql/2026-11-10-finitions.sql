-- =============================================================================
-- FINITIONS DU 10/11/2026 (configurateur, tickets gagnants)
--   1. Validité des lots « du … au … » : lots.valide_du / lots.valide_au.
--      date_limite_tirage : valide_au, puis created_at + validite_jours, puis fin
--      de l'animation / du super event. Exception Nuits du Sud (se-nds-2026) : null.
--      valider_lot refuse avant valide_du (« Valable à partir du … »).
--   2. « En faire profiter un ami » : ami inscrit -> notification dans l'application
--      (palier 'cadeau') et billet dans son /moi ; ami non inscrit -> invitation
--      WhatsApp. Dans les deux cas : fichier client du commerce, source 'parrainage'.
-- Appliqué via MCP Supabase (apply_migration finitions_2026_11_10).
-- =============================================================================

-- 1. VALIDITÉ « D'UNE DATE À UNE DATE » ---------------------------------------
alter table public.lots add column if not exists valide_du date;
alter table public.lots add column if not exists valide_au date;

create or replace function public.date_limite_tirage(p_tirage_id bigint)
 returns date
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select case when t.super_event_id = 'se-nds-2026' then null else coalesce(
    (select l.valide_au from lots l where l.id = lot_du_tirage(t.id) and l.valide_au is not null),
    (select (t.created_at::date + l.validite_jours) from lots l where l.id = lot_du_tirage(t.id) and l.validite_jours > 0),
    (select e.date_f::date from events e where e.id = t.event_id),
    (select s.date_f::date from super_events s where s.id = t.super_event_id)) end
  from tirages t where t.id = p_tirage_id;
$function$;

create or replace function public.date_debut_tirage(p_tirage_id bigint)
 returns date
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select case when t.super_event_id = 'se-nds-2026' then null else
    (select l.valide_du from lots l where l.id = lot_du_tirage(t.id)) end
  from tirages t where t.id = p_tirage_id;
$function$;
grant execute on function public.date_debut_tirage(bigint) to anon, authenticated;

create or replace function public.valider_lot(p_token text, p_pin text default null::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare v_id bigint; v_pt text; v_lim date; v_du date;
begin
  select id, valable_jusqu_au into v_id, v_lim from tirages where retrait_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'raison', 'introuvable'); end if;
  if not public.est_super_admin() then
    if p_pin is null or length(btrim(p_pin)) = 0 then
      return jsonb_build_object('ok', false, 'raison', 'pin_requis', 'message', 'Code professionnel requis.');
    end if;
    v_pt := partenaire_du_tirage(v_id);
    if v_pt is null then
      return jsonb_build_object('ok', false, 'raison', 'pin_requis', 'message', 'Aucun commerce rattache a ce billet : validation par l''equipe Flowin.');
    end if;
    if not exists (select 1 from partenaires pa where pa.id = v_pt and coalesce(btrim(pa.code_pin), '') <> '' and pa.code_pin = btrim(p_pin)) then
      return jsonb_build_object('ok', false, 'raison', 'pin_invalide', 'message', 'Code professionnel incorrect.');
    end if;
  end if;
  v_du := public.date_debut_tirage(v_id);
  if v_du is not null and v_du > current_date then
    return jsonb_build_object('ok', false, 'raison', 'pas_encore', 'valable_du', v_du,
      'message', 'Valable à partir du ' || to_char(v_du, 'DD/MM/YYYY') || '.');
  end if;
  if v_lim is not null and v_lim < current_date then
    return jsonb_build_object('ok', false, 'raison', 'expire', 'valable_jusqu_au', v_lim,
      'message', 'Billet expiré le ' || to_char(v_lim, 'DD/MM/YYYY') || '. Le commerce peut l''accepter quand même.');
  end if;
  return public._valider_lot_sans_pin(p_token, null);
end $function$;

-- 2. « EN FAIRE PROFITER UN AMI » ----------------------------------------------
alter table public.tirages add column if not exists offert_a_joueur_id uuid;
create index if not exists tirages_offert_a_idx on public.tirages (offert_a_joueur_id) where offert_a_joueur_id is not null;

alter table public.joueur_notifications drop constraint if exists joueur_notifications_palier_check;
alter table public.joueur_notifications add constraint joueur_notifications_palier_check
  check (palier in ('30j', '15j', '48h', 'cadeau', 'relance'));  -- 'relance' : migration sa_carte_relance_2026_11_10 (autre lot), appliquée après celle-ci

-- Fichier client du commerce : contacts venus hors partie (parrainage), lus par crm_pro.
create table if not exists public.clients_commerce (
  id          uuid primary key default gen_random_uuid(),
  pro_id      text not null,
  joueur_id   uuid not null,
  source      text not null default 'parrainage',
  tirage_id   bigint,
  parrain_id  uuid,
  created_at  timestamptz not null default now(),
  unique (pro_id, joueur_id)
);
alter table public.clients_commerce enable row level security;
revoke all on public.clients_commerce from anon, authenticated;

-- Contact normalisé : e-mail en minuscules, téléphone sur ses 9 derniers chiffres.
create or replace function public._tel9(p text) returns text language sql immutable as $$
  select nullif(right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 9), '')
$$;

create or replace function public.offrir_ticket_ami_contact(p_token text, p_joueur_id uuid, p_prenom text, p_contact text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_t tirages%rowtype; v_c text := btrim(coalesce(p_contact, '')); v_email text; v_tel9 text;
  v_ami uuid; v_inscrit boolean := false; v_pro text;
begin
  select * into v_t from tirages where retrait_token = p_token;
  if not found or v_t.joueur_id is distinct from p_joueur_id or v_t.retire_at is not null or coalesce(v_t.statut, '') = 'annule' then
    return jsonb_build_object('ok', false, 'raison', 'billet');
  end if;
  if position('@' in v_c) > 0 then
    v_email := lower(v_c);
    if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'raison', 'contact'); end if;
  else
    v_tel9 := _tel9(v_c);
    if v_tel9 is null or length(regexp_replace(v_c, '\D', '', 'g')) < 9 then return jsonb_build_object('ok', false, 'raison', 'contact'); end if;
  end if;

  select j.id, coalesce(j.source, '') <> 'parrainage' into v_ami, v_inscrit from joueurs j
   where (v_email is not null and j.email_lower = v_email) or (v_tel9 is not null and _tel9(j.tel) = v_tel9)
   order by (coalesce(j.source, '') <> 'parrainage') desc, j.ts asc nulls last limit 1;
  if v_ami = p_joueur_id then return jsonb_build_object('ok', false, 'raison', 'soi'); end if;
  v_inscrit := coalesce(v_inscrit, false);

  if v_ami is null then
    insert into joueurs (prenom, email, tel, source)
    values (nullif(btrim(coalesce(p_prenom, '')), ''), v_email, case when v_tel9 is not null then v_c end, 'parrainage')
    returning id into v_ami;
  end if;

  update tirages set offert_le = coalesce(offert_le, now()), offert_a_joueur_id = v_ami where id = v_t.id;

  if v_inscrit then
    insert into joueur_notifications (joueur_id, tirage_id, palier) values (v_ami, v_t.id, 'cadeau')
    on conflict (tirage_id, palier) do update set joueur_id = excluded.joueur_id, created_at = now(), vu_le = null;
  end if;

  v_pro := coalesce((select e.pro_id from events e where e.id = v_t.event_id),
                    (select p.id from pros p where p.partenaire_id = v_t.partenaire_id order by p.id limit 1));
  if v_pro is not null then
    insert into clients_commerce (pro_id, joueur_id, source, tirage_id, parrain_id)
    values (v_pro, v_ami, 'parrainage', v_t.id, p_joueur_id)
    on conflict (pro_id, joueur_id) do nothing;
  end if;

  return jsonb_build_object('ok', true, 'resultat', case when v_inscrit then 'notifie' else 'invite' end);
end $function$;
revoke all on function public.offrir_ticket_ami_contact(text, uuid, text, text) from public;
grant execute on function public.offrir_ticket_ami_contact(text, uuid, text, text) to anon, authenticated;

-- Notifications « cadeau » du joueur (lot offert par un ami).
create or replace function public.mes_cadeaux(p_joueur_id uuid)
 returns table (id uuid, tirage_id bigint, lot_nom text, created_at timestamptz, vu_le timestamptz)
 language sql stable security definer
 set search_path to 'public'
as $$
  select n.id, n.tirage_id, t.lot_nom, n.created_at, n.vu_le
    from joueur_notifications n join tirages t on t.id = n.tirage_id
   where n.joueur_id = p_joueur_id and n.palier = 'cadeau' and t.retire_at is null
     and t.offert_a_joueur_id = p_joueur_id
   order by n.created_at desc limit 20;
$$;
grant execute on function public.mes_cadeaux(uuid) to anon, authenticated;

-- crm_pro : identique, plus les contacts du fichier client (parrainage).
create or replace function public.crm_pro(p_pro text)
 returns table(joueur_id uuid, prenom text, nom text, email text, tel text, code_postal text, ville text, genre text, tranche_age text, optin boolean, source text, origines text[], operations jsonb, nb_parties bigint, nb_tickets bigint, nb_gains bigint, lots text[], premiere date, derniere date)
 language sql
 stable security definer
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
  cc as (select c.joueur_id, array_agg(distinct c.source) as sources, min(c.created_at)::date as jour
           from clients_commerce c where c.pro_id = p_pro group by c.joueur_id),
  base as (select joueur_id from pa union select joueur_id from gt union select joueur_id from cc),
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
         j.optin, j.source,
         coalesce((select array_agg(distinct x) from unnest(array_remove(coalesce(a.origines_qr, '{}') || array[nullif(btrim(j.source), '')] || coalesce(c.sources, '{}'), null)) x), '{}'),
         o.operations, coalesce(a.nb_parties, 0), coalesce(a.nb_tickets, 0), coalesce(g.n, 0), coalesce(g.lots, '{}'),
         coalesce(a.premiere, c.jour), coalesce(a.derniere, c.jour)
    from base b
    left join joueurs j on j.id = b.joueur_id
    left join agg a on a.joueur_id = b.joueur_id
    left join ops o on o.joueur_id = b.joueur_id
    left join gains g on g.joueur_id = b.joueur_id
    left join cc c on c.joueur_id = b.joueur_id
   order by coalesce(a.derniere, c.jour) desc nulls last
$function$;

-- 3. BON DE COMMANDE : activité, lots proposés, conditions des lots (imprimés sur le PDF) ----
-- Appliqué via MCP Supabase (apply_migration finitions_2026_11_10_bon_commande).
alter table public.commandes_animation add column if not exists activite text;
alter table public.commandes_animation add column if not exists lots_proposes text;
alter table public.commandes_animation add column if not exists conditions_lots text;
