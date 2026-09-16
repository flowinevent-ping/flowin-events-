-- Lot 1 (suite) : une demande approuvee garde la station qu elle a creee ;
-- Statuts autorises par la contrainte : en_attente / validee / refusee (l ecran SA ecrivait
-- approuve / refuse, refuses par la base : Approuver et Refuser echouaient).
-- un annonceur est rattache sans station.
alter table demandes_rattachement_super_event add column if not exists event_id text;

create or replace function public.approuver_demande_rattachement(p_id bigint)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  d record; s record; p record;
  v_ev text; v_module text; v_cfg jsonb; v_pt text; v_n int := 0;
begin
  select * into d from demandes_rattachement_super_event where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'erreur', 'demande introuvable'); end if;
  if d.statut = 'validee' then return jsonb_build_object('ok', false, 'erreur', 'demande deja approuvee'); end if;
  select * into s from super_events where id = d.super_event_id;
  if not found then return jsonb_build_object('ok', false, 'erreur', 'super event introuvable'); end if;
  select * into p from pros where id = d.pro_id;
  if not found then return jsonb_build_object('ok', false, 'erreur', 'pro introuvable'); end if;

  v_pt := assurer_fiche_commerce(p.id);

  -- Un annonceur / sponsor ne tient pas de station : il rejoint l operation sans
  -- apparaitre sur la carte.
  if coalesce(d.persona, 'commerce') = 'annonceur' then
    update super_events
       set pros = case when p.id = any(coalesce(pros, '{}')) then pros else array_append(coalesce(pros, '{}'), p.id) end
     where id = s.id;
    update demandes_rattachement_super_event set statut = 'validee', traite_at = now() where id = d.id;
    return jsonb_build_object('ok', true, 'event_id', null, 'lots', 0);
  end if;

  v_module := coalesce(s.module, 'nds2026');
  v_ev := regexp_replace(s.id, '^se-', 'ev-') || '-' || regexp_replace(p.id, '^pro-', '') || '-'
          || substr(md5(random()::text), 1, 4);
  v_cfg := coalesce(s.cfg_jeu, '{}'::jsonb)
           || jsonb_build_object('qrUrl', 'https://flowin-events.vercel.app/parcours/' || v_module || '?ev=' || v_ev)
           || case when s.logo_url is not null then jsonb_build_object('logoUrl', s.logo_url) else '{}'::jsonb end;

  insert into events (id, pro_id, nom, module, status, super_event_id, date_d, date_f,
                      lat, lng, adresse, categorie, cfg, participants, gagnants, joueurs_optin, gain_ticket)
  values (v_ev, p.id, coalesce(nullif(btrim(d.nom_commerce), ''), p.nom), v_module, 'upcoming', s.id,
          coalesce(d.date_debut_souhaite, s.date_d), coalesce(d.date_fin_souhaite, s.date_f),
          d.lat, d.lng,
          nullif(btrim(concat_ws(', ', d.adresse, nullif(btrim(concat_ws(' ', d.code_postal, d.ville)), ''))), ''),
          d.categorie, v_cfg, 0, 0, 0, true);

  insert into lots (id, event_id, partenaire_id, titre, nom, quantite, valeur, valeur_euros, conditions, note)
  select 'lot-' || v_ev || '-' || l.rang, v_ev, v_pt,
         coalesce(nullif(btrim(l.v->>'titre'), ''), 'Lot'), coalesce(nullif(btrim(l.v->>'titre'), ''), 'Lot'),
         coalesce(nullif(l.v->>'quantite', '')::int, 1),
         coalesce(nullif(l.v->>'valeur_euros', '')::numeric, 0), nullif(l.v->>'valeur_euros', '')::numeric,
         nullif(btrim(l.v->>'conditions'), ''), 'Type : tirage au sort'
  from jsonb_array_elements(case when jsonb_typeof(d.lots) = 'array' then d.lots else '[]'::jsonb end) with ordinality as l(v, rang)
  where coalesce(btrim(l.v->>'titre'), '') <> '';
  get diagnostics v_n = row_count;

  update super_events
     set events = case when v_ev = any(coalesce(events, '{}')) then events else array_append(coalesce(events, '{}'), v_ev) end,
         pros = case when p.id = any(coalesce(pros, '{}')) then pros else array_append(coalesce(pros, '{}'), p.id) end
   where id = s.id;

  update pros set
    adresse = coalesce(nullif(adresse, ''), d.adresse),
    code_postal = coalesce(nullif(code_postal, ''), d.code_postal),
    ville = coalesce(nullif(ville, ''), d.ville)
   where id = p.id;

  update demandes_rattachement_super_event set statut = 'validee', traite_at = now(), event_id = v_ev where id = d.id;

  return jsonb_build_object('ok', true, 'event_id', v_ev, 'lots', v_n);
end;
$function$;
grant execute on function public.approuver_demande_rattachement(bigint) to public, anon, authenticated;

notify pgrst, 'reload schema';
