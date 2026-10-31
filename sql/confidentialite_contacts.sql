-- ============================================================================
-- CONFIDENTIALITE DES CONTACTS JOUEURS — plan de migration (31/10/2026)
-- ============================================================================
-- DECISION DE ROMAIN : seul le SUPER ADMIN Flowin lit les coordonnees completes
-- (email, telephone, nom, prenom...) de tous les joueurs. Un pro ne voit que les
-- contacts qui ont consenti a etre contactes, et seulement ceux de SON commerce.
--
-- CONSTAT (lu dans le code ; la base n'a pas pu etre interrogee depuis la session
-- de travail — voir PHASE 0 pour le verifier) :
--   * le SA (dashboard Next et dashboard.html vanilla) n'a AUCUNE identite cote
--     Supabase : il lit tout avec la cle publique (anon), y compris
--     joueurs?select=* et fetchAllJoueurs dans app/dashboard/layout.tsx ;
--   * l'espace pro est rendu cote serveur avec la meme cle publique : la base ne
--     sait pas qui est le pro, elle ne peut donc pas filtrer « ses » contacts ;
--   * les parcours joueurs (NDS compris) relisent la fiche d'un joueur par
--     email_lower avec la cle publique (lib/parcours.ts : id, ticket_code, prenom,
--     nom, tel, code_postal, age_tranche, genre, email, events) ;
--   * d'apres le commentaire de admin/lib/pro.ts, anon n'a plus de droit « table »
--     sur joueurs, seulement des droits colonne par colonne — mais email, tel,
--     nom, prenom y sont lisibles (c'est ce que lit l'application).
--   => Revoquer ces lectures d'un coup casserait le SA ET les parcours NDS.
--      D'ou un plan en 4 phases : on ajoute d'abord le chemin securise, on bascule
--      les ecrans, et on ne ferme qu'ensuite.
--
-- INVENTAIRE DES LECTURES DE `joueurs` (a ne pas casser)
--   Parcours joueurs (cle anon, SANS session) — NDS NE DOIT PAS CHANGER :
--     lib/parcours.ts          select id,ticket_code,prenom,nom,tel,code_postal,age_tranche,genre
--                              par email_lower ; select id par email_lower ; insert ;
--                              update(joueurFields) ; select email,... par email_lower ;
--                              select events par id ; update events,last_seen,ticket_code
--     lib/joueurs.ts, lib/landing.ts   select id ; upsert on_conflict external_id
--     public/parcours_user.html        POST /rest/v1/joueurs?on_conflict=external_id
--     app/moi/page.tsx                 select id,prenom,nom,email par id
--   Espace pro (serveur, anon) — MIGRE PAR CE LOT :
--     lib/pro.ts                       ne lit plus que des colonnes statistiques
--     lib/crmPro.ts                    RPC crm_pro_consentants (repli : crm_pro + masque)
--     components/operations/DataOperation.tsx, DiffusionOperation.tsx
--                                      RPC joueurs_consentants_par_ids (repli : lecture directe)
--   Super Admin (anon aujourd'hui) — A MIGRER avant la PHASE 3 :
--     app/dashboard/layout.tsx -> lib/dashboard.ts fetchAllJoueurs (tous les champs)
--     lib/dashboard.ts         update / delete joueurs ; select id,prenom,nom,email,tel
--     lib/crmLanding.ts, app/dashboard/btob-prospects/page.tsx, lib/joueurs.ts
--     RPC crm_pro (version SA complete), crm_participants, super_event_participants,
--     super_event_optin, partenaire_gagnants, attribuer_gain_joueur, tirage_*
--     public/dashboard.html    GET /rest/v1/joueurs?events=cs.{ev}&select=*
--     public/tirage-nds.html   lit joueurs NDS pour le tirage (SA)
--   Fonctions SECURITY DEFINER (continuent de marcher quoi qu'on revoque) :
--     crm_pro, joueurs_uniques_par_mois, operation_stats, evenement_tracking,
--     liste_gagnants_publique (nom abrege) ...
-- ============================================================================

-- ============================================================================
-- PHASE 0 — AUDIT (lecture seule, une requete a la fois, avant tout le reste)
-- ============================================================================
--   -- droits par colonne de anon / authenticated sur joueurs
--   select grantee, column_name, privilege_type from information_schema.column_privileges
--    where table_schema='public' and table_name='joueurs' and grantee in ('anon','authenticated') order by 1,2;
--   -- politiques
--   select polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) from pg_policy where polrelid='public.joueurs'::regclass;
--   -- RLS active ?
--   select relrowsecurity, relforcerowsecurity from pg_class where oid='public.joueurs'::regclass;
--   -- fonctions qui lisent joueurs
--   select p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid) from pg_proc p
--    join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosrc ilike '%joueurs%' order by 1;

