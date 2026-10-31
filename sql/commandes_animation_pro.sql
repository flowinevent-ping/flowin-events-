-- ============================================================================
-- COMMANDES ANIMATION <-> COMPTE PRO — activation au paiement (31/10/2026)
-- ============================================================================
-- A APPLIQUER A LA MAIN, UNE fois, APRES :
--   1. sql/pros_onboarding_entreprise.sql
--   2. sql/pros_rib.sql                  (cree est_super_admin() et flowin_super_admins)
--   3. sql/2026-11-01-commandes-animation.sql  (table commandes_animation)
--
-- DECISIONS DE ROMAIN (31/10) :
--   * L'espace pro ne s'ouvre QUE quand le paiement est valide.
--       - virement : validation MANUELLE par le Super Admin (« Marquer le virement
--         recu »), journalisee : qui, quand ;
--       - SEPA GoCardless : le webhook passe la commande en « mandat_actif » / « payee »
--         tout seul, ce qui active l'espace.
--   * Activation unique et idempotente : la commande passe a payee -> la fiche pro
--     passe de « en_attente » a « valide », une seule fois. Un pro suspendu a la
--     main n'est JAMAIS reactive par un nouvel evenement de paiement.
--   * Alerte : email a Flowin a chaque nouvelle commande en attente (trigger deja
--     present dans le fichier 3) + digest « en attente depuis plus de X jours »
--     (alerte_commandes_en_attente, a planifier) + indicateur cote SA.
--   * Un pro lit SES commandes (historique et factures) ; le SA lit tout ; personne
--     d'autre. Les anciennes politiques « tout authentifie » du fichier 3 sont
--     remplacees ici : sans cela, n'importe quel pro connecte lirait toutes les commandes.
-- ============================================================================

-- 0. Comptes Super Admin (meme definition que sql/pros_rib.sql : idempotent)
create table if not exists public.flowin_super_admins (
  auth_id    uuid primary key,
  email      text default '',
  created_at timestamptz default now()
);
alter table public.flowin_super_admins enable row level security;

create or replace function public.est_super_admin()
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (select 1 from public.flowin_super_admins s where s.auth_id = auth.uid())
$$;
revoke all on function public.est_super_admin() from public, anon;
grant execute on function public.est_super_admin() to authenticated;

-- 1. Colonnes : lien au compte pro, journal du virement, documents, facture
alter table public.commandes_animation add column if not exists pro_id text references public.pros(id) on delete set null;
alter table public.commandes_animation add column if not exists virement_recu_at timestamptz;
alter table public.commandes_animation add column if not exists virement_recu_par uuid;
alter table public.commandes_animation add column if not exists virement_recu_par_email text;
alter table public.commandes_animation add column if not exists documents_envoyes_at timestamptz;
alter table public.commandes_animation add column if not exists facture_numero text;
alter table public.commandes_animation add column if not exists facture_emise_at timestamptz;
alter table public.commandes_animation add column if not exists relance_paiement_at timestamptz;
alter table public.commandes_animation add column if not exists relances_paiement integer not null default 0;
create index if not exists commandes_animation_pro_idx on public.commandes_animation (pro_id) where pro_id is not null;
create unique index if not exists commandes_animation_facture_idx on public.commandes_animation (facture_numero) where facture_numero is not null;

alter table public.pros add column if not exists acces_active_at timestamptz;

-- 2. Journal (qui, quand, quoi) — lisible par le SA, jamais modifiable
create table if not exists public.commandes_animation_journal (
  id          bigserial primary key,
  commande_id text not null,
  action      text not null,
  par         uuid,
  par_email   text,
  at          timestamptz not null default now(),
  detail      jsonb
);
alter table public.commandes_animation_journal enable row level security;
revoke all on public.commandes_animation_journal from anon, authenticated;
grant select on public.commandes_animation_journal to authenticated;
drop policy if exists journal_super_admin on public.commandes_animation_journal;
create policy journal_super_admin on public.commandes_animation_journal for select to authenticated using (public.est_super_admin());

-- 3. Numerotation des factures : FA-AAAA-NNNN, continue, sans trou (verrou par annee)
create table if not exists public.factures_numerotation (annee integer primary key, dernier integer not null default 0);
alter table public.factures_numerotation enable row level security;
revoke all on public.factures_numerotation from anon, authenticated;

