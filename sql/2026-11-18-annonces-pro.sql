-- =============================================================================
-- sql/2026-11-18-annonces-pro.sql
-- NON APPLIQUÉ. À relire puis appliquer par Romain (apply_migration), une seule fois.
-- Idempotent : IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF EXISTS.
--
-- Section A — ANNONCES DU COMMERCE DANS L'APPLICATION
--   Le pro écrit une annonce courte (titre, message ~200 caractères, lien optionnel
--   vers son animation, date de fin optionnelle). Elle arrive en notification
--   in-app dans le profil /moi (onglet Alertes) des seuls participants qui ont
--   accepté « rester en contact avec ce commerce ». Aucun e-mail, aucun SMS.
--   Consentement retenu pour un participant et un commerce :
--     1. la ligne clients_commerce (pro_id, joueur_id) si elle existe : son optin
--        (modifiable par le participant dans /moi, maj_consentement) fait foi ;
--     2. sinon, au moins une partie sur un événement du pro avec
--        se_reponses.bonus_reponses->>'optin_commerce' = 'true'.
--   Limite : 2 annonces par pro sur 7 jours glissants.
--
-- Section B — CORRECTIF offrir_ticket_ami_contact (parrain_id sur ami déjà connu)
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- A1. Table des annonces (fermée : RLS sans policy, accès par RPC uniquement)
-- -----------------------------------------------------------------------------
create table if not exists public.annonces_pro (
  id             uuid primary key default gen_random_uuid(),
  pro_id         text not null references public.pros(id) on delete cascade,
  titre          text not null check (char_length(btrim(titre)) between 1 and 60),
  message        text not null check (char_length(btrim(message)) between 1 and 200),
  lien           text check (lien is null or lien ~ '^(https://|/)'),
  date_fin       date,
  nb_destinataires integer not null default 0,
  envoyee_par    uuid,
  created_at     timestamptz not null default now()
);
create index if not exists annonces_pro_pro_idx on public.annonces_pro (pro_id, created_at desc);
alter table public.annonces_pro enable row level security;
revoke all on public.annonces_pro from anon, authenticated;

