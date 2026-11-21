-- =============================================================================
-- SÉCURITÉ : fermer la lecture anonyme de la table public.pros (21/11/2026)
-- Doc : docs/SECURITE-pros-2026-11-21.md
-- Trouvé par le contrôle quotidien controle_qualite_lancer() (SECURITE / anon_lecture_tables_sensibles).
--
-- Le trou : la politique pros_anon_select (SELECT, anon, using true) laisse la clé publique lire
-- e-mail, téléphone, SIRET, adresse, contact de tous les professionnels. La vue v_se_commerces
-- (security_invoker) exposait aussi pro_email / pro_tel par ce biais.
--
-- PARTIE A : additive (4 fonctions SECURITY DEFINER, colonnes sans coordonnées). Applicable à tout moment.
-- PARTIE B : retrait de la politique pros_anon_select. À appliquer APRÈS le déploiement Vercel du code
--            qui appelle la partie A (le code se replie sur l'accès direct tant que A est absente).
-- Les politiques conservées : pros_admin_all (super admin), pros_self_select / pros_self_update /
-- pros_self_insert (le pro connecté, sa propre fiche), pros_anon_insert_inscription (inscription).
-- Idempotent. Rollback en pied de fichier.
-- =============================================================================

-- ═════════════════════════════ PARTIE A ═════════════════════════════════════
-- PARTIE A DÉBUT

-- A1. Fiche publique d'un pro (pages /pro rendues côté serveur sans session, ProShell, droits, scanner,
--     commandes, pro_mobile). Colonnes sans coordonnées : jamais e-mail, téléphone, SIRET, adresse exacte,
--     contact. Le pro connecté lit sa fiche complète avec sa session (pros_self_select).
create or replace function public.pro_fiche_publique(p_pro_id text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'id', p.id, 'nom', p.nom, 'nom_commercial', p.nom_commercial, 'ville', p.ville, 'secteur', p.secteur,
           'partenaire_id', p.partenaire_id, 'statut', p.statut, 'onboarding_source', p.onboarding_source,
           'droits', p.droits)
    from public.pros p
   where p_pro_id is not null and p.id = p_pro_id;
$$;

-- A2. Cet identifiant de pro est-il déjà pris ? (inscription : évite un doublon de clé sans lire la table)
create or replace function public.pro_id_existe(p_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_id is not null and exists (select 1 from public.pros p where p.id = p_id);
$$;

-- A3. Fiche partenaire liée à des pros dont l'identifiant est donné (gains et stats d'un pro).
--     Aucune énumération : seuls les identifiants demandés (200 au plus) répondent.
create or replace function public.pros_partenaires_de(p_pro_ids text[])
returns table(id text, partenaire_id text) language sql stable security definer set search_path = public as $$
  select p.id, p.partenaire_id
    from public.pros p
   where p_pro_ids is not null and cardinality(p_pro_ids) <= 200 and p.id = any (p_pro_ids);
$$;

-- A4. Parcours joueur : un commerce partenaire a-t-il aussi sa propre animation en ligne ?
--     Renvoie l'animation (identifiant, jeu) SANS l'identifiant du pro (qui peut dériver de son e-mail).
create or replace function public.jeux_propres_partenaires(p_partenaire_ids text[])
returns table(partenaire_id text, event_id text, module text) language sql stable security definer set search_path = public as $$
  select distinct on (p.partenaire_id) p.partenaire_id, e.id, e.module
    from public.pros p
    join public.events e on e.pro_id = p.id and e.status = 'live'
   where p_partenaire_ids is not null and cardinality(p_partenaire_ids) <= 200
     and p.partenaire_id is not null and p.partenaire_id = any (p_partenaire_ids)
   order by p.partenaire_id, e.created_at desc nulls last, e.id;
$$;

-- Droits : aucun droit par défaut, puis ouverture explicite (anon : parcours et pages /pro sans session).
do $$ declare f text; begin
  foreach f in array array['pro_fiche_publique(text)', 'pro_id_existe(text)', 'pros_partenaires_de(text[])',
                           'jeux_propres_partenaires(text[])'] loop
    execute 'revoke all on function public.' || f || ' from public, anon, authenticated';
    execute 'grant execute on function public.' || f || ' to anon, authenticated';
  end loop; end $$;

notify pgrst, 'reload schema';
-- PARTIE A FIN

-- ═════════════════════════════ PARTIE B ═════════════════════════════════════
-- ⚠ Après déploiement Vercel du code (commit « Sécurité pros : lecture publique par RPC ») et contrôle
--   de la checklist de la doc. Copier à partir d'ici.
-- PARTIE B DÉBUT

-- Plus de lecture anonyme de pros : une requête REST anonyme renvoie [] (RLS active, aucune politique SELECT anon).
-- Attention : un INSERT anonyme « on conflict … » est alors refusé (RLS) ; seul l'INSERT simple reste permis.
drop policy if exists pros_anon_select on public.pros;

notify pgrst, 'reload schema';
-- PARTIE B FIN

-- ═════════════════════════════ OPTIONNEL (non appliqué) ═════════════════════════
-- Retrait du DROIT de table (défense en profondeur). NON fait le 21/11 : il casserait
--   (1) l'INSERT anonyme avec « on conflict » (testé en base locale : sans politique SELECT, il est refusé par la RLS ;
--       /rejoindre est passé en INSERT simple dans le même commit) ;
--   (2) la vue v_se_commerces (security_invoker) pour anon (elle ne rend alors plus de colonnes pro, mais ne plante pas) ;
--   (3) le test de connexion du dashboard (`/rest/v1/pros?limit=1` en 401 au lieu de 200).
-- À envisager après migration de ces points :
--   revoke select on public.pros from anon;

-- ═════════════════════════════ ROLLBACK (jamais exécuté automatiquement) ═════════
-- create policy pros_anon_select on public.pros for select to anon using (true);   -- remet le trou
-- drop function if exists public.pro_fiche_publique(text);
-- drop function if exists public.pro_id_existe(text);
-- drop function if exists public.pros_partenaires_de(text[]);
-- drop function if exists public.jeux_propres_partenaires(text[]);
-- notify pgrst, 'reload schema';
