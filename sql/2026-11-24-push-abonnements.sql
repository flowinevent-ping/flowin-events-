-- RAPPELS WEB PUSH du joueur : abonnements + file d'envoi (24/11/2026).
-- ADDITIF : 2 tables et 6 fonctions nouvelles, aucune table existante modifiée (joueurs.push_token reste inutilisée).
-- NON APPLIQUÉE : à exécuter par Romain / l'agent principal seulement sur ordre (apply_migration = persistant en prod).
-- Retour arrière : bloc en pied de fichier.
-- Sécurité : tables fermées (RLS sans politique, droits retirés à public / anon / authenticated, TRUNCATE compris) ;
--   le joueur écrit uniquement par 2 RPC SECURITY DEFINER qui vérifient que le joueur existe (même niveau que les
--   autres RPC joueur : l'identifiant du téléphone fait foi) ; la lecture des abonnements et l'envoi sont réservés
--   à service_role (fonction edge push-envoyer). Après application : lire controle_qualite_dernier().

create table if not exists public.push_abonnements (
  id          uuid primary key default gen_random_uuid(),
  joueur_id   uuid not null references public.joueurs(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists push_abonnements_joueur_idx on public.push_abonnements (joueur_id) where actif;
alter table public.push_abonnements enable row level security;
revoke all on public.push_abonnements from public, anon, authenticated;

-- Journal d'envoi : une ligne par message (type + référence) = jamais deux fois ; sert aussi au plafond par joueur.
create table if not exists public.push_envois (
  type        text not null check (type in ('gain', 'rappel', 'lendemain')),
  ref         text not null,
  joueur_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (type, ref)
);
create index if not exists push_envois_joueur_jour_idx on public.push_envois (joueur_id, created_at desc);
alter table public.push_envois enable row level security;
revoke all on public.push_envois from public, anon, authenticated;

-- 1. Le téléphone s'abonne (appelée par le joueur, clé publique).
create or replace function public.push_abonner(p_joueur_id uuid, p_endpoint text, p_p256dh text, p_auth text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_joueur_id is null or coalesce(p_endpoint, '') = '' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    return jsonb_build_object('ok', false, 'raison', 'parametres'); end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(p_p256dh) > 200 or length(p_auth) > 100 then
    return jsonb_build_object('ok', false, 'raison', 'format'); end if;
  if not exists (select 1 from joueurs j where j.id = p_joueur_id) then
    return jsonb_build_object('ok', false, 'raison', 'joueur'); end if;
  insert into push_abonnements (joueur_id, endpoint, p256dh, auth, actif)
  values (p_joueur_id, p_endpoint, p_p256dh, p_auth, true)
  on conflict (endpoint) do update
    set joueur_id = excluded.joueur_id, p256dh = excluded.p256dh, auth = excluded.auth, actif = true, updated_at = now();
  -- 5 appareils actifs au plus par joueur : les plus anciens sont désactivés.
  update push_abonnements set actif = false, updated_at = now()
   where joueur_id = p_joueur_id and actif
     and id not in (select id from push_abonnements where joueur_id = p_joueur_id and actif order by updated_at desc limit 5);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.push_abonner(uuid, text, text, text) from public;
grant execute on function public.push_abonner(uuid, text, text, text) to anon, authenticated;

-- 2. Case « Rappels » décochée : l'abonnement de ce téléphone est coupé (seulement pour ce joueur).
create or replace function public.push_desabonner(p_joueur_id uuid, p_endpoint text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_joueur_id is null or coalesce(p_endpoint, '') = '' then return jsonb_build_object('ok', false, 'raison', 'parametres'); end if;
  update push_abonnements set actif = false, updated_at = now() where joueur_id = p_joueur_id and endpoint = p_endpoint;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.push_desabonner(uuid, text) from public;
grant execute on function public.push_desabonner(uuid, text) to anon, authenticated;

-- 3. Réservé à la fonction edge push-envoyer (service_role) : ce qu'il reste à envoyer.
--    p_type = 'gain'      : lot prêt (billet créé il y a 2 min à 24 h, non retiré, avec jeton de retrait).
--             'rappel'    : rappel d'expiration (1 mois / 15 jours / 48 h) créé dans /moi et non vu.
--             'lendemain' : a joué hier (heure de Paris), n'a pas encore joué aujourd'hui.
--    Plafond : 2 messages par joueur et par jour (heure de Paris), tous types confondus.
create or replace function public.push_a_envoyer(p_type text, p_limite int default 200)
returns table (abo_id uuid, joueur_id uuid, endpoint text, p256dh text, auth text, ref text, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_jour date := (now() at time zone 'Europe/Paris')::date;
begin
  if p_type = 'gain' then
    return query
      select a.id, a.joueur_id, a.endpoint, a.p256dh, a.auth, t.id::text, coalesce(t.lot_nom, '')
        from tirages t join push_abonnements a on a.joueur_id = t.joueur_id and a.actif
       where t.joueur_id is not null and t.retire_at is null and coalesce(t.statut, '') <> 'annule'
         and t.retrait_token is not null
         and t.created_at between now() - interval '24 hours' and now() - interval '2 minutes'
         and not exists (select 1 from push_envois e where e.type = 'gain' and e.ref = t.id::text)
         and (select count(*) from push_envois e where e.joueur_id = t.joueur_id and (e.created_at at time zone 'Europe/Paris')::date = v_jour) < 2
       order by t.created_at limit greatest(1, least(p_limite, 500));
  elsif p_type = 'rappel' then
    return query
      select a.id, a.joueur_id, a.endpoint, a.p256dh, a.auth, n.id::text, n.palier || '|' || coalesce(t.lot_nom, '')
        from joueur_notifications n
        join tirages t on t.id = n.tirage_id and t.retire_at is null
        join push_abonnements a on a.joueur_id = n.joueur_id and a.actif
       where n.vu_le is null and n.palier in ('30j', '15j', '48h') and n.created_at > now() - interval '2 days'
         and not exists (select 1 from push_envois e where e.type = 'rappel' and e.ref = n.id::text)
         and (select count(*) from push_envois e where e.joueur_id = n.joueur_id and (e.created_at at time zone 'Europe/Paris')::date = v_jour) < 2
       order by n.created_at limit greatest(1, least(p_limite, 500));
  elsif p_type = 'lendemain' then
    return query
      select a.id, a.joueur_id, a.endpoint, a.p256dh, a.auth, a.joueur_id::text || ':' || v_jour::text, ''::text
        from push_abonnements a
       where a.actif
         and exists (select 1 from participations p where p.joueur_id = a.joueur_id and (p.created_at at time zone 'Europe/Paris')::date = v_jour - 1)
         and not exists (select 1 from participations p where p.joueur_id = a.joueur_id and (p.created_at at time zone 'Europe/Paris')::date = v_jour)
         and not exists (select 1 from push_envois e where e.type = 'lendemain' and e.ref = a.joueur_id::text || ':' || v_jour::text)
         and (select count(*) from push_envois e where e.joueur_id = a.joueur_id and (e.created_at at time zone 'Europe/Paris')::date = v_jour) < 2
       limit greatest(1, least(p_limite, 500));
  end if;
end $$;
revoke all on function public.push_a_envoyer(text, int) from public, anon, authenticated;
grant execute on function public.push_a_envoyer(text, int) to service_role;

-- 4. Réservé à service_role : message envoyé (jamais deux fois) / abonnement mort (404 ou 410 du service de notification).
create or replace function public.push_marquer(p_type text, p_ref text, p_joueur_id uuid)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into push_envois (type, ref, joueur_id) values (p_type, p_ref, p_joueur_id) on conflict do nothing;
$$;
revoke all on function public.push_marquer(text, text, uuid) from public, anon, authenticated;
grant execute on function public.push_marquer(text, text, uuid) to service_role;

create or replace function public.push_desactiver(p_abo_id uuid)
returns void language sql security definer set search_path = public, pg_temp as $$
  update push_abonnements set actif = false, updated_at = now() where id = p_abo_id;
$$;
revoke all on function public.push_desactiver(uuid) from public, anon, authenticated;
grant execute on function public.push_desactiver(uuid) to service_role;

-- 5. Planification (À NE PAS lancer sans accord) : un appel par type, avec le même secret de cron que rappel-tickets.
--    Exemple, toutes les 10 minutes pour 'gain' et 'rappel', une fois à 10 h (Paris) pour 'lendemain'. Voir
--    supabase/functions/push-envoyer/index.ts (en-tête x-flowin-cron, corps {"mode":"gain"}).

-- ============================== RETOUR ARRIÈRE ==============================
-- drop function if exists public.push_desactiver(uuid);
-- drop function if exists public.push_marquer(text, text, uuid);
-- drop function if exists public.push_a_envoyer(text, int);
-- drop function if exists public.push_desabonner(uuid, text);
-- drop function if exists public.push_abonner(uuid, text, text, text);
-- drop table if exists public.push_envois;
-- drop table if exists public.push_abonnements;
-- (cron : cron.unschedule des tâches push-* si elles ont été créées)