-- -----------------------------------------------------------------------------
-- A2. Notifications : palier 'annonce' (les paliers existants sont conservés)
--     et rattachement à l'annonce. tirage_id reste nul pour une annonce
--     (l'index unique (tirage_id, palier) laisse passer les NULL).
-- -----------------------------------------------------------------------------
alter table public.joueur_notifications add column if not exists annonce_id uuid references public.annonces_pro(id) on delete cascade;
alter table public.joueur_notifications drop constraint if exists joueur_notifications_palier_check;
alter table public.joueur_notifications add constraint joueur_notifications_palier_check
  check (palier in ('30j', '15j', '48h', 'cadeau', 'relance', 'annonce'));
create unique index if not exists joueur_notifications_annonce_unique
  on public.joueur_notifications (annonce_id, joueur_id) where annonce_id is not null;

-- -----------------------------------------------------------------------------
-- A3. Participants consentants d'un commerce (interne, non exposé)
-- -----------------------------------------------------------------------------
create or replace function public._consentants_commerce(p_pro text)
returns table (joueur_id uuid)
language sql stable security definer
set search_path to 'public'
as $$
  select c.joueur_id from clients_commerce c
   where c.pro_id = p_pro and c.optin = true
  union
  select distinct r.joueur_id from se_reponses r
    join events e on e.id = r.event_id
   where e.pro_id = p_pro and r.joueur_id is not null
     and coalesce(r.bonus_reponses->>'optin_commerce', '') = 'true'
     and not exists (select 1 from clients_commerce c2
                      where c2.pro_id = p_pro and c2.joueur_id = r.joueur_id)
$$;
revoke all on function public._consentants_commerce(text) from public, anon, authenticated;

-- Appelant autorisé : le pro lui-même ou un super admin.
create or replace function public._peut_annoncer(p_pro text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce(est_super_admin(), false)
      or exists (select 1 from pros p where p.id = p_pro and p.auth_id = auth.uid())
$$;
revoke all on function public._peut_annoncer(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- A4. Nombre de destinataires (pour « Envoyer à N contacts ») et quota restant
-- -----------------------------------------------------------------------------
create or replace function public.annonce_pro_etat(p_pro text)
returns jsonb
language plpgsql stable security definer
set search_path to 'public'
as $$
declare n integer; k integer;
begin
  if not _peut_annoncer(p_pro) then raise exception 'acces refuse' using errcode = '42501'; end if;
  select count(*) into n from _consentants_commerce(p_pro);
  select count(*) into k from annonces_pro where pro_id = p_pro and created_at > now() - interval '7 days';
  return jsonb_build_object('destinataires', n, 'envoyees_7j', k, 'restantes', greatest(0, 2 - k));
end $$;
revoke all on function public.annonce_pro_etat(text) from public, anon;
grant execute on function public.annonce_pro_etat(text) to authenticated;

-- -----------------------------------------------------------------------------
-- A5. Envoi : crée l'annonce et une notification par participant consentant.
--     Renvoie le nombre de participants notifiés.
-- -----------------------------------------------------------------------------
create or replace function public.envoyer_annonce_pro(p_pro text, p_titre text, p_message text,
                                                      p_lien text default null, p_date_fin date default null)
returns integer
language plpgsql security definer
set search_path to 'public'
as $$
declare v_id uuid; n integer; v_lien text := nullif(btrim(coalesce(p_lien, '')), '');
begin
  if not _peut_annoncer(p_pro) then raise exception 'acces refuse' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_titre, ''))) not between 1 and 60 then raise exception 'titre'; end if;
  if char_length(btrim(coalesce(p_message, ''))) not between 1 and 200 then raise exception 'message'; end if;
  if v_lien is not null and v_lien !~ '^(https://|/)' then raise exception 'lien'; end if;
  if p_date_fin is not null and p_date_fin < current_date then raise exception 'date_fin'; end if;
  -- Verrou par pro : deux envois simultanés ne passent pas la limite.
  perform pg_advisory_xact_lock(hashtext('annonce_pro:' || p_pro));
  if (select count(*) from annonces_pro where pro_id = p_pro and created_at > now() - interval '7 days') >= 2 then
    raise exception 'limite: 2 annonces par 7 jours' using errcode = 'P0001';
  end if;

  insert into annonces_pro (pro_id, titre, message, lien, date_fin, envoyee_par)
  values (p_pro, btrim(p_titre), btrim(p_message), v_lien, p_date_fin, auth.uid())
  returning id into v_id;

  insert into joueur_notifications (joueur_id, palier, annonce_id)
  select c.joueur_id, 'annonce', v_id from _consentants_commerce(p_pro) c
  on conflict do nothing;
  get diagnostics n = row_count;

  update annonces_pro set nb_destinataires = n where id = v_id;
  return n;
end $$;
revoke all on function public.envoyer_annonce_pro(text, text, text, text, date) from public, anon;
grant execute on function public.envoyer_annonce_pro(text, text, text, text, date) to authenticated;

-- -----------------------------------------------------------------------------
-- A6. Liste des annonces envoyées : super admin = toutes ; pro = les siennes.
-- -----------------------------------------------------------------------------
create or replace function public.annonces_pro_liste(p_pro text default null)
returns table (id uuid, pro_id text, commerce text, titre text, message text, lien text,
               date_fin date, nb_destinataires integer, created_at timestamptz)
language sql stable security definer
set search_path to 'public'
as $$
  select a.id, a.pro_id, coalesce(nullif(p.nom_commercial, ''), nullif(p.nom, ''), '[commerce à compléter]'),
         a.titre, a.message, a.lien, a.date_fin, a.nb_destinataires, a.created_at
    from annonces_pro a left join pros p on p.id = a.pro_id
   where (p_pro is null and coalesce(est_super_admin(), false))
      or (p_pro is not null and a.pro_id = p_pro and _peut_annoncer(p_pro))
   order by a.created_at desc limit 200
$$;
revoke all on function public.annonces_pro_liste(text) from public, anon;
grant execute on function public.annonces_pro_liste(text) to authenticated;

