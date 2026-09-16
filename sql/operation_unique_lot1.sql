-- LOT 1 — PERTES DE DONNEES (referentiel 16/09 : requetes 24, 25, 26, 29, 43).
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- 25  Le jeu est choisi par le createur du super event : super_events.module
--     et super_events.cfg_jeu, herites par chaque station.
--     super_events.pro_id : le pro createur (festival, asso, franchise).
-- 24/26  La validation d une demande cree DIRECTEMENT la station avec tout ce
--     que le pro a saisi (nom du commerce, adresse, GPS, lots) :
--     approuver_demande_rattachement(). demandes.nom_commerce ajoute.
-- 29  Les lots d une station de super event vivent dans la table `lots`,
--     comme ceux d un event : partenaires.lots (engagements NDS, 59 lots) est
--     recopie dans `lots` sur la station du commerce. partenaires.lots est
--     conserve pour les lectures existantes (billet, tirage).
-- 11  Chaque pro a une fiche commerce (PIN partenaires.code_pin, seule colonne
--     PIN) : assurer_fiche_commerce(), appliquee aux 7 pros qui n en ont pas.
-- 35  tirages.event_id renseigne pour les tirages de super event existants,
--     a partir de la station du commerce (partenaires.event_id).

alter table super_events add column if not exists module text;
alter table super_events add column if not exists cfg_jeu jsonb;
alter table super_events add column if not exists pro_id text;
comment on column super_events.module is 'Jeu impose a toutes les stations du super event (choisi par le createur).';
comment on column super_events.cfg_jeu is 'Contenu du jeu (banques, nombre de questions...) herite par chaque station.';
comment on column super_events.pro_id is 'Pro createur du super event (null = cree par le SA).';

update super_events s set module = x.m
  from (select super_event_id, (array_agg(module order by n desc))[1] m
          from (select super_event_id, module, count(*) n from events where super_event_id is not null group by 1,2) c
         group by super_event_id) x
 where x.super_event_id = s.id and s.module is null;

alter table demandes_rattachement_super_event add column if not exists nom_commerce text;

-- 35
update tirages t set event_id = p.event_id
  from partenaires p
 where t.event_id is null and t.partenaire_id = p.id and p.event_id is not null
   and exists (select 1 from events e where e.id = p.event_id and e.super_event_id = t.super_event_id);

-- 29
insert into lots (id, event_id, partenaire_id, titre, nom, quantite, valeur, valeur_euros, conditions, emoji)
select coalesce(nullif(l.v->>'id', ''), 'lot-' || p.event_id || '-' || l.rang),
       p.event_id, p.id,
       coalesce(nullif(l.v->>'titre', ''), nullif(l.v->>'nom', ''), 'Lot'),
       coalesce(nullif(l.v->>'nom', ''), nullif(l.v->>'titre', ''), 'Lot'),
       coalesce(nullif(l.v->>'quantite', '')::int, nullif(l.v->>'nb', '')::int, nullif(l.v->>'gagnants', '')::int, 1),
       coalesce(nullif(replace(regexp_replace(coalesce(l.v->>'valeur_euros', l.v->>'valeur', ''), '[^0-9.,]', '', 'g'), ',', '.'), '')::numeric, 0),
       nullif(replace(regexp_replace(coalesce(l.v->>'valeur_euros', l.v->>'valeur', ''), '[^0-9.,]', '', 'g'), ',', '.'), '')::numeric,
       nullif(btrim(l.v->>'conditions'), ''),
       coalesce(nullif(l.v->>'emoji', ''), '🎁')
from partenaires p
cross join lateral jsonb_array_elements(case when jsonb_typeof(p.lots) = 'array' then p.lots else '[]'::jsonb end) with ordinality as l(v, rang)
where p.event_id is not null and exists (select 1 from events e where e.id = p.event_id)
on conflict (id) do update set
  event_id = excluded.event_id, partenaire_id = excluded.partenaire_id,
  titre = excluded.titre, nom = excluded.nom, quantite = excluded.quantite,
  valeur = excluded.valeur, valeur_euros = excluded.valeur_euros,
  conditions = coalesce(excluded.conditions, lots.conditions), updated_at = now();

-- 11
create or replace function public.assurer_fiche_commerce(p_pro_id text)
returns text
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  v_pro record;
  v_pt text;
begin
  select * into v_pro from pros where id = p_pro_id;
  if not found then return null; end if;
  if v_pro.partenaire_id is not null then return v_pro.partenaire_id; end if;
  v_pt := 'pt-' || regexp_replace(v_pro.id, '^pro-', '');
  if not exists (select 1 from partenaires where id = v_pt) then
    insert into partenaires (id, nom, adresse, ville, code_postal, email, tel, contact, siret,
                             actif, visible, type, code_pin, created_at)
    values (v_pt, v_pro.nom, v_pro.adresse, v_pro.ville, v_pro.code_postal, v_pro.email, v_pro.tel,
            v_pro.contact, v_pro.siret, true, false, 'Local',
            lpad((floor(random() * 10000))::int::text, 4, '0'), now());
  elsif exists (select 1 from pros where partenaire_id = v_pt) then
    return null;
  end if;
  update pros set partenaire_id = v_pt where id = v_pro.id;
  return v_pt;
end;
$function$;
grant execute on function public.assurer_fiche_commerce(text) to public, anon, authenticated;

select public.assurer_fiche_commerce(id) from pros where partenaire_id is null;

-- 24 / 26
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
  if d.statut = 'approuve' then return jsonb_build_object('ok', false, 'erreur', 'demande deja approuvee'); end if;
  select * into s from super_events where id = d.super_event_id;
  if not found then return jsonb_build_object('ok', false, 'erreur', 'super event introuvable'); end if;
  select * into p from pros where id = d.pro_id;
  if not found then return jsonb_build_object('ok', false, 'erreur', 'pro introuvable'); end if;

  v_pt := assurer_fiche_commerce(p.id);
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

  update demandes_rattachement_super_event set statut = 'approuve', traite_at = now() where id = d.id;

  return jsonb_build_object('ok', true, 'event_id', v_ev, 'lots', v_n);
end;
$function$;
grant execute on function public.approuver_demande_rattachement(bigint) to public, anon, authenticated;

notify pgrst, 'reload schema';