create or replace function public.prochain_numero_facture()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare a integer := extract(year from (now() at time zone 'Europe/Paris'))::integer; n integer;
begin
  insert into public.factures_numerotation(annee, dernier) values (a, 1)
  on conflict (annee) do update set dernier = factures_numerotation.dernier + 1
  returning dernier into n;
  return 'FA-' || a || '-' || lpad(n::text, 4, '0');
end;
$$;
revoke all on function public.prochain_numero_facture() from public, anon, authenticated;

-- 4. RLS : remplace les politiques « tout authentifie » du fichier 3
drop policy if exists commandes_animation_lecture_admin on public.commandes_animation;
drop policy if exists commandes_animation_maj_admin on public.commandes_animation;
drop policy if exists commandes_animation_lecture on public.commandes_animation;
drop policy if exists commandes_animation_maj_sa on public.commandes_animation;

create policy commandes_animation_lecture on public.commandes_animation
  for select to authenticated
  using (
    public.est_super_admin()
    or exists (select 1 from public.pros p where p.id = commandes_animation.pro_id and p.auth_id = auth.uid())
  );
create policy commandes_animation_maj_sa on public.commandes_animation
  for update to authenticated
  using (public.est_super_admin()) with check (public.est_super_admin());

-- 5. Statut -> facture (acquittee) : numero attribue une seule fois, a l'instant ou la
--    commande devient payee / mandat actif, quel que soit le chemin (SA ou webhook).
create or replace function public.commandes_animation_facture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.statut in ('payee', 'mandat_actif') and OLD.statut is distinct from NEW.statut
     and NEW.facture_numero is null and NEW.montant_ttc > 0 then
    NEW.facture_numero := public.prochain_numero_facture();
    NEW.facture_emise_at := now();
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_commandes_animation_facture on public.commandes_animation;
create trigger trg_commandes_animation_facture
before update of statut on public.commandes_animation
for each row execute function public.commandes_animation_facture();

-- 6. Activation de l'espace pro : une seule fois, idempotente
create or replace function public.activer_pro_apres_paiement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if NEW.pro_id is not null and NEW.statut in ('payee', 'mandat_actif') then
    update public.pros
       set statut = 'valide', acces_active_at = coalesce(acces_active_at, now())
     where id = NEW.pro_id and coalesce(statut, '') = 'en_attente';
    get diagnostics n = row_count;
    if n > 0 then
      insert into public.commandes_animation_journal(commande_id, action, par, par_email, detail)
      values (NEW.id, 'espace_pro_active', auth.uid(), nullif(auth.jwt() ->> 'email', ''), jsonb_build_object('pro_id', NEW.pro_id, 'statut', NEW.statut));
    end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_activer_pro_apres_paiement on public.commandes_animation;
create trigger trg_activer_pro_apres_paiement
after update of statut on public.commandes_animation
for each row
when (OLD.statut is distinct from NEW.statut)
execute function public.activer_pro_apres_paiement();

