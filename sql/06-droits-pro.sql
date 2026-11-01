-- ============================================================================
-- 06 — DROITS D'ACCES DU PRO, PILOTES PAR LE SUPER ADMIN  [01/11/2026]
-- ============================================================================
-- NON APPLIQUE EN BASE. A lancer a la main, DANS L'ORDRE de la chaine : apres 01
-- (identite du Super Admin : table flowin_super_admins + est_super_admin()).
-- Idempotent : peut etre rejoue sans dommage (la reprise ne remet PAS les droits a zero).
--
-- DEMANDE DE ROMAIN : depuis la fiche du pro (Super Admin), valider ou retirer des
-- options pour LIMITER ou non l'accessibilite : creer une animation, creer un super
-- event, integrer (rejoindre) un super event. Le meme mecanisme sert pour les banques
-- de questions et les partenaires/logos.
--
-- LES 5 DROITS (colonne pros.droits, jsonb ; une cle absente = valeur par defaut) :
--   creer_animation        defaut OUI   creer une animation (event hors super event)
--   creer_super_event      defaut NON   creer un super event soi-meme (HYPOTHESE : seul Flowin
--                                       en cree aujourd'hui, le pro « propose » a Flowin ; ce droit
--                                       ouvre la creation directe, comme cote Super Admin)
--   rejoindre_super_event  defaut OUI   se rattacher a un super event (demande + station)
--   creer_banques          defaut OUI   creer des banques de questions (quiz et bonus)
--   gerer_partenaires      defaut OUI   gerer sa fiche partenaire et ses logos (INTERFACE SEULEMENT :
--                                       la table partenaires ne porte pas l'identite du pro, voir limites)
-- Les pros EXISTANTS gardent exactement ce qu'ils font aujourd'hui (defauts ci-dessus) :
-- rien ne change tant que Romain ne decoche pas une option.
--
-- COMMENT C'EST FAIT RESPECTER (pas seulement masque a l'ecran) :
--   * triggers BEFORE INSERT sur events, demandes_rattachement_super_event, super_events, banques :
--     si la ligne porte un pro_id dont le droit est coupe, l'ecriture est REFUSEE (erreur 42501,
--     message « Cette option n'est pas activee sur votre compte — contactez Flowin ») quel que
--     soit le chemin : ecran, URL directe, appel API.
--   * Super Admin connecte (est_super_admin()), service_role et SQL editor : jamais bloques.
--   * pros.droits n'est modifiable que par le Super Admin (trigger) : un pro ne peut pas se
--     redonner un droit ; a l'inscription, un droit demande est ignore (valeurs par defaut).
--   * chaque changement est journalise (pros_droits_journal : qui, quand, avant, apres),
--     lisible par le Super Admin seul.
--
-- LIMITES CONNUES (a decider avec Romain) :
--   1. Aujourd'hui l'espace pro et le dashboard Super Admin ecrivent avec la cle publique (anon) :
--      la base reconnait le pro par le pro_id porte par la ligne, pas par une session. Un appel
--      API fabrique a la main qui omettrait pro_id ou prendrait celui d'un autre pro passerait.
--      Le verrou devient complet avec la bascule « identite pro » du plan 05 (phases 2-3).
--   2. Un Super Admin NON connecte (cle publique) qui cree une animation POUR un pro dont le droit
--      est coupe est refuse comme le pro : il doit soit se connecter en Super Admin (page
--      « Droits » de la fiche pro = connexion SA integree), soit rendre le droit un instant.
--   3. gerer_partenaires : masque dans l'interface ; pas de verrou base (le Super Admin ecrit
--      aussi la table partenaires en anon).
--
-- MODE DEGRADE : tant que ce fichier n'est pas applique, le code ne trouve pas la colonne et se
-- comporte comme avant (tout autorise, sauf la creation directe de super event qui reste
-- « proposer a Flowin »).
-- ============================================================================

-- 1. La colonne, avec reprise sans ecrasement.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'pros' and column_name = 'droits') then
    alter table public.pros add column droits jsonb;
    update public.pros set droits = '{"creer_animation":true,"creer_super_event":false,"rejoindre_super_event":true,"creer_banques":true,"gerer_partenaires":true}'::jsonb;
  end if;
