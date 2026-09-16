-- P4 (16/09 soir) : UN SEUL BILLET pour toutes les operations.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- nds/billets-partenaires.html (billet de reference NDS 2026) sert desormais a
-- toute operation : billet_par_token renvoie l operation (nom, logo), le logo
-- du commerce, et resout le commerce et les conditions comme consulter_lot
-- (partenaire_du_tirage / lot_du_tirage). Un gain d event autonome est
-- nominatif d emblee (pas d appel SA).
create or replace function public.billet_par_token(p_token text)
returns jsonb
language plpgsql stable security definer
set search_path to 'public'
as $function$
declare t record; v_pt text; v_lot text; p record; l record; op_nom text; op_logo text; v_conf boolean;
begin
  select * into t from tirages where retrait_token = p_token;
  if not found then return null; end if;
  v_pt := partenaire_du_tirage(t.id);
  v_lot := lot_du_tirage(t.id);
  select nom, adresse, ville, tel, image_url, lots into p from partenaires where id = v_pt;
  select conditions into l from lots where id = v_lot;
  if t.super_event_id is not null then
    select nom, logo_url into op_nom, op_logo from super_events where id = t.super_event_id;
  elsif t.event_id is not null then
    select nom, cfg->>'logoUrl' into op_nom, op_logo from events where id = t.event_id;
  end if;
  v_conf := t.notifie_at is not null or t.super_event_id is null;
  return jsonb_build_object(
    'tirage_id', t.id,
    'partenaire_id', v_pt,
    'joueur_nom', case when v_conf then t.joueur_nom end,
    'joueur_email', case when v_conf then t.joueur_email end,
    'lot_nom', t.lot_nom,
    'lot_valeur', t.lot_valeur,
    'ticket_code', t.ticket_code,
    'retrait_token', t.retrait_token,
    'notifie_at', t.notifie_at,
    'retire_at', t.retire_at,
    'etat', case when t.retire_at is not null then 'retire' when v_conf then 'confirme' else 'a_confirmer' end,
    'partenaire_nom', p.nom,
    'partenaire_adresse', nullif(btrim(concat_ws(', ', p.adresse, p.ville)), ''),
    'partenaire_tel', p.tel,
    'partenaire_logo', p.image_url,
    'conditions', coalesce(nullif(btrim(l.conditions), ''),
      (select x->>'conditions' from jsonb_array_elements(case when jsonb_typeof(p.lots) = 'array' then p.lots else '[]'::jsonb end) x
        where x->>'conditions' is not null and (x->>'nom' = t.lot_nom or x->>'titre' = t.lot_nom) limit 1)),
    'operation', coalesce(t.super_event_id, t.event_id),
    'operation_nom', op_nom,
    'operation_logo', op_logo);
end; $function$;
grant execute on function public.billet_par_token(text) to public, anon, authenticated;
notify pgrst, 'reload schema';