-- ============================================================================
-- PHASE 1 — AJOUTS SANS EFFET SUR L'EXISTANT (peut etre applique des maintenant)
-- ============================================================================
-- 1a. Identite du SA (meme definition que sql/pros_rib.sql : idempotent)
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

-- 1b. Le SA, connecte, lit tout ; sans session il ne lit rien de plus qu'aujourd'hui.
--     (Politique additive : n'enleve rien a ce qui existe.)
drop policy if exists joueurs_super_admin_lecture on public.joueurs;
create policy joueurs_super_admin_lecture on public.joueurs for select to authenticated using (public.est_super_admin());

-- 1c. CRM du pro : memes colonnes que crm_pro, mais email / telephone / nom / prenom
--     ne sortent QUE pour les joueurs qui ont consenti. Les autres restent comptes
--     (age, genre, code postal, parties, gains) sans coordonnees.
create or replace function public.crm_pro_consentants(p_pro text)
returns table(
  joueur_id uuid, prenom text, nom text, email text, tel text,
  code_postal text, ville text, genre text, tranche_age text, optin boolean,
  source text, origines text[], operations jsonb,
  nb_parties bigint, nb_tickets bigint, nb_gains bigint, lots text[],
  premiere date, derniere date
)
language sql stable security definer
set search_path to 'public'
as $$
  select c.joueur_id,
         case when c.optin is true then c.prenom end,
         case when c.optin is true then c.nom else left(c.nom, 1) || '.' end,
         case when c.optin is true then c.email end,
         case when c.optin is true then c.tel end,
         c.code_postal, c.ville, c.genre, c.tranche_age, coalesce(c.optin, false),
         c.source, c.origines, c.operations,
         c.nb_parties, c.nb_tickets, c.nb_gains, c.lots, c.premiere, c.derniere
    from public.crm_pro(p_pro) c
$$;
revoke all on function public.crm_pro_consentants(text) from public;
grant execute on function public.crm_pro_consentants(text) to anon, authenticated;

-- 1d. Export / liste par animation : seuls les joueurs consentants, par identifiants.
create or replace function public.joueurs_consentants_par_ids(p_ids uuid[])
returns table(id uuid, prenom text, nom text, email text, tel text, ville text, code_postal text, optin boolean, first_seen text)
language sql stable security definer
set search_path to 'public'
as $$
  select j.id, j.prenom, j.nom, j.email, j.tel, j.ville, j.code_postal, true, j.first_seen::text
    from public.joueurs j
   where j.id = any (p_ids) and j.optin is true
$$;
revoke all on function public.joueurs_consentants_par_ids(uuid[]) from public;
grant execute on function public.joueurs_consentants_par_ids(uuid[]) to anon, authenticated;

-- ============================================================================
-- PHASE 2 — DONNER UNE IDENTITE AU SUPER ADMIN (code, pas de SQL destructif)
-- ============================================================================
--   1. Creer le compte Supabase Auth du SA et l'inscrire :
--        insert into public.flowin_super_admins(auth_id, email) values ('<uuid auth.users>', '<email>');
--   2. Ajouter une connexion au dashboard (Next et dashboard.html) ; faire lire joueurs,
--      crm_*, tirages, commandes via la session (role authenticated + est_super_admin()).
--      La page /dashboard/commandes-animation (ce lot) montre le modele : connexion SA,
--      puis lectures et ecritures sous RLS.
--   3. Tant que le SA n'a pas de session, NE PAS passer a la phase 3.

-- ============================================================================
-- PHASE 3 — FERMETURE (NE PAS EXECUTER avant que la phase 2 soit livree ET testee)
-- ============================================================================
-- 3a. Colonnes que AUCUN parcours joueur ne relit (verifier avec la phase 0) :
--       revoke select (ddn, date_naissance, adresse, push_token, rgpd_at, user_id, pwa_installed,
--                      pwa_installed_at, niveau_id, classe, ecole, classe_id, etablissement_id,
--                      visiteur_id, enseigne, decouverte, secteur) on public.joueurs from anon;
-- 3b. Coordonnees relues par les parcours (email, nom, prenom, tel : retrouver un joueur par
--     email_lower) : NE PEUT PAS etre ferme sans changer les parcours, donc NDS. Option a
--     decider avec Romain : fonction joueur_retrouver(email) qui renvoie le prenom et le
--     ticket, jamais le telephone, avec confirmation par email. Tant que ce n'est pas
--     decide, ces colonnes restent lisibles par la cle publique : c'est le risque residuel.
--       -- revoke select (email, email_lower, tel, nom, prenom) on public.joueurs from anon;  -- APRES 3b
-- 3c. Lecture des fiches : plus de politique anon sur joueurs en dehors de l'insert / upsert.
--
-- RETOUR ARRIERE (a garder sous la main) :
--       grant select (ddn, date_naissance, adresse, push_token, rgpd_at, user_id) on public.joueurs to anon;
--       grant select (email, email_lower, tel, nom, prenom) on public.joueurs to anon;