end $$;
alter table public.pros alter column droits
  set default '{"creer_animation":true,"creer_super_event":false,"rejoindre_super_event":true,"creer_banques":true,"gerer_partenaires":true}'::jsonb;
comment on column public.pros.droits is
  'Droits d''acces du pro (voir sql/06-droits-pro.sql). Modifiable par le Super Admin uniquement. Cle absente = valeur par defaut.';

-- 2. Journal des changements de droits.
create table if not exists public.pros_droits_journal (
  id        bigint generated always as identity primary key,
  pro_id    text        not null,
  droit     text        not null,
  avant     boolean,
  apres     boolean,
  par       uuid,
  par_email text,
  le        timestamptz not null default now()
);
create index if not exists pros_droits_journal_pro_idx on public.pros_droits_journal (pro_id, le desc);
alter table public.pros_droits_journal enable row level security;
revoke all on public.pros_droits_journal from anon, authenticated;
grant select on public.pros_droits_journal to authenticated;
grant all on public.pros_droits_journal to service_role;
drop policy if exists pros_droits_journal_sa on public.pros_droits_journal;
create policy pros_droits_journal_sa on public.pros_droits_journal for select to authenticated using (public.est_super_admin());

-- 3. Lecture d'un droit (valeur par defaut si cle ou pro absents).
create or replace function public.pro_droit(p_pro text, p_droit text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select (p.droits ->> p_droit)::boolean from public.pros p where p.id = p_pro),
                  p_droit <> 'creer_super_event');
$$;
grant execute on function public.pro_droit(text, text) to anon, authenticated, service_role;

