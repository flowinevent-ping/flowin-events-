-- LOT 3 — referentiel 11 et 43 : le billet (lot.html) parle de SON operation.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- 11  Le commerce d un gain se resout aussi depuis l event (pro de l event ->
--     sa fiche commerce) quand le tirage n en porte pas : le PIN
--     (partenaires.code_pin, seule colonne PIN) s applique a tout pro.
--     consulter_lot renvoie le nom, le logo et la date de fin de l operation,
--     et les conditions du lot lues dans la table `lots` (repli : partenaires.lots).
-- 43  valider_lot decompte le stock DU LOT (lots_stock.lot_id) avant celui du
--     commerce ; l avertissement « aucune unite de stock » ne sort que si ce lot
--     ou ce commerce est gere en stock.

create or replace function public.partenaire_du_tirage(p_tirage_id bigint)
returns text
language sql stable security definer
set search_path to 'public'
as $function$
  select coalesce(t.partenaire_id,
                  (select pr.partenaire_id from events e join pros pr on pr.id = e.pro_id where e.id = t.event_id))
    from tirages t where t.id = p_tirage_id;
$function$;

create or replace function public.lot_du_tirage(p_tirage_id bigint)
returns text
language sql stable security definer
set search_path to 'public'
as $function$
  select l.id from tirages t
    join lots l on lower(btrim(coalesce(l.titre, l.nom))) = lower(btrim(t.lot_nom))
   where t.id = p_tirage_id
     and (l.event_id = t.event_id
          or (t.event_id is null and l.partenaire_id = t.partenaire_id))
   order by (l.event_id = t.event_id) desc nulls last
   limit 1;
$function$;

create or replace function public.consulter_lot(p_token text)
returns jsonb
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v record; v_pt text; v_lot text; p record; l record; op_nom text; op_fin date; op_logo text;
begin
  select * into v from tirages where retrait_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'raison', 'introuvable'); end if;

  v_pt := partenaire_du_tirage(v.id);
  v_lot := lot_du_tirage(v.id);
  select nom, adresse, ville, tel, image_url, lots into p from partenaires where id = v_pt;
  select conditions into l from lots where id = v_lot;

  if v.super_event_id is not null then
    select nom, date_f, logo_url into op_nom, op_fin, op_logo from super_events where id = v.super_event_id;
  elsif v.event_id is not null then
    select nom, date_f, cfg->>'logoUrl' into op_nom, op_fin, op_logo from events where id = v.event_id;
  end if;

  return jsonb_build_object('ok', true,
    'raison', case when v.retire_at is not null then 'deja_utilise' else 'valable' end,
    'ticket_code', v.ticket_code,
    -- Le nom n est expose qu une fois le gagnant confirme (billet nominatif a l envoi).
    -- Un gain d event autonome (tirage du pro ou gain immediat) est nominatif d emblee.
    'gagnant', case when v.notifie_at is not null or v.super_event_id is null then v.joueur_nom else null end,
    'etat', case when v.retire_at is not null then 'retire'
                 when v.notifie_at is not null or v.super_event_id is null then 'confirme'
                 else 'a_confirmer' end,
    'lot', v.lot_nom, 'valeur', v.lot_valeur, 'partenaire', v_pt,
    'retire_at', v.retire_at,
    'partenaire_nom', p.nom,
    'partenaire_adresse', nullif(btrim(concat_ws(', ', p.adresse, p.ville)), ''),
    'partenaire_tel', p.tel,
    'partenaire_logo', p.image_url,
    'conditions', coalesce(nullif(btrim(l.conditions), ''),
      (select x->>'conditions' from jsonb_array_elements(case when jsonb_typeof(p.lots) = 'array' then p.lots else '[]'::jsonb end) x
        where x->>'conditions' is not null and (x->>'nom' = v.lot_nom or x->>'titre' = v.lot_nom) limit 1)),
    'operation', coalesce(v.super_event_id, v.event_id),
    'operation_nom', op_nom,
    'operation_fin', op_fin,
    'operation_logo', op_logo);
end; $function$;

