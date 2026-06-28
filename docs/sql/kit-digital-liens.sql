-- Kit digital partenaire — fondation DB (mission C, mécanique tranchée = A)
-- Appliquée le 2026-06-28 sur le projet ywcqtupgoxfzkddqkztk via MCP.
-- Mécanique : lien digital = jeton USAGE UNIQUE non-station (mail/WhatsApp) ;
--             QR sur site = usage RÉGULIER (trafic boutique).
-- Sécurité : RLS verrouillée (pas de policy anon -> deny) ; fonctions SECURITY DEFINER
--            REVOKE anon/authenticated (non appelables publiquement = anti-triche).
-- RESTE À CADRER avec Romain (NE PAS INVENTER) :
--   * cadence de minting des liens 'unique' (1 token par envoi ? lot pré-généré ?)
--   * wiring front : où/quand consommer_lien() est appelé dans le parcours
--   * hook "création pro participant" -> génération auto du kit
--   * modèle de grant pour exposer consommer_lien() côté front (anon vs service role)

create table if not exists public.liens (
  id uuid primary key default gen_random_uuid(),
  partenaire_id text references public.partenaires(id) on delete cascade,
  type text not null check (type in ('unique','regulier')),
  token text not null unique,
  source text,
  event_id text,
  used_at timestamptz,
  usage_count integer not null default 0,
  max_usage integer,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_liens_partenaire on public.liens(partenaire_id);
create index if not exists idx_liens_token on public.liens(token);
alter table public.liens enable row level security;

comment on table public.liens is 'Kit digital partenaire : liens de jeu. type=unique (jeton usage unique non-station) ou regulier (QR site illimite). Consommation via consommer_lien() server-side. Wiring front + cadence minting = A CADRER (ne pas inventer).';

-- Primitive : générer un lien (token aléatoire). Renvoie le token.
create or replace function public.generer_lien(
  p_partenaire_id text, p_type text,
  p_source text default null, p_event_id text default null, p_max_usage integer default null
) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text; v_max integer;
begin
  if p_type not in ('unique','regulier') then raise exception 'type invalide: %', p_type; end if;
  v_max := coalesce(p_max_usage, case when p_type='unique' then 1 else null end);
  v_token := substr(replace(gen_random_uuid()::text,'-',''),1,20);
  insert into public.liens(partenaire_id, type, token, source, event_id, max_usage)
  values (p_partenaire_id, p_type, v_token, p_source, p_event_id, v_max);
  return v_token;
end; $$;

-- Primitive : consommer un lien. 'unique' = 1 seule fois ; 'regulier' = illimité.
create or replace function public.consommer_lien(
  p_token text, p_source text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.liens%rowtype;
begin
  select * into r from public.liens where token = p_token for update;
  if not found then return jsonb_build_object('ok', false, 'raison', 'introuvable'); end if;
  if not r.actif then return jsonb_build_object('ok', false, 'raison', 'inactif', 'type', r.type); end if;
  if r.type = 'unique' and r.usage_count >= coalesce(r.max_usage, 1) then
    return jsonb_build_object('ok', false, 'raison', 'deja_consomme', 'type', r.type);
  end if;
  update public.liens
     set usage_count = usage_count + 1, used_at = now(),
         source = coalesce(source, p_source),
         actif = case when type = 'unique' and usage_count + 1 >= coalesce(max_usage, 1) then false else actif end
   where id = r.id;
  return jsonb_build_object('ok', true, 'type', r.type, 'partenaire_id', r.partenaire_id, 'event_id', r.event_id);
end; $$;

revoke execute on function public.generer_lien(text,text,text,text,integer) from public, anon, authenticated;
revoke execute on function public.consommer_lien(text,text) from public, anon, authenticated;
