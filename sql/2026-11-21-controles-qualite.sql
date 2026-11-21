-- 2026-11-21 : contrôles qualité automatiques, NIVEAU 1 (lecture seule sur les données métier).
-- Additif uniquement : 2 tables, 6 fonctions, 1 tâche pg_cron. Aucun DROP de table ou colonne, aucun TRUNCATE,
-- aucun DELETE de données réelles. Idempotent (peut être relancé sans effet de bord).
--
-- Principe : public.controle_qualite_lancer() exécute tous les contrôles, écrit UNE ligne par contrôle dans
-- public.controles_qualite et renvoie ces lignes en jsonb. Elle ne corrige rien : elle constate.
-- Droits : tables et fonctions réservées à service_role (et au propriétaire postgres, utilisé par pg_cron).
-- Aucun accès pour anon / authenticated, aucune politique RLS (RLS activée sans politique).
-- Jamais de valeur de secret : le Vault n'est interrogé que par comptage.
--
-- Liste blanche des INSERT anonymes voulus (flux joueur), d'après docs/SECURITE-rls-tables-2026-11-19.md
-- et docs/SECURITE-joueurs-rpc-2026-11-19.md : joueurs, participations, visites, partenaire_clics,
-- leads_landing, sondage_brigade, crm_retours, parrainage, se_gains, se_reponses, se_tickets.
-- Pour la modifier : éditer la variable v_liste_blanche de controle_qualite_lancer() (puis rafraîchir la
-- référence de dérive, voir plus bas).

-- 1. Tables ------------------------------------------------------------------------------------------------
create table if not exists public.controles_qualite (
  id        bigserial primary key,
  lance_le  timestamptz not null default now(),
  famille   text not null,
  code      text not null,
  libelle   text,
  statut    text not null check (statut in ('vert','orange','rouge')),
  gravite   text not null check (gravite in ('bloquant','important','info')),
  detail    text,
  action    text
);
create index if not exists controles_qualite_lance_le_idx on public.controles_qualite (lance_le desc);
alter table public.controles_qualite enable row level security;   -- aucune politique : service_role seulement

create table if not exists public.schema_reference (
  id        integer primary key check (id = 1),                   -- une seule ligne de référence
  empreinte text not null,
  items     jsonb not null,                                       -- liste triée des politiques et droits de fonctions
  cree_le   timestamptz not null default now(),
  maj_le    timestamptz not null default now()
);
alter table public.schema_reference enable row level security;     -- aucune politique : service_role seulement

-- Supabase accorde des droits par défaut sur les nouveaux objets : on les retire explicitement.
revoke all on table public.controles_qualite, public.schema_reference from public, anon, authenticated;
revoke all on sequence public.controles_qualite_id_seq from public, anon, authenticated;
grant all on table public.controles_qualite, public.schema_reference to service_role;
grant all on sequence public.controles_qualite_id_seq to service_role;

-- 2. Fonctions d'aide (internes, non exposées) -------------------------------------------------------------
create or replace function public._cq_ligne(p_lance timestamptz, p_famille text, p_code text, p_libelle text,
  p_statut text, p_gravite text, p_detail text, p_action text) returns void
language sql security definer set search_path = public as $$
  insert into public.controles_qualite (lance_le, famille, code, libelle, statut, gravite, detail, action)
  values (p_lance, p_famille, p_code, p_libelle, p_statut, p_gravite, p_detail, p_action);
$$;

-- Liste triée des politiques RLS et des droits d'exécution des fonctions du schéma public.
create or replace function public._cq_schema_items() returns text[]
language sql security definer set search_path = public, pg_catalog as $$
  select coalesce(array_agg(x order by x), '{}'::text[]) from (
    select 'P|'||tablename||'|'||policyname||'|'||cmd||'|'||permissive||'|'||array_to_string(roles, ',')
           ||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') as x
      from pg_policies where schemaname = 'public'
    union all
    select 'F|'||p.oid::regprocedure::text||'|secdef='||p.prosecdef
           ||'|anon='||has_function_privilege('anon', p.oid, 'EXECUTE')
           ||'|auth='||has_function_privilege('authenticated', p.oid, 'EXECUTE')
           ||'|service='||has_function_privilege('service_role', p.oid, 'EXECUTE')
      from pg_proc p
     where p.pronamespace = 'public'::regnamespace and p.prokind in ('f','p')
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  ) s;
$$;

-- 3. Empreinte du schéma (dérive) --------------------------------------------------------------------------
create or replace function public.schema_empreinte() returns text
language sql security definer set search_path = public, pg_catalog as $$
  select md5(array_to_string(public._cq_schema_items(), E'\n'));