-- 7. « Marquer le virement recu » : SA seulement, journalise, idempotent
create or replace function public.marquer_virement_recu(p_commande text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare c public.commandes_animation%rowtype;
begin
  if not public.est_super_admin() then raise exception 'Reserve au Super Admin' using errcode = '42501'; end if;
  select * into c from public.commandes_animation where id = p_commande for update;
  if not found then raise exception 'Commande introuvable' using errcode = 'P0002'; end if;
  if c.statut in ('payee', 'mandat_actif') then return c.statut; end if;   -- deja validee : rien ne change
  if c.statut = 'annulee' then raise exception 'Commande annulee' using errcode = 'P0001'; end if;
  update public.commandes_animation
     set statut = 'payee', virement_recu_at = now(), virement_recu_par = auth.uid(),
         virement_recu_par_email = nullif(auth.jwt() ->> 'email', ''), paiement_maj_at = now()
   where id = p_commande;
  insert into public.commandes_animation_journal(commande_id, action, par, par_email, detail)
  values (p_commande, 'virement_recu', auth.uid(), nullif(auth.jwt() ->> 'email', ''), jsonb_build_object('montant_ttc', c.montant_ttc));
  return 'payee';
end;
$$;
revoke all on function public.marquer_virement_recu(text) from public, anon;
grant execute on function public.marquer_virement_recu(text) to authenticated;

create or replace function public.marquer_documents_envoyes(p_commande text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_super_admin() then raise exception 'Reserve au Super Admin' using errcode = '42501'; end if;
  update public.commandes_animation set documents_envoyes_at = coalesce(documents_envoyes_at, now()) where id = p_commande;
  insert into public.commandes_animation_journal(commande_id, action, par, par_email)
  select p_commande, 'documents_envoyes', auth.uid(), nullif(auth.jwt() ->> 'email', '')
   where exists (select 1 from public.commandes_animation where id = p_commande);
end;
$$;
revoke all on function public.marquer_documents_envoyes(text) from public, anon;
grant execute on function public.marquer_documents_envoyes(text) to authenticated;

-- 8. Le pro relance son paiement par virement : on horodate (pas plus d'une fois par heure)
create or replace function public.relancer_paiement_virement(p_commande text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare c public.commandes_animation%rowtype;
begin
  select * into c from public.commandes_animation where id = p_commande;
  if not found then raise exception 'Commande introuvable' using errcode = 'P0002'; end if;
  if not (public.est_super_admin() or exists (select 1 from public.pros p where p.id = c.pro_id and p.auth_id = auth.uid())) then
    raise exception 'Acces refuse' using errcode = '42501';
  end if;
  if c.statut <> 'en_attente_paiement' then return c.relance_paiement_at; end if;
  if c.relance_paiement_at is null or c.relance_paiement_at < now() - interval '1 hour' then
    update public.commandes_animation set relance_paiement_at = now(), relances_paiement = relances_paiement + 1 where id = p_commande;
    insert into public.commandes_animation_journal(commande_id, action, par, par_email)
    values (p_commande, 'relance_paiement', auth.uid(), nullif(auth.jwt() ->> 'email', ''));
    return now();
  end if;
  return c.relance_paiement_at;
end;
$$;
revoke all on function public.relancer_paiement_virement(text) from public, anon;
grant execute on function public.relancer_paiement_virement(text) to authenticated;

-- 9. Indicateur SA : commandes en attente de paiement depuis plus de X jours
create or replace function public.commandes_en_attente(p_jours integer default 3)
returns table(id text, raison_sociale text, email text, montant_ttc numeric, mode_paiement text, created_at timestamptz, jours integer, pro_id text)
language sql stable security definer
set search_path = public
as $$
  select c.id, c.raison_sociale, c.email, c.montant_ttc, c.mode_paiement, c.created_at,
         floor(extract(epoch from (now() - c.created_at)) / 86400)::integer, c.pro_id
    from public.commandes_animation c
   where public.est_super_admin()
     and c.statut in ('en_attente_paiement', 'mandat_en_cours')
     and c.created_at < now() - make_interval(days => greatest(p_jours, 0))
   order by c.created_at
$$;
revoke all on function public.commandes_en_attente(integer) from public, anon;
grant execute on function public.commandes_en_attente(integer) to authenticated;

-- 10. Alerte email (digest) : a planifier, par exemple chaque matin.
--     <ANON_KEY> = cle anon legacy du projet (JWT public par design), a remplacer a l'application.
--       select cron.schedule('alerte-commandes-attente', '0 7 * * *', $$select public.alerte_commandes_en_attente(3)$$);
create or replace function public.alerte_commandes_en_attente(p_jours integer default 3)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare liste jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'raison_sociale', c.raison_sociale, 'montant_ttc', c.montant_ttc,
           'jours', floor(extract(epoch from (now() - c.created_at)) / 86400)::integer) order by c.created_at), '[]'::jsonb)
    into liste
    from public.commandes_animation c
   where c.statut in ('en_attente_paiement', 'mandat_en_cours') and c.created_at < now() - make_interval(days => greatest(p_jours, 0));
  if jsonb_array_length(liste) = 0 then return 0; end if;
  perform net.http_post(
    url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/notify-commande-animation',
    body := jsonb_build_object('type', 'en_attente', 'jours', p_jours, 'commandes', liste),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <ANON_KEY>'),
    timeout_milliseconds := 5000);
  return jsonb_array_length(liste);
end;
$$;
revoke all on function public.alerte_commandes_en_attente(integer) from public, anon, authenticated;
