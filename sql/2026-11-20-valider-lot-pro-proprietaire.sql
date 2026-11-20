-- 20/11/2026 — E2E prod : un pro inscrit via « Ma première fois » n'a ni ligne `partenaires` ni code PIN
-- (pros.partenaire_id = null). Son lot gagné ne peut donc JAMAIS etre valide : valider_lot repond
-- « pin_requis / Code professionnel requis » (aucun PIN n'existe a saisir).
-- Correctif : le pro PROPRIETAIRE de l'animation (session pro : auth.uid() -> pros.auth_id -> events.pro_id)
-- valide sans PIN. Le PIN reste exige pour toute autre personne (anon / lien du billet).
-- Necessite lot.html >= 20/11 (envoie le jeton de session pro quand il existe).
-- A APPLIQUER par Romain (non applique par l'agent). Rollback : rejouer la definition precedente
-- (sql/2026-11-18-tirage-correctifs.sql / definition en base avant ce fichier, voir pg_get_functiondef).

create or replace function public.valider_lot(p_token text, p_pin text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare v_id bigint; v_pt text; v_lim date; v_du date; v_ev text;
begin
  select id, valable_jusqu_au, event_id into v_id, v_lim, v_ev from tirages where retrait_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'raison', 'introuvable'); end if;
  if not public.est_super_admin() and not (v_ev is not null and public.qr_est_proprietaire(v_ev)) then
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