-- 4. Droit « effectif » pour l'appelant : Super Admin, service_role et SQL editor passent toujours.
--    (security definer : anon n'a pas le droit d'executer est_super_admin() ; le role de la requete
--    est lu dans le reglage `role`, qui reste celui de l'appelant meme dans une fonction definer.)
create or replace function public.pro_droit_ok(p_pro text, p_droit text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_pro is null
      or coalesce(nullif(current_setting('role', true), ''), 'none') not in ('anon', 'authenticated')
      or public.est_super_admin()
      or public.pro_droit(p_pro, p_droit);
$$;
grant execute on function public.pro_droit_ok(text, text) to anon, authenticated, service_role;

-- 5. Verrous sur les ecritures.
create or replace function public.droits_pro_garde()
returns trigger
language plpgsql
as $$
declare v_pro text; v_droit text; v_ok boolean;
begin
  if tg_table_name = 'events' then
    v_pro := new.pro_id;
    if new.super_event_id is null then
      v_droit := 'creer_animation';
    else
      if tg_op = 'UPDATE' and new.super_event_id is not distinct from old.super_event_id then return new; end if;
      v_droit := 'rejoindre_super_event';
    end if;
  elsif tg_table_name = 'demandes_rattachement_super_event' then
    v_pro := new.pro_id; v_droit := 'rejoindre_super_event';
  elsif tg_table_name = 'super_events' then
    v_pro := new.pro_id; v_droit := 'creer_super_event';
  elsif tg_table_name = 'banques' then
    v_pro := new.pro_id; v_droit := 'creer_banques';
  else
    return new;
  end if;
  if v_pro is null then return new; end if;
  v_ok := public.pro_droit_ok(v_pro, v_droit);
  /* Le createur d'un super event y a forcement sa station, meme sans le droit « rejoindre ». */
  if not v_ok and tg_table_name = 'events' and v_droit = 'rejoindre_super_event' then
    v_ok := exists (select 1 from public.super_events s where s.id = new.super_event_id and s.pro_id = new.pro_id)
            and public.pro_droit(new.pro_id, 'creer_super_event');
  end if;
  if v_ok then return new; end if;
  raise exception 'Cette option n''est pas activée sur votre compte — contactez Flowin.'
    using errcode = '42501', detail = v_droit, hint = 'droit_pro';
end;
$$;

drop trigger if exists trg_droits_pro_events on public.events;
create trigger trg_droits_pro_events before insert or update of super_event_id on public.events
  for each row execute function public.droits_pro_garde();
drop trigger if exists trg_droits_pro_demandes on public.demandes_rattachement_super_event;
create trigger trg_droits_pro_demandes before insert on public.demandes_rattachement_super_event
  for each row execute function public.droits_pro_garde();
drop trigger if exists trg_droits_pro_super_events on public.super_events;
create trigger trg_droits_pro_super_events before insert on public.super_events
  for each row execute function public.droits_pro_garde();
drop trigger if exists trg_droits_pro_banques on public.banques;
create trigger trg_droits_pro_banques before insert on public.banques
  for each row execute function public.droits_pro_garde();

-- 6. pros.droits : reserve au Super Admin + journal.
create or replace function public.pros_droits_garde()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_priv boolean := coalesce(nullif(current_setting('role', true), ''), 'none') not in ('anon', 'authenticated');
  v_sa boolean := public.est_super_admin();
  v_def jsonb := '{"creer_animation":true,"creer_super_event":false,"rejoindre_super_event":true,"creer_banques":true,"gerer_partenaires":true}'::jsonb;
  k text; v_av jsonb; v_ap jsonb; v_mail text;
begin
  if tg_op = 'INSERT' then
    /* Inscription : un droit demande par le formulaire est ignore. */
    if not (v_priv or v_sa) then new.droits := v_def; end if;
    return new;
  end if;
  if new.droits is not distinct from old.droits then return new; end if;
  if not (v_priv or v_sa) then
    raise exception 'Les droits d''un pro sont réservés au Super Admin Flowin.' using errcode = '42501', hint = 'droit_pro';
  end if;
  select email into v_mail from public.flowin_super_admins where auth_id = auth.uid();
  v_av := coalesce(old.droits, v_def); v_ap := coalesce(new.droits, v_def);
  for k in select jsonb_object_keys(v_av || v_ap) loop
    if (v_av ->> k) is distinct from (v_ap ->> k) then
      insert into public.pros_droits_journal (pro_id, droit, avant, apres, par, par_email)
      values (new.id, k, (v_av ->> k)::boolean, (v_ap ->> k)::boolean, auth.uid(), coalesce(v_mail, case when v_priv then 'sql / service' else null end));
    end if;
  end loop;
  return new;
end;
$$;
drop trigger if exists trg_pros_droits_garde on public.pros;
create trigger trg_pros_droits_garde before insert or update of droits on public.pros
  for each row execute function public.pros_droits_garde();

-- 7. Point d'entree du Super Admin (un droit a la fois). Refuse tout autre appelant.
create or replace function public.pro_definir_droit(p_pro text, p_droit text, p_valeur boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_def jsonb := '{"creer_animation":true,"creer_super_event":false,"rejoindre_super_event":true,"creer_banques":true,"gerer_partenaires":true}'::jsonb;
        r jsonb;
begin
  if not public.est_super_admin() then
    raise exception 'Réservé au Super Admin Flowin (connexion requise).' using errcode = '42501';
  end if;
  if p_droit not in ('creer_animation', 'creer_super_event', 'rejoindre_super_event', 'creer_banques', 'gerer_partenaires') then
    raise exception 'Droit inconnu : %', p_droit using errcode = '22023';
  end if;
  update public.pros set droits = coalesce(droits, v_def) || jsonb_build_object(p_droit, p_valeur) where id = p_pro returning droits into r;
  if r is null then raise exception 'Pro introuvable : %', p_pro using errcode = 'P0002'; end if;
  return r;
end;
$$;
revoke all on function public.pro_definir_droit(text, text, boolean) from public, anon;
grant execute on function public.pro_definir_droit(text, text, boolean) to authenticated, service_role;

-- Controles apres application :
--   select id, droits from pros order by nom;
--   select * from pros_droits_journal order by le desc limit 20;   -- (Super Admin connecte)
--   -- test : retirer un droit puis tenter de creer
--   --   select pro_definir_droit('pro-xxx', 'creer_animation', false);   (Super Admin connecte)
