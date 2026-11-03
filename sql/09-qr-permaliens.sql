-- ============================================================================
-- 09 — QR PERMANENTS (« permaliens ») : un QR imprime ne change plus jamais  [01/11/2026]
-- ============================================================================
-- NON APPLIQUE EN BASE. A lancer a la main, DANS L'ORDRE de la chaine, apres :
--   01-identite-super-admin.sql                  (est_super_admin())
--   2026-11-01-tirage-auto-liste-gagnants.sql    sections 1 et 2 au minimum (qr_stations + index de regles)
-- Idempotent : peut etre rejoue sans dommage.
--
-- DEMANDE DE ROMAIN : garder le MEME QR physique et CHANGER de quiz / de jeu derriere,
-- sans reimprimer.
--
-- PRINCIPE
--   Le QR n'encode plus jamais le jeu. Il encode  https://<domaine>/q/<code>  ou <code> est
--   un code court ALEATOIRE (12 caracteres, non devinable) attache a UNE station :
--   la ligne qr_stations (event_id, source_qr). Le serveur (route /q/<code>, redirection 302)
--   lit alors le jeu ACTUEL de l'animation (events.module + events.cfg.master) et envoie
--   le joueur au bon parcours. Changer de jeu = changer events.module / cfg.master : le QR
--   imprime reste valable.
--
-- CE QUE CE FICHIER AJOUTE
--   1. qr_stations.code_court (unique, >= 8 caracteres, genere en base, jamais modifiable)
--      + remplissage des QR existants.
--   2. Garde-fous : event_id / source_qr / code_court d'un QR ne se modifient pas ;
--      un QR « digital » (type_qr) doit avoir un slug reseaux-* et inversement (CHECK NOT VALID :
--      verifie les nouveaux QR, ne casse pas l'existant).
--   3. qr_assurer_defauts(event) : cree (sans doublon) les 3 QR par defaut d'une animation,
--      pour qu'ils aient eux aussi un code permanent.
--   4. qr_jeu_journal : journal des changements de jeu (qui, quand, avant, apres).
--   5. Verrou : seul le pro PROPRIETAIRE de l'animation ou le Super Admin peut changer
--      le jeu (events.module ou events.cfg.master.id) ; chaque changement est journalise
--      par trigger, quel que soit le chemin (ecran, URL directe, appel API).
--   6. changer_jeu_station(event, jeu) : le SEUL point d'entree prevu pour changer de jeu :
--      change module ET cfg.master.id ensemble (jamais l'un sans l'autre).
--
-- CE QUI NE CHANGE PAS (et pourquoi les regles restent justes)
--   * Regles par QR : elles sont cles sur (joueur, animation, source_qr), jamais sur le jeu.
--     Digital (reseaux-*) = 1 fois par compte ; physique = 1 partie par jour et par QR.
--     Changer de jeu ne remet donc aucun compteur a zero : un joueur qui a joue le matin
--     a la roue ne rejoue pas l'apres-midi au quiz sur le meme QR.
--   * Statistiques par QR (stats_qr_evenement) : cles sur source_qr ; l'historique reste
--     rattache a la station apres un changement de jeu. Le journal (qr_jeu_journal) donne
--     la date de chaque changement pour decouper une periode « avant / apres ».
--   * Les anciens QR imprimes (/parcours/<jeu>?ev=...&source=...) continuent de marcher.
--
-- MODE DEGRADE : tant que ce fichier n'est pas applique, le code ne trouve pas la colonne
-- code_court : les QR sont produits au format ancien (avec le jeu dans l'URL), avec un
-- avertissement visible « ce QR changera si vous changez de jeu ».
-- ============================================================================

-- 1. CODE COURT -------------------------------------------------------------

-- Code aleatoire : 12 caracteres hexadecimaux issus de gen_random_uuid() (aleatoire
-- cryptographique, 48 bits). Pas d'incrementation, pas de lien avec le nom ou l'id.
-- La boucle ecarte la (tres improbable) collision.
create or replace function public.qr_code_aleatoire()
returns text
language plpgsql
volatile
as $$
declare c text;
begin
  loop
    c := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    exit when not exists (select 1 from public.qr_stations q where q.code_court = c);
  end loop;
  return c;
end;
$$;

alter table public.qr_stations add column if not exists code_court text;
update public.qr_stations set code_court = public.qr_code_aleatoire() where code_court is null;
alter table public.qr_stations alter column code_court set default public.qr_code_aleatoire();
alter table public.qr_stations alter column code_court set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'qr_stations_code_court_format') then
    alter table public.qr_stations
      add constraint qr_stations_code_court_format check (code_court ~ '^[a-z0-9]{8,32}$');
  end if;
end $$;
create unique index if not exists uniq_qr_stations_code_court on public.qr_stations (code_court);

-- Un slug par animation (meme garde-fou que le fichier 2026-11-01, rejoue ici pour ne pas
-- dependre de l'ordre) : deux QR d'une meme animation ne peuvent pas porter le meme slug.
do $$
begin
  if exists (select 1 from public.qr_stations group by event_id, source_qr having count(*) > 1) then
    raise notice 'qr_stations : doublons (event_id, source_qr) presents, index unique NON cree. A dedoublonner puis rejouer.';
  else
    create unique index if not exists uniq_qr_stations_event_source on public.qr_stations (event_id, source_qr);
  end if;
end $$;

-- 2. GARDE-FOUS --------------------------------------------------------------

-- Un QR digital a un slug reseaux-*, un QR physique n'en a pas. NOT VALID : controle les
-- nouvelles lignes seulement (les QR deja en base ne bloquent pas l'application du fichier).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'qr_stations_type_slug_coherent') then
    alter table public.qr_stations
      add constraint qr_stations_type_slug_coherent
      check (type_qr is null or ((type_qr = 'digital') = (source_qr like 'reseaux-%'))) not valid;
  end if;
end $$;

-- Ce qui identifie un QR imprime ne se modifie jamais (sinon un QR deja colle pourrait
-- changer de commerce ou de slug sans que personne ne le voie). Pour « changer » un QR :
-- le masquer (publie = false) et en creer un autre. Le SQL editor / service_role gardent la main.
create or replace function public.qr_stations_immuable()
returns trigger
language plpgsql
as $$
begin
  if coalesce(nullif(current_setting('role', true), ''), 'none') in ('anon', 'authenticated')
     and (new.event_id is distinct from old.event_id
          or new.source_qr is distinct from old.source_qr
          or new.code_court is distinct from old.code_court) then
    raise exception 'Un QR ne peut pas changer d''animation, de slug ni de code : masquez-le et créez-en un autre.'
      using errcode = '42501', hint = 'qr_immuable';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_qr_stations_immuable on public.qr_stations;
create trigger trg_qr_stations_immuable before update on public.qr_stations
  for each row execute function public.qr_stations_immuable();

-- 3. QR PAR DEFAUT D'UNE ANIMATION --------------------------------------------
-- Les 3 QR donnes a la creation (magasin, reseaux-instagram, tracking) n'etaient pas
-- stockes : ils n'avaient donc pas de code. Cette fonction les cree, sans doublon.
create or replace function public.qr_assurer_defauts(p_event_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.events e where e.id = p_event_id) then return; end if;
  insert into public.qr_stations (event_id, nom, source_qr, publie, support, type_qr) values
    (p_event_id, 'En magasin',       'magasin',           true, 'Entrée / vitrine',   'physique'),
    (p_event_id, 'Réseaux sociaux',  'reseaux-instagram', true, 'Instagram',          'digital'),
    (p_event_id, 'Tracking',         'tracking',          true, 'Support publicitaire','physique')
  on conflict (event_id, source_qr) do nothing;
end;
$$;
grant execute on function public.qr_assurer_defauts(text) to anon, authenticated, service_role;

-- 4. JOURNAL DES CHANGEMENTS DE JEU --------------------------------------------
create table if not exists public.qr_jeu_journal (
  id        bigint generated always as identity primary key,
  event_id  text        not null,
  avant     jsonb       not null,   -- { module, master } AVANT (master = cfg.master complet, pour pouvoir revenir en arriere)
  apres     jsonb       not null,   -- { module, master } APRES
  par       uuid,                   -- auth.uid() (null = SQL editor / service)
  par_email text,
  par_role  text,                   -- super_admin | proprietaire | service
  le        timestamptz not null default now()
);
create index if not exists qr_jeu_journal_event_idx on public.qr_jeu_journal (event_id, le desc);
alter table public.qr_jeu_journal enable row level security;
revoke all on public.qr_jeu_journal from anon, authenticated;
grant select on public.qr_jeu_journal to authenticated;
grant all on public.qr_jeu_journal to service_role;
-- Proprietaire de l'animation = le pro (pros.auth_id) qui porte events.pro_id. security definer :
-- la verification ne depend pas des regles de lecture des tables events / pros.
create or replace function public.qr_est_proprietaire(p_event text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.events e join public.pros p on p.id = e.pro_id
     where e.id = p_event and p.auth_id = auth.uid());
$$;
grant execute on function public.qr_est_proprietaire(text) to anon, authenticated, service_role;

drop policy if exists qr_jeu_journal_lecture on public.qr_jeu_journal;
create policy qr_jeu_journal_lecture on public.qr_jeu_journal for select to authenticated using (
  public.est_super_admin() or public.qr_est_proprietaire(event_id)
);

-- 5. VERROU + JOURNAL -----------------------------------------------------------
-- Jeux que l'on peut mettre derriere un QR. nds2026 (Nuits du Sud) est volontairement exclu
-- dans les deux sens : ses stations ont leur propre mecanique.
create or replace function public.qr_jeux_autorises()
returns text[]
language sql
immutable
as $$ select array['quiz','quizsolo','quizmaster','spin','tombola','vote'] $$;

create or replace function public.qr_jeu_garde()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_av jsonb; v_ap jsonb;
  v_master_new text; v_master_old text;
  v_priv boolean := coalesce(nullif(current_setting('role', true), ''), 'none') not in ('anon', 'authenticated');
  v_sa boolean;
  v_proprio boolean;
  v_mail text;
  v_role text;
  v_claims jsonb;
begin
  v_master_old := old.cfg -> 'master' ->> 'id';
  v_master_new := new.cfg -> 'master' ->> 'id';
  /* Changement de jeu = le module change, OU l'id du master change vers une valeur precise.
     (Un master absent dans la nouvelle cfg n'est PAS lu comme un changement : certains ecrans
     reecrivent la cfg sans ce champ.) */
  if new.module is not distinct from old.module
     and (v_master_new is null or v_master_new is not distinct from v_master_old) then
    return new;
  end if;

  v_sa := public.est_super_admin();
  v_proprio := public.qr_est_proprietaire(old.id);
  if not (v_priv or v_sa or v_proprio) then
    raise exception 'Seul le propriétaire de l''animation ou Flowin peut changer le jeu.'
      using errcode = '42501', hint = 'jeu_proprietaire';
  end if;
  if new.module is distinct from old.module
     and (new.module is null or new.module <> all (public.qr_jeux_autorises())
          or old.module is null or old.module <> all (public.qr_jeux_autorises())) and not v_priv then
    raise exception 'Ce jeu ne peut pas être changé ici (jeu inconnu, ou Nuits du Sud).'
      using errcode = '22023', hint = 'jeu_non_autorise';
  end if;

  begin v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb; exception when others then v_claims := null; end;
  select email into v_mail from public.flowin_super_admins where auth_id = auth.uid();
  v_mail := coalesce(v_mail, v_claims ->> 'email');
  v_role := case when v_sa then 'super_admin' when v_proprio then 'proprietaire' else 'service' end;

  v_av := jsonb_build_object('module', old.module, 'master', old.cfg -> 'master');
  v_ap := jsonb_build_object('module', new.module, 'master', new.cfg -> 'master');
  insert into public.qr_jeu_journal (event_id, avant, apres, par, par_email, par_role)
  values (old.id, v_av, v_ap, auth.uid(), v_mail, v_role);
  return new;
end;
$$;
drop trigger if exists trg_qr_jeu_garde on public.events;
create trigger trg_qr_jeu_garde before update of module, cfg on public.events
  for each row execute function public.qr_jeu_garde();

-- 6. POINT D'ENTREE : changer de jeu derriere les QR ----------------------------
create or replace function public.changer_jeu_station(p_event_id text, p_module text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  v_cfg jsonb;
  v_master jsonb;
  v_est_master boolean := p_module = any (array['quiz','quizsolo','spin','tombola','vote']);
begin
  if p_module is null or p_module <> all (public.qr_jeux_autorises()) then
    raise exception 'Jeu inconnu : %', coalesce(p_module, '(vide)') using errcode = '22023', hint = 'jeu_non_autorise';
  end if;
  select id, module, cfg into e from public.events where id = p_event_id for update;
  if not found then
    raise exception 'Animation introuvable.' using errcode = 'P0002';
  end if;
  v_cfg := coalesce(e.cfg, '{}'::jsonb);
  v_master := v_cfg -> 'master';
  if v_est_master then
    /* Meme perso (logo, lots, textes) conserve ; seul l'id du jeu change. jsonb_set : on
       n'ecrase pas le reste de la configuration. */
    v_cfg := jsonb_set(v_cfg, '{master}', coalesce(v_master, '{}'::jsonb) || jsonb_build_object('id', p_module), true);
  else
    /* Jeu hors masters (Quiz Master) : plus de master, l'ancien reste dans le journal. */
    v_cfg := v_cfg - 'master';
  end if;
  /* Le verrou (proprietaire / Super Admin) et le journal sont dans le trigger : memes
     regles pour ce point d'entree et pour une ecriture directe. */
  update public.events set module = p_module, cfg = v_cfg where id = p_event_id;
  return jsonb_build_object('ok', true, 'avant', e.module, 'apres', p_module);
end;
$$;
revoke all on function public.changer_jeu_station(text, text) from public;
grant execute on function public.changer_jeu_station(text, text) to anon, authenticated, service_role;
-- (anon peut appeler la fonction mais le trigger refuse tout appelant qui n'est ni proprietaire
--  ni Super Admin : sans session, la reponse est « Seul le propriétaire ... ».)

-- ============================================================================
-- VERIFICATIONS APRES APPLICATION (a lancer a la main) :
--   select count(*) filter (where code_court is null) as sans_code, count(*) as total from qr_stations;   -- sans_code = 0
--   select count(*) from (select code_court from qr_stations group by 1 having count(*) > 1) d;           -- 0
--   select min(length(code_court)) from qr_stations;                                                        -- >= 8
-- ============================================================================