$$;

-- Rafraîchir la référence APRÈS un changement volontaire de politiques ou de droits :
--   select public.schema_reference_rafraichir();      (avec la clé service_role, ou l'éditeur SQL)
create or replace function public.schema_reference_rafraichir() returns text
language plpgsql security definer set search_path = public, pg_catalog as $$
declare it text[] := public._cq_schema_items(); e text := public.schema_empreinte();
begin
  insert into public.schema_reference (id, empreinte, items) values (1, e, to_jsonb(it))
  on conflict (id) do update set empreinte = excluded.empreinte, items = excluded.items, maj_le = now();
  return 'référence mise à jour : '||e||' ('||coalesce(array_length(it,1),0)||' éléments)';
end $$;

-- 4. Le lancement des contrôles ----------------------------------------------------------------------------
create or replace function public.controle_qualite_lancer() returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  t   timestamptz := clock_timestamp();      -- identifiant du passage (distinct même dans une transaction unique)
  n   bigint;  m bigint;  s text;  st text;
  -- Tables dont la lecture anonyme est interdite (coordonnées, gains, tickets).
  v_lecture_interdite text[] := array['joueurs','participations','tirages','se_gains','se_reponses','se_tickets',
                                      'parrainage','clients_commerce','pros'];
  -- Liste blanche des INSERT anonymes voulus (flux joueur).
  v_liste_blanche text[] := array['joueurs','participations','visites','partenaire_clics','leads_landing',
                                  'sondage_brigade','crm_retours','parrainage','se_gains','se_reponses','se_tickets'];
  -- Tables public sans RLS tolérées (aucune aujourd'hui).
  v_sans_rls_ok text[] := array[]::text[];
  v_fonctions_tirage text[] := array['attribuer_gain_joueur','tirage_super_event','annuler_tirage','marquer_notifie',
                                     'tirage_lot','tirage_soir'];
  v_ref public.schema_reference%rowtype;
  v_items text[]; v_emp text; v_plus text[]; v_moins text[];
begin
  ---------------------------------------------------------------- SECURITE
  begin  -- lecture anonyme interdite
    select count(*), string_agg(c.relname, ', ' order by c.relname) into n, s
      from pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','p') and c.relname = any(v_lecture_interdite)
       and has_any_column_privilege('anon', c.oid, 'SELECT')
       and (not c.relrowsecurity or exists (
             select 1 from pg_policies p
              where p.schemaname = 'public' and p.tablename = c.relname and p.cmd in ('SELECT','ALL')
                and p.roles && array['anon','public']::name[] and p.qual = 'true'));
    select count(*) into m from pg_class c where c.relnamespace = 'public'::regnamespace
       and c.relkind in ('r','p') and c.relname = any(v_lecture_interdite);
    perform public._cq_ligne(t,'SECURITE','anon_lecture_tables_sensibles','Lecture anonyme des tables sensibles',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then m||' tables sensibles contrôlées, aucune lisible par anon'
           else n||' table(s) lisible(s) par anon : '||s end,
      'Agent securite-donnees : retirer le SELECT anon / la politique true sur ces tables');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','anon_lecture_tables_sensibles','Lecture anonyme des tables sensibles','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- écriture ouverte à anon hors liste blanche
    select count(*), string_agg(distinct p.tablename||'.'||p.policyname||' ('||p.cmd||')', ', ') into n, s
      from pg_policies p
     where p.schemaname = 'public' and p.roles && array['anon','public']::name[]
       and p.tablename <> all(v_liste_blanche)
       and ((p.cmd in ('ALL','UPDATE','DELETE') and p.qual = 'true')
         or (p.cmd in ('ALL','INSERT') and (p.with_check = 'true' or (p.cmd = 'ALL' and p.with_check is null and p.qual = 'true'))));
    perform public._cq_ligne(t,'SECURITE','anon_ecriture_hors_liste','Écriture anonyme hors liste autorisée',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then 'aucune politique d''écriture ouverte à anon hors liste blanche ('||array_length(v_liste_blanche,1)||' tables autorisées)'
           else n||' politique(s) : '||left(s, 600) end,
      'Agent securite-donnees : remplacer par une écriture SA / pro propriétaire');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','anon_ecriture_hors_liste','Écriture anonyme hors liste autorisée','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- UPDATE / DELETE ouverts à anon sur les tables de la liste blanche (seul INSERT est voulu)
    select count(*), string_agg(distinct p.tablename||'.'||p.policyname||' ('||p.cmd||')', ', ') into n, s
      from pg_policies p
     where p.schemaname = 'public' and p.roles && array['anon','public']::name[]
       and p.tablename = any(v_liste_blanche) and p.cmd in ('ALL','UPDATE','DELETE') and p.qual = 'true';
    perform public._cq_ligne(t,'SECURITE','anon_modif_liste_blanche','Modification anonyme sur tables à INSERT seul',
      case when n = 0 then 'vert' else 'orange' end, 'important',
      case when n = 0 then 'les tables à INSERT anonyme n''acceptent ni UPDATE ni DELETE anonymes'
           else n||' politique(s) : '||left(s, 600) end,
      'Agent securite-donnees : retirer UPDATE / DELETE anon, garder INSERT');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','anon_modif_liste_blanche','Modification anonyme sur tables à INSERT seul','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- TRUNCATE
    select count(*), string_agg(c.relname, ', ' order by c.relname) into n, s
      from pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','p')
       and (has_table_privilege('anon', c.oid, 'TRUNCATE') or has_table_privilege('authenticated', c.oid, 'TRUNCATE'));
    perform public._cq_ligne(t,'SECURITE','truncate_accorde','TRUNCATE accordé à anon / authenticated',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then 'aucune table publique ne donne TRUNCATE à anon ou authenticated'
           else n||' table(s) : '||left(s, 600) end,
      'Agent securite-donnees : revoke truncate sur ces tables');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','truncate_accorde','TRUNCATE accordé à anon / authenticated','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- RLS activée partout
    select count(*), string_agg(c.relname, ', ' order by c.relname) into n, s
      from pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','p')
       and not c.relrowsecurity and c.relname <> all(v_sans_rls_ok);
    select count(*) into m from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','p');
    perform public._cq_ligne(t,'SECURITE','rls_active_partout','RLS activée sur toutes les tables publiques',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then m||' tables publiques, toutes avec RLS (exceptions tolérées : '||coalesce(nullif(array_to_string(v_sans_rls_ok, ', '),''),'aucune')||')'
           else n||' table(s) sans RLS : '||left(s, 600) end,
      'Agent securite-donnees : alter table ... enable row level security + politiques');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','rls_active_partout','RLS activée sur toutes les tables publiques','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- six fonctions de tirage fermées à anon
    select count(*) filter (where has_function_privilege('anon', p.oid, 'EXECUTE')),
           string_agg(p.proname, ', ' order by p.proname) filter (where has_function_privilege('anon', p.oid, 'EXECUTE')),
           count(distinct p.proname)
      into n, s, m
      from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = any(v_fonctions_tirage);
    perform public._cq_ligne(t,'SECURITE','tirage_fonctions_fermees','Fonctions de tirage fermées à anon',
      case when n > 0 then 'rouge' when m < array_length(v_fonctions_tirage,1) then 'orange' else 'vert' end, 'bloquant',
      case when n > 0 then n||' fonction(s) exécutable(s) par anon : '||s
           when m < array_length(v_fonctions_tirage,1) then 'seulement '||m||' fonctions sur '||array_length(v_fonctions_tirage,1)||' trouvées (renommage ?)'
           else m||' fonctions de tirage sur '||m||', aucune exécutable par anon' end,
      'Agent securite-donnees : revoke execute ... from public, anon');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','tirage_fonctions_fermees','Fonctions de tirage fermées à anon','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- vérificateur du secret de relance
    select count(*), count(*) filter (where has_function_privilege('anon', p.oid, 'EXECUTE')
                                          or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
      into m, n from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'rappel_cron_verifier';
    perform public._cq_ligne(t,'SECURITE','rappel_cron_verifier','Vérificateur de la relance protégée',
      case when m = 0 or n > 0 then 'rouge' else 'vert' end, 'bloquant',
      case when m = 0 then 'fonction rappel_cron_verifier absente'
           when n > 0 then 'rappel_cron_verifier exécutable par anon ou authenticated'
           else 'présente, non exécutable par anon / authenticated' end,
      'Agent securite-donnees : rejouer sql/2026-11-20-rappel-tickets-secret.sql ou revoke execute');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','rappel_cron_verifier','Vérificateur de la relance protégée','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- secret Vault (comptage seulement)
    select count(*) into n from vault.secrets where name = 'rappel_cron_secret';
    perform public._cq_ligne(t,'SECURITE','vault_rappel_secret','Secret de relance présent dans le Vault',
      case when n = 1 then 'vert' when n = 0 then 'rouge' else 'orange' end, 'bloquant',
      n||' secret(s) nommé(s) rappel_cron_secret (valeur jamais lue)',
      'Agent securite-donnees : recréer le secret (sql/2026-11-20-rappel-tickets-secret.sql)');
  exception when others then
    perform public._cq_ligne(t,'SECURITE','vault_rappel_secret','Secret de relance présent dans le Vault','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  ---------------------------------------------------------------- INTEGRITE
  begin  -- tirages > quantité de lots
    select count(*), string_agg(x.event_id||' / '||x.lot_nom||' ('||x.n||' tirés pour '||l.q||')', ', ') into n, s
      from (select event_id, lot_nom, count(*) n from public.tirages
             where event_id is not null and lot_nom is not null and statut is distinct from 'annule'
             group by 1, 2) x
      join lateral (select sum(lo.quantite) q from public.lots lo
                     where lo.event_id = x.event_id and coalesce(lo.nom, lo.titre) = x.lot_nom) l on true
     where l.q is not null and x.n > l.q;
    perform public._cq_ligne(t,'INTEGRITE','tirages_depassent_lots','Tirages au-delà de la quantité du lot',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then 'aucun lot tiré plus de fois que sa quantité' else n||' lot(s) : '||left(s, 600) end,
      'Agent securite-donnees (puis recette-tests) : vérifier le stock et les tirages annulables');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','tirages_depassent_lots','Tirages au-delà de la quantité du lot','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- un gain par joueur et par animation (tirage pro)
    select count(*) into n from (select event_id, joueur_id from public.tirages
       where type = 'grand' and event_id is not null and super_event_id is null and joueur_id is not null
         and statut is distinct from 'annule' group by 1, 2 having count(*) > 1) x;
    perform public._cq_ligne(t,'INTEGRITE','double_gain_animation','Joueur gagnant deux fois à la même animation',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then 'aucun joueur avec plus d''un tirage actif par animation' else n||' couple(s) joueur / animation en double' end,
      'Agent securite-donnees : annuler le doublon (annuler_tirage), vérifier _tirage_un_gain_par_joueur');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','double_gain_animation','Joueur gagnant deux fois à la même animation','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- un gain par joueur et par super event
    select count(*) into n from (select super_event_id, joueur_id from public.tirages
       where type = 'grand' and super_event_id is not null and event_id is null and joueur_id is not null
         and statut is distinct from 'annule' group by 1, 2 having count(*) > 1) x;
    perform public._cq_ligne(t,'INTEGRITE','double_gain_super_event','Joueur gagnant deux fois au même Super Event',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then 'aucun joueur avec plus d''un tirage actif par Super Event' else n||' couple(s) joueur / Super Event en double' end,
      'Agent securite-donnees : annuler le doublon, vérifier tirage_super_event');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','double_gain_super_event','Joueur gagnant deux fois au même Super Event','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- tickets : au plus 2 par joueur, événement et jour
    select count(*) into n from (select joueur_id, event_id, jour from public.se_tickets
       group by 1, 2, 3 having count(*) > 2) x;
    perform public._cq_ligne(t,'INTEGRITE','tickets_plus_de_2_par_jour','Plus de 2 tickets par joueur, lieu et jour',
      case when n = 0 then 'vert' else 'rouge' end, 'bloquant',
      case when n = 0 then 'au plus 2 tickets (quiz + bonus) par joueur, événement et jour' else n||' groupe(s) au-dessus de 2' end,
      'Agent securite-donnees (puis flux-integrations) : chercher la source du doublon');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','tickets_plus_de_2_par_jour','Plus de 2 tickets par joueur, lieu et jour','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- tirages sans joueur ou joueur disparu
    select count(*) into n from public.tirages ti left join public.joueurs j on j.id = ti.joueur_id
     where ti.statut is distinct from 'annule' and (ti.joueur_id is null or j.id is null);
    perform public._cq_ligne(t,'INTEGRITE','tirages_sans_joueur','Tirages sans joueur rattaché',
      case when n = 0 then 'vert' else 'rouge' end, 'important',
      case when n = 0 then 'tous les tirages non annulés pointent vers un joueur existant' else n||' tirage(s) sans joueur ou avec joueur absent' end,
      'Agent securite-donnees : identifier les lignes (ne pas supprimer sans accord de Romain)');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','tirages_sans_joueur','Tirages sans joueur rattaché','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- participations orphelines
    select count(*) into n from public.participations p
     where p.event_id is not null and not exists (select 1 from public.events e where e.id = p.event_id);
    perform public._cq_ligne(t,'INTEGRITE','participations_orphelines','Participations dont l''événement n''existe plus',
      case when n = 0 then 'vert' else 'orange' end, 'important',
      case when n = 0 then 'toutes les participations pointent vers un événement existant' else n||' participation(s) orpheline(s)' end,
      'Agent securite-donnees : confirmer avec Romain avant tout nettoyage');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','participations_orphelines','Participations dont l''événement n''existe plus','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- événements actifs sans lot
    select count(*) into n from public.events e
     where e.status in ('upcoming','live')
       and not exists (select 1 from public.lots l where l.event_id = e.id)
       and not (e.super_event_id is not null and exists (select 1 from public.se_lots sl where sl.super_event_id = e.super_event_id));
    perform public._cq_ligne(t,'INTEGRITE','events_actifs_sans_lot','Événements à venir ou en cours sans lot',
      case when n = 0 then 'vert' else 'orange' end, 'important',
      case when n = 0 then 'tous les événements upcoming / live ont au moins un lot' else n||' événement(s) sans lot' end,
      'Agent produit-ergonomie : lots à créer ou événement à archiver');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','events_actifs_sans_lot','Événements à venir ou en cours sans lot','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  begin  -- super events à phases sans date de début
    select count(*) into n from public.super_events
     where cfg_jeu->'phases'->>'debutJeu' is not null and date_d is null;
    perform public._cq_ligne(t,'INTEGRITE','super_events_phases_sans_date','Super Events à phases sans date de début',
      case when n = 0 then 'vert' else 'orange' end, 'important',
      case when n = 0 then 'tous les Super Events à phases ont une date de début' else n||' Super Event(s) avec phases mais date_d vide' end,
      'Agent produit-ergonomie : renseigner la date de début');
  exception when others then
    perform public._cq_ligne(t,'INTEGRITE','super_events_phases_sans_date','Super Events à phases sans date de début','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  ---------------------------------------------------------------- ENVOIS
  begin  -- dernier passage du cron de rappels
    select d.status, d.start_time into st, s
      from cron.job_run_details d join cron.job j on j.jobid = d.jobid
     where j.jobname = 'tickets-rappels' order by d.start_time desc limit 1;
    select count(*) into n from cron.job_run_details d join cron.job j on j.jobid = d.jobid
     where j.jobname = 'tickets-rappels' and d.status = 'succeeded' and d.start_time > now() - interval '26 hours';
    perform public._cq_ligne(t,'ENVOIS','cron_rappels_recent','Cron des rappels de tickets passé dans les 26 h',
      case when n > 0 then 'vert' else 'rouge' end, 'important',
      case when n > 0 then 'dernier passage : '||st||' ('||s||'), '||n||' réussi(s) sur 26 h'
           when st is null then 'aucun passage enregistré (note : le statut HTTP réel est dans net._http_response)'
           else 'dernier passage : '||st||' ('||s||'), aucun succès sur 26 h' end,
      'Agent flux-integrations : lire cron.job_run_details et net._http_response, puis les journaux de rappel-tickets');
  exception when others then
    perform public._cq_ligne(t,'ENVOIS','cron_rappels_recent','Cron des rappels de tickets passé dans les 26 h','orange','info','contrôle en erreur : '||sqlerrm,'Agent flux-integrations : examiner');
  end;

  begin  -- compteur d'e-mails du jour (jour Europe/Paris, comme emails_reserver)
    select coalesce(max(e.n), 0) into n from public.emails_compteur_jour e where e.jour = (now() at time zone 'Europe/Paris')::date;
    perform public._cq_ligne(t,'ENVOIS','emails_compteur_jour','E-mails envoyés aujourd''hui (plafond 450)',
      case when n >= 450 then 'rouge' when n >= 400 then 'orange' else 'vert' end, 'important',
      n||' e-mail(s) aujourd''hui ; orange dès 400, rouge dès 450',
      'Agent flux-integrations : identifier l''émetteur, suspendre les envois non essentiels');
  exception when others then
    perform public._cq_ligne(t,'ENVOIS','emails_compteur_jour','E-mails envoyés aujourd''hui (plafond 450)','orange','info','contrôle en erreur : '||sqlerrm,'Agent flux-integrations : examiner');
  end;

  begin  -- tickets notifiés non retirés proches de l'expiration (7 jours)
    select count(*) into n from public.tirages
     where statut = 'actif' and notifie_at is not null and retire_at is null
       and valable_jusqu_au between current_date and current_date + 7;
    perform public._cq_ligne(t,'ENVOIS','tickets_proches_expiration','Lots notifiés non retirés qui expirent sous 7 jours',
      case when n = 0 then 'vert' else 'orange' end, 'info',
      n||' ticket(s) notifié(s), non retiré(s), valable(s) jusqu''à 7 jours',
      'Information : les rappels 48 h partent par le cron ; rien à corriger');
  exception when others then
    perform public._cq_ligne(t,'ENVOIS','tickets_proches_expiration','Lots notifiés non retirés qui expirent sous 7 jours','orange','info','contrôle en erreur : '||sqlerrm,'Agent flux-integrations : examiner');
  end;

  ---------------------------------------------------------------- PROPRETE
  begin  -- événements de test
    select count(*), count(*) filter (where created_at < now() - interval '48 hours') into n, m
      from public.events where id like 'ev-test-%';
    perform public._cq_ligne(t,'PROPRETE','test_events','Événements de test restants (ev-test-%)',
      case when n = 0 then 'vert' when m > 0 then 'rouge' else 'orange' end, 'important',
      n||' événement(s) de test, dont '||m||' de plus de 48 h',
      'Agent recette-tests : nettoyage à valider par Romain (DELETE confirmé)');
  exception when others then
    perform public._cq_ligne(t,'PROPRETE','test_events','Événements de test restants (ev-test-%)','orange','info','contrôle en erreur : '||sqlerrm,'Agent recette-tests : examiner');
  end;

  begin  -- super events de test
    select count(*), count(*) filter (where created_at < now() - interval '48 hours') into n, m
      from public.super_events where id like 'se-test-super-event-e2e%';
    perform public._cq_ligne(t,'PROPRETE','test_super_events','Super Events de test restants (se-test-super-event-e2e%)',
      case when n = 0 then 'vert' when m > 0 then 'rouge' else 'orange' end, 'important',
      n||' Super Event(s) de test, dont '||m||' de plus de 48 h',
      'Agent recette-tests : nettoyage à valider par Romain (DELETE confirmé)');
  exception when others then
    perform public._cq_ligne(t,'PROPRETE','test_super_events','Super Events de test restants (se-test-super-event-e2e%)','orange','info','contrôle en erreur : '||sqlerrm,'Agent recette-tests : examiner');
  end;

  begin  -- pros de test (pas de created_at : entree_p, date d'entrée)
    select count(*), count(*) filter (where entree_p is not null and entree_p < current_date - 2) into n, m
      from public.pros where id like 'pro-test-%';
    perform public._cq_ligne(t,'PROPRETE','test_pros','Pros de test restants (pro-test-%)',
      case when n = 0 then 'vert' when m > 0 then 'rouge' else 'orange' end, 'important',
      n||' pro(s) de test, dont '||m||' entrés il y a plus de 48 h (date d''entrée)',
      'Agent recette-tests : nettoyage à valider par Romain (DELETE confirmé)');
  exception when others then
    perform public._cq_ligne(t,'PROPRETE','test_pros','Pros de test restants (pro-test-%)','orange','info','contrôle en erreur : '||sqlerrm,'Agent recette-tests : examiner');
  end;

  begin  -- comptes Auth de test
    select count(*), count(*) filter (where created_at < now() - interval '48 hours') into n, m
      from auth.users where email ilike 'flowinevent+%';
    perform public._cq_ligne(t,'PROPRETE','test_comptes_auth','Comptes Auth de test restants (flowinevent+...)',
      case when n = 0 then 'vert' when m > 0 then 'rouge' else 'orange' end, 'important',
      n||' compte(s) de test, dont '||m||' de plus de 48 h',
      'Agent recette-tests : nettoyage à valider par Romain (DELETE confirmé)');
  exception when others then
    perform public._cq_ligne(t,'PROPRETE','test_comptes_auth','Comptes Auth de test restants (flowinevent+...)','orange','info','contrôle en erreur : '||sqlerrm,'Agent recette-tests : examiner');
  end;

  ---------------------------------------------------------------- PRODUIT
  begin  -- animations sans position
    select count(*) into n from public.events
     where status in ('live','upcoming') and super_event_id is null and (lat is null or lng is null);
    perform public._cq_ligne(t,'PRODUIT','animations_sans_position','Animations actives sans position (carte)',
      case when n = 0 then 'vert' else 'orange' end, 'info',
      n||' animation(s) live / upcoming sans latitude ou longitude',
      'Agent produit-ergonomie : renseigner l''adresse pour la carte');
  exception when others then
    perform public._cq_ligne(t,'PRODUIT','animations_sans_position','Animations actives sans position (carte)','orange','info','contrôle en erreur : '||sqlerrm,'Agent produit-ergonomie : examiner');
  end;

  begin  -- animations sans lot
    select count(*) into n from public.events e
     where e.status in ('live','upcoming') and e.super_event_id is null
       and not exists (select 1 from public.lots l where l.event_id = e.id);
    perform public._cq_ligne(t,'PRODUIT','animations_sans_lot','Animations actives sans lot',
      case when n = 0 then 'vert' else 'orange' end, 'info',
      n||' animation(s) live / upcoming sans lot',
      'Agent produit-ergonomie : lot à ajouter');
  exception when others then
    perform public._cq_ligne(t,'PRODUIT','animations_sans_lot','Animations actives sans lot','orange','info','contrôle en erreur : '||sqlerrm,'Agent produit-ergonomie : examiner');
  end;

  begin  -- animations sans QR
    select count(*) into n from public.events e
     where e.status in ('live','upcoming') and e.super_event_id is null
       and not exists (select 1 from public.qr_stations q where q.event_id = e.id);
    perform public._cq_ligne(t,'PRODUIT','animations_sans_qr','Animations actives sans QR',
      case when n = 0 then 'vert' else 'orange' end, 'info',
      n||' animation(s) live / upcoming sans station QR',
      'Agent creation-materiel : station QR à générer');
  exception when others then
    perform public._cq_ligne(t,'PRODUIT','animations_sans_qr','Animations actives sans QR','orange','info','contrôle en erreur : '||sqlerrm,'Agent creation-materiel : examiner');
  end;

  begin  -- pros en attente > 7 jours (date d'entrée entree_p)
    select count(*) into n from public.pros where statut = 'en_attente' and entree_p < current_date - 7;
    perform public._cq_ligne(t,'PRODUIT','pros_en_attente_7j','Pros en attente depuis plus de 7 jours',
      case when n = 0 then 'vert' else 'orange' end, 'info',
      n||' pro(s) en attente de validation (date d''entrée de plus de 7 jours ; entrée vide ignorée)',
      'Romain / Flowin : valider ou refuser les inscriptions');
  exception when others then
    perform public._cq_ligne(t,'PRODUIT','pros_en_attente_7j','Pros en attente depuis plus de 7 jours','orange','info','contrôle en erreur : '||sqlerrm,'Agent produit-ergonomie : examiner');
  end;

  ---------------------------------------------------------------- FACTURATION
  begin  -- trous dans la numérotation FL-AM-AAAA-NNNNN
    if to_regclass('public.factures_animation') is null then
      perform public._cq_ligne(t,'FACTURATION','facture_numero_trous','Numérotation des factures FL-AM','vert','important','non applicable (table factures_animation absente)','Aucune');
    else
      select count(*) filter (where numero ~ '^FL-AM-[0-9]{4}-[0-9]{5}$') into m from public.factures_animation;
      select coalesce(sum(mx - nb), 0) into n from (
        select substring(numero from 7 for 4) an, max(substring(numero from 12)::int) mx, count(distinct numero) nb
          from public.factures_animation where numero ~ '^FL-AM-[0-9]{4}-[0-9]{5}$' group by 1) x;
      perform public._cq_ligne(t,'FACTURATION','facture_numero_trous','Numérotation des factures FL-AM',
        case when n = 0 then 'vert' else 'rouge' end, 'important',
        m||' facture(s) FL-AM contrôlée(s), '||n||' numéro(s) manquant(s) dans la suite',
        'Agent facturation-crm : expliquer chaque trou (numérotation légale continue)');
    end if;
  exception when others then
    perform public._cq_ligne(t,'FACTURATION','facture_numero_trous','Numérotation des factures FL-AM','orange','info','contrôle en erreur : '||sqlerrm,'Agent facturation-crm : examiner');
  end;

  begin  -- commandes payées sans facture
    if to_regclass('public.commandes_animation') is null then
      perform public._cq_ligne(t,'FACTURATION','commandes_payees_sans_facture','Commandes payées sans facture','vert','info','non applicable (table commandes_animation absente)','Aucune');
    else
      select count(*) into n from public.commandes_animation where paiement_valide_le is not null and facture_numero is null;
      perform public._cq_ligne(t,'FACTURATION','commandes_payees_sans_facture','Commandes payées sans facture',
        case when n = 0 then 'vert' else 'orange' end, 'info',
        n||' commande(s) au paiement validé sans numéro de facture',
        'Agent facturation-crm : émettre la facture');
    end if;
  exception when others then
    perform public._cq_ligne(t,'FACTURATION','commandes_payees_sans_facture','Commandes payées sans facture','orange','info','contrôle en erreur : '||sqlerrm,'Agent facturation-crm : examiner');
  end;

  ---------------------------------------------------------------- DERIVE
  begin
    v_items := public._cq_schema_items();
    v_emp   := md5(array_to_string(v_items, E'\n'));
    select * into v_ref from public.schema_reference where id = 1;
    if not found then
      insert into public.schema_reference (id, empreinte, items) values (1, v_emp, to_jsonb(v_items));
      perform public._cq_ligne(t,'DERIVE','schema_derive','Dérive des droits et politiques','vert','important',
        'référence créée à ce passage : '||v_emp||' ('||array_length(v_items,1)||' éléments)',
        'Aucune : les prochains passages comparent à cette référence');
    elsif v_ref.empreinte = v_emp then
      perform public._cq_ligne(t,'DERIVE','schema_derive','Dérive des droits et politiques','vert','important',
        'schéma identique à la référence du '||to_char(v_ref.maj_le at time zone 'Europe/Paris','DD/MM/YYYY HH24:MI'),'Aucune');
    else
      select array_agg(i order by i) into v_plus  from unnest(v_items) i where not (v_ref.items ? i);
      select array_agg(i order by i) into v_moins from jsonb_array_elements_text(v_ref.items) i where i <> all(v_items);
      perform public._cq_ligne(t,'DERIVE','schema_derive','Dérive des droits et politiques','orange','important',
        'schéma modifié depuis la référence : +'||coalesce(array_length(v_plus,1),0)||' / -'||coalesce(array_length(v_moins,1),0)
        ||' élément(s). Ajouts : '||left(coalesce(array_to_string(v_plus[1:3], ' ; '),'aucun'), 350)
        ||' Retraits : '||left(coalesce(array_to_string(v_moins[1:3], ' ; '),'aucun'), 350),
        'Agent securite-donnees : si le changement est voulu, select public.schema_reference_rafraichir(); sinon corriger');
    end if;
  exception when others then
    perform public._cq_ligne(t,'DERIVE','schema_derive','Dérive des droits et politiques','orange','info','contrôle en erreur : '||sqlerrm,'Agent securite-donnees : examiner');
  end;

  return (select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]'::jsonb)
            from public.controles_qualite c where c.lance_le = t);
end $$;

-- 5. Dernier passage ---------------------------------------------------------------------------------------
create or replace function public.controle_qualite_dernier() returns jsonb
language sql security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]'::jsonb)
    from public.controles_qualite c
   where c.lance_le = (select max(lance_le) from public.controles_qualite);
$$;

-- 6. Droits : service_role seulement (Supabase accorde par défaut à anon / authenticated : retrait explicite)
revoke all on function public._cq_ligne(timestamptz, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public._cq_schema_items() from public, anon, authenticated;
revoke all on function public.schema_empreinte() from public, anon, authenticated;
revoke all on function public.schema_reference_rafraichir() from public, anon, authenticated;
revoke all on function public.controle_qualite_lancer() from public, anon, authenticated;
revoke all on function public.controle_qualite_dernier() from public, anon, authenticated;
grant execute on function public.schema_empreinte() to service_role;
grant execute on function public.schema_reference_rafraichir() to service_role;
grant execute on function public.controle_qualite_lancer() to service_role;
grant execute on function public.controle_qualite_dernier() to service_role;

-- 7. Tâche quotidienne 03:17 UTC (pg_cron déjà utilisé par tickets-rappels). cron.schedule avec un nom existant le met à jour.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('controle-qualite-quotidien', '17 3 * * *', 'select public.controle_qualite_lancer();');
  else
    raise notice 'pg_cron absent : tâche non créée';
  end if;
end $$;

-- Lecture : select public.controle_qualite_dernier();   (service_role / éditeur SQL)
-- Rafraîchir la référence de dérive après un changement voulu : select public.schema_reference_rafraichir();
--
-- ROLLBACK (retirer les contrôles ; ne touche à aucune donnée métier) :
--   select cron.unschedule('controle-qualite-quotidien');
--   drop function if exists public.controle_qualite_dernier();
--   drop function if exists public.controle_qualite_lancer();
--   drop function if exists public.schema_reference_rafraichir();
--   drop function if exists public.schema_empreinte();
--   drop function if exists public._cq_schema_items();
--   drop function if exists public._cq_ligne(timestamptz, text, text, text, text, text, text, text);
--   drop table if exists public.schema_reference;
--   drop table if exists public.controles_qualite;