create or replace function public.verifier_pin_pro(p_token text, p_pin text)
returns boolean
language sql security definer
set search_path to 'public'
as $function$
  select case
    when partenaire_du_tirage(t.id) is null then true
    else exists (select 1 from partenaires pa
                  where pa.id = partenaire_du_tirage(t.id) and pa.code_pin = btrim(p_pin))
  end
  from tirages t
  where t.retrait_token = p_token;
$function$;

create or replace function public.valider_lot(p_token text, p_pin text default null)
returns jsonb
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v record; v_pt text; v_lot text; v_stock_id text; v_reste int; v_gere boolean;
begin
  select * into v from tirages where retrait_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'raison', 'introuvable'); end if;

  v_pt := partenaire_du_tirage(v.id);
  v_lot := lot_du_tirage(v.id);

  if v.retire_at is not null then
    return jsonb_build_object('ok', false, 'raison', 'deja_utilise', 'retire_at', v.retire_at,
      'ticket_code', v.ticket_code, 'gagnant', v.joueur_nom, 'lot', v.lot_nom, 'partenaire', v_pt);
  end if;

  if p_pin is not null and length(btrim(p_pin)) > 0 then
    if upper(btrim(p_pin)) <> upper(btrim(coalesce(v.ticket_code,'')))
       and upper(btrim(p_pin)) <> upper(right(btrim(coalesce(v.ticket_code,'')), 4)) then
      return jsonb_build_object('ok', false, 'raison', 'pin_invalide',
        'message', 'Numero de billet incorrect. Verifiez le n° dans votre liste de gagnants.');
    end if;
  end if;

  -- Stock : d abord les unites DU LOT, sinon celles du commerce (engagements NDS).
  if v_lot is not null and exists (select 1 from lots_stock where lot_id = v_lot) then
    v_gere := true;
    select id::text into v_stock_id from lots_stock
     where lot_id = v_lot and coalesce(utilise, false) = false
     order by created_at nulls last, id limit 1 for update skip locked;
    update tirages set retire_at = now(), statut = 'retire' where retrait_token = p_token and retire_at is null;
    if v_stock_id is not null then
      update lots_stock set utilise = true, utilise_at = now(), attribue_a = v.ticket_code, statut = 'utilise'
       where id::text = v_stock_id;
    end if;
    select count(*) into v_reste from lots_stock where lot_id = v_lot and coalesce(utilise, false) = false;
  else
    v_gere := v_pt is not null and exists (select 1 from lots_stock where partenaire = v_pt);
    if v_gere then
      select id::text into v_stock_id from lots_stock
       where partenaire = v_pt and coalesce(utilise, false) = false
       order by created_at nulls last, id limit 1 for update skip locked;
    end if;
    update tirages set retire_at = now(), statut = 'retire' where retrait_token = p_token and retire_at is null;
    if v_stock_id is not null then
      update lots_stock set utilise = true, utilise_at = now(), attribue_a = v.ticket_code, statut = 'utilise'
       where id::text = v_stock_id;
    end if;
    if v_gere then
      select count(*) into v_reste from lots_stock where partenaire = v_pt and coalesce(utilise, false) = false;
    end if;
  end if;

  return jsonb_build_object('ok', true, 'raison', 'valide',
    'ticket_code', v.ticket_code, 'gagnant', v.joueur_nom, 'lot', v.lot_nom,
    'valeur', v.lot_valeur, 'partenaire', v_pt, 'retire_at', now(),
    'destocke', (v_stock_id is not null),
    'stock_restant', v_reste,
    'avertissement', case when v_gere and v_stock_id is null
      then 'Lot valide, mais aucune unite de stock disponible pour ce lot.' else null end);
end; $function$;

grant execute on function public.partenaire_du_tirage(bigint) to public, anon, authenticated;
grant execute on function public.lot_du_tirage(bigint) to public, anon, authenticated;
grant execute on function public.consulter_lot(text) to public, anon, authenticated;
grant execute on function public.verifier_pin_pro(text, text) to public, anon, authenticated;
grant execute on function public.valider_lot(text, text) to public, anon, authenticated;

notify pgrst, 'reload schema';
