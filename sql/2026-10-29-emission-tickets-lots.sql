-- EMISSION DES TICKETS DE LOT — Romain (29/10) : « à l'émission des lots,
-- connecter avec la création des lots et ses QR codes ; une fois validé, la
-- liste des tickets édités avec leur QR code et leur numéro, et les
-- supprimer ; encoder la démarche pour ne créer ni conflit ni doublon ».
--
-- Modèle : un « ticket édité » est une unité physique du lot dans
-- `lots_stock` (code unique + numéro). Le gagnant présente son billet
-- (tirages.retrait_token) en caisse ; valider_lot() décompte alors une unité
-- du lot (utilise = true, attribue_a = n° du billet). Rien ne change à ce
-- circuit.
--
-- Anti-doublon :
--   1. lots_stock.numero + index unique (lot_id, numero) ;
--   2. le code reste unique (uniq_lots_stock_code, déjà en place) ;
--   3. synchroniser_tickets_lot() verrouille la ligne du lot (FOR UPDATE) :
--      deux validations simultanées passent l'une après l'autre ;
--   4. elle ne fait que combler l'écart avec lots.quantite : la rappeler ne
--      crée jamais de ticket en trop (toutes les lignes du lot comptent, y
--      compris archivées) ;
--   5. elle ne retire que des tickets jamais attribués ni remis.
-- Le déclencheur relie la création/modification d'un lot (quel que soit
-- l'écran : modal Gérer les lots, parcours de création SA ou pro) à
-- l'émission.
-- Additif : aucune ligne existante n'est modifiée par cette migration.

alter table public.lots_stock add column if not exists numero integer;

create unique index if not exists uniq_lots_stock_lot_numero
  on public.lots_stock (lot_id, numero) where numero is not null;