-- -----------------------------------------------------------------------------
-- A7. mes_notifications : renvoie aussi les annonces (titre, message, lien, commerce).
--     Le type de retour change : DROP puis CREATE (même signature d'appel).
--     Une annonce disparaît après sa date de fin ou si le participant a retiré
--     son consentement à ce commerce.
-- -----------------------------------------------------------------------------
drop function if exists public.mes_notifications(uuid);
create function public.mes_notifications(p_joueur_id uuid)
returns table (id uuid, tirage_id bigint, palier text, created_at timestamptz, vu_le timestamptz,
               lot_nom text, retrait_token text, valable_jusqu_au date,
               titre text, message text, lien text, commerce text)
language sql stable security definer
set search_path to 'public'
as $$
  select * from (
    select n.id, n.tirage_id, n.palier, n.created_at, n.vu_le, t.lot_nom, t.retrait_token, t.valable_jusqu_au,
           null::text, null::text, null::text, null::text
      from joueur_notifications n join tirages t on t.id = n.tirage_id
     where n.joueur_id = p_joueur_id and t.retire_at is null
    union all
    select n.id, null::bigint, n.palier, n.created_at, n.vu_le, null::text, null::text, a.date_fin,
           a.titre, a.message, a.lien,
           coalesce(nullif(p.nom_commercial, ''), nullif(p.nom, ''), '[commerce à compléter]')
      from joueur_notifications n
      join annonces_pro a on a.id = n.annonce_id
      left join pros p on p.id = a.pro_id
     where n.joueur_id = p_joueur_id and n.palier = 'annonce'
       and (a.date_fin is null or a.date_fin >= current_date)
       and not exists (select 1 from clients_commerce c
                        where c.pro_id = a.pro_id and c.joueur_id = p_joueur_id and c.optin = false)
  ) x
  order by 4 desc limit 50;
$$;
grant execute on function public.mes_notifications(uuid) to anon, authenticated;

-- =============================================================================
-- Section B — offrir_ticket_ami_contact : l'ami déjà présent dans le fichier
-- client du commerce garde la trace de son parrain (parrain_id), sans écraser
-- un parrain déjà enregistré. Définition reprise de sql/2026-11-10-finitions.sql ;
-- seule la clause ON CONFLICT change (do nothing -> do update).
-- =============================================================================
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
    on conflict (pro_id, joueur_id) do update set parrain_id = coalesce(clients_commerce.parrain_id, excluded.parrain_id);
  end if;

  return jsonb_build_object('ok', true, 'resultat', case when v_inscrit then 'notifie' else 'invite' end);
end $function$;
revoke all on function public.offrir_ticket_ami_contact(text, uuid, text, text) from public;
grant execute on function public.offrir_ticket_ami_contact(text, uuid, text, text) to anon, authenticated;

commit;

-- =============================================================================
-- ROLLBACK (à exécuter seulement pour revenir en arrière)
-- =============================================================================
-- begin;
-- drop function if exists public.mes_notifications(uuid);
-- create function public.mes_notifications(p_joueur_id uuid)
-- returns table (id uuid, tirage_id bigint, palier text, created_at timestamptz, vu_le timestamptz,
--                lot_nom text, retrait_token text, valable_jusqu_au date)
-- language sql stable security definer set search_path to 'public' as $$
--   select n.id, n.tirage_id, n.palier, n.created_at, n.vu_le, t.lot_nom, t.retrait_token, t.valable_jusqu_au
--     from joueur_notifications n join tirages t on t.id = n.tirage_id
--    where n.joueur_id = p_joueur_id and t.retire_at is null
--    order by n.created_at desc limit 50;
-- $$;
-- grant execute on function public.mes_notifications(uuid) to anon, authenticated;
-- drop function if exists public.annonces_pro_liste(text);
-- drop function if exists public.envoyer_annonce_pro(text, text, text, text, date);
-- drop function if exists public.annonce_pro_etat(text);
-- drop function if exists public._peut_annoncer(text);
-- drop function if exists public._consentants_commerce(text);
-- delete from public.joueur_notifications where palier = 'annonce';
-- drop index if exists public.joueur_notifications_annonce_unique;
-- alter table public.joueur_notifications drop column if exists annonce_id;
-- alter table public.joueur_notifications drop constraint if exists joueur_notifications_palier_check;
-- alter table public.joueur_notifications add constraint joueur_notifications_palier_check
--   check (palier in ('30j', '15j', '48h', 'cadeau', 'relance'));
-- drop table if exists public.annonces_pro;
-- -- Section B : rejouer la définition de sql/2026-11-10-finitions.sql (on conflict do nothing).
-- commit;