-- Le pro connecté ne peut agir que sur les lots de ses propres stations.
-- L'appel anonyme (dashboard SA, sans connexion à ce jour) reste autorisé.
create or replace function public.peut_gerer_lot(p_lot_id text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $function$
  select case
    when coalesce(auth.role(), 'anon') <> 'authenticated' then true
    else exists (
      select 1 from lots l
        join events e on e.id = l.event_id
        join pros p on p.id = e.pro_id
       where l.id = p_lot_id and p.auth_id = auth.uid())
  end;
$function$;

create or replace function public.synchroniser_tickets_lot(p_lot_id text)
returns jsonb
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_lot record; v_cible int; v_total int; v_n int; v_ajoutes int := 0; v_retires int := 0;
  v_surplus int; v_tentatives int := 0;
begin
  select id, quantite, partenaire_id into v_lot from lots where id = p_lot_id for update;
  if not found then return jsonb_build_object('ok', false, 'raison', 'lot_introuvable'); end if;

  v_cible := greatest(coalesce(v_lot.quantite, 1), 0);
  select count(*) into v_total from lots_stock where lot_id = p_lot_id;

  if v_total < v_cible then
    select greatest(coalesce(max(numero), 0), count(*)) into v_n from lots_stock where lot_id = p_lot_id;
    while v_total < v_cible and v_tentatives < v_cible * 4 + 20 loop
      v_n := v_n + 1; v_tentatives := v_tentatives + 1;
      insert into lots_stock (lot_id, numero, code, statut, partenaire, utilise)
      values (p_lot_id, v_n, p_lot_id || '-' || lpad(v_n::text, 3, '0'), 'disponible', v_lot.partenaire_id, false)
      on conflict do nothing;
      if found then v_total := v_total + 1; v_ajoutes := v_ajoutes + 1; end if;
    end loop;
  elsif v_total > v_cible then
    v_surplus := v_total - v_cible;
    with a_retirer as (
      select id from lots_stock
       where lot_id = p_lot_id and coalesce(utilise, false) = false and attribue_a is null
       order by numero desc nulls last, created_at desc nulls last
       limit v_surplus
    )
    delete from lots_stock s using a_retirer r where s.id = r.id;
    get diagnostics v_retires = row_count;
  end if;

  return jsonb_build_object('ok', true, 'cible', v_cible,
    'emis', (select count(*) from lots_stock where lot_id = p_lot_id),
    'ajoutes', v_ajoutes, 'retires', v_retires,
    'bloques', greatest((select count(*) from lots_stock where lot_id = p_lot_id) - v_cible, 0));
end; $function$;

-- Appel depuis l'interface (bouton « Émettre / mettre à jour les tickets »).
create or replace function public.emettre_tickets_lot(p_lot_id text)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
begin
  if not peut_gerer_lot(p_lot_id) then return jsonb_build_object('ok', false, 'raison', 'non_autorise'); end if;
  return synchroniser_tickets_lot(p_lot_id);
end; $function$;

-- Réapprovisionner (+n) ou retirer (−n) : passe par la quantité du lot pour
-- que quantité et tickets restent toujours alignés.
create or replace function public.ajuster_quantite_lot(p_lot_id text, p_delta int)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
declare v_q int; v_bloques int; v_res jsonb;
begin
  if not peut_gerer_lot(p_lot_id) then return jsonb_build_object('ok', false, 'raison', 'non_autorise'); end if;
  select coalesce(quantite, 1) into v_q from lots where id = p_lot_id for update;
  if not found then return jsonb_build_object('ok', false, 'raison', 'lot_introuvable'); end if;
  -- Jamais sous le nombre de tickets déjà attribués ou remis.
  select count(*) into v_bloques from lots_stock
   where lot_id = p_lot_id and (coalesce(utilise, false) or attribue_a is not null);
  update lots set quantite = greatest(v_q + p_delta, v_bloques, 0), updated_at = now() where id = p_lot_id;
  v_res := synchroniser_tickets_lot(p_lot_id);
  return v_res || jsonb_build_object('quantite', greatest(v_q + p_delta, v_bloques, 0));
end; $function$;

-- Supprimer UN ticket : refusé s'il est attribué ou remis. La quantité du lot
-- baisse d'autant, sinon la prochaine synchronisation le recréerait.
create or replace function public.supprimer_ticket_lot(p_ticket_id text)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
declare t record;
begin
  select id, lot_id, utilise, attribue_a into t from lots_stock where id = p_ticket_id for update;
  if not found then return jsonb_build_object('ok', false, 'raison', 'introuvable'); end if;
  if t.lot_id is null or not peut_gerer_lot(t.lot_id) then return jsonb_build_object('ok', false, 'raison', 'non_autorise'); end if;
  if coalesce(t.utilise, false) then return jsonb_build_object('ok', false, 'raison', 'remis'); end if;
  if t.attribue_a is not null then return jsonb_build_object('ok', false, 'raison', 'attribue'); end if;
  perform 1 from lots where id = t.lot_id for update;
  delete from lots_stock where id = p_ticket_id;
  update lots set quantite = greatest(coalesce(quantite, 1) - 1, 0), updated_at = now() where id = t.lot_id;
  return jsonb_build_object('ok', true);
end; $function$;

-- Création / changement de quantité d'un lot -> émission automatique.
create or replace function public.lots_emettre_tickets_trg()
returns trigger
language plpgsql security definer
set search_path to 'public'
as $function$
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if tg_op = 'INSERT' or new.quantite is distinct from old.quantite then
    perform synchroniser_tickets_lot(new.id);
  end if;
  return new;
end; $function$;

drop trigger if exists lots_emettre_tickets on public.lots;
create trigger lots_emettre_tickets
  after insert or update of quantite on public.lots
  for each row execute function public.lots_emettre_tickets_trg();

revoke all on function public.synchroniser_tickets_lot(text) from public, anon, authenticated;
grant execute on function public.peut_gerer_lot(text) to anon, authenticated;
grant execute on function public.emettre_tickets_lot(text) to anon, authenticated;
grant execute on function public.ajuster_quantite_lot(text, int) to anon, authenticated;
grant execute on function public.supprimer_ticket_lot(text) to anon, authenticated;

notify pgrst, 'reload schema';
