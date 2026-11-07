-- ============================================================================
-- sql/2026-11-07-securite-ecritures.sql
-- Securite des ECRITURES : pros, partenaires, factures, bons_commande,
-- demandes_rattachement_super_event + RPC approuver / refuser / valider_lot.
--
-- NE PAS REJOUER A L'AVEUGLE : a appliquer UNE fois (apply_migration), apres relecture.
-- Le script est idempotent (DROP POLICY IF EXISTS, CREATE OR REPLACE, blocs DO
-- testant l'existence) : le rejouer ne casse rien.
--
-- Constat avant (lu en base le 07/11/2026) :
--   pros          : pros_anon_write (anon ALL true)        -> n'importe qui modifie / supprime un pro
--   partenaires   : flowin_anon_all_partenaires (public ALL true)
--   factures      : anon INSERT/SELECT/UPDATE true + authenticated ALL true (un pro connecte supprime tout)
--   bons_commande : idem factures
--   demandes_rattachement_super_event : anon INSERT true, anon UPDATE true, SELECT public
--   approuver_demande_rattachement(bigint) : SECURITY DEFINER, aucun controle, executable par anon
--   valider_lot(token, pin) : PIN vide accepte ; le PIN est compare au numero de billet
--   sync_bon_to_partenaire() : trigger SECURITY INVOKER qui ecrit partenaires
--     (il casserait la signature publique d'un bon une fois partenaires ferme)
--
-- Principe apres :
--   * ecritures admin = role `authenticated` ET public.est_super_admin()
--     (le dashboard Next envoie desormais le jeton admin, cf. admin/lib/supabase.ts) ;
--   * le pro ne modifie que SA ligne pros / SA fiche partenaires, et jamais les
--     colonnes de statut (trigger de garde) ;
--   * anon : uniquement les flux publics recenses, colonnes / etats bornes ;
--   * factures : plus aucune ecriture anon ni pro ;
--   * LECTURES : inchangees (voir « reste ouvert » en fin de fichier).
--
-- Section RETOUR ARRIERE en fin de fichier (commentee) : restaure exactement les
-- policies et fonctions d'avant.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------------

-- Vrai si p_auth est un compte Supabase Auth cree depuis moins de 2 jours et
-- sans fiche pro : autorise l'inscription pro « sans session » (email a confirmer),
-- ou le signUp ne renvoie pas encore de jeton et l'insert part en anon.
create or replace function public.compte_pro_neuf(p_auth uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select p_auth is not null
     and exists (select 1 from auth.users u where u.id = p_auth and u.created_at > now() - interval '2 days')
     and not exists (select 1 from public.pros p where p.auth_id = p_auth);
$$;
revoke all on function public.compte_pro_neuf(uuid) from public;
grant execute on function public.compte_pro_neuf(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. PROS
-- ---------------------------------------------------------------------------
-- Ecrivains recenses :
--   anon  : inscription pro sans session (lib/inscriptionPro.ts, components/pro/PremiereFois.tsx),
--           rejoindre en visiteur (app/rejoindre/[se]/RejoindreClient.tsx, insert seul, statut en_attente)
--   pro   : sa fiche (components/pro/EntrepriseForm.tsx) ; inscription avec session
--   admin : lib/dashboard.ts upsertPro/deletePro, OpsDetailClient.tsx (jeton SA)
--   triggers SECURITY DEFINER : trg_bon_vers_pro, approuver_demande_rattachement (inchanges)

drop policy if exists pros_anon_write on public.pros;
drop policy if exists pros_anon_insert_inscription on public.pros;
drop policy if exists pros_self_insert on public.pros;
drop policy if exists pros_admin_all on public.pros;

create policy pros_anon_insert_inscription on public.pros
  for insert to anon
  with check (
    statut = 'en_attente'
    and coalesce(abonne, false) = false
    and partenaire_id is null
    and acces_active_at is null
    and (auth_id is null or public.compte_pro_neuf(auth_id))
  );

create policy pros_self_insert on public.pros
  for insert to authenticated
  with check (
    auth_id = auth.uid()
    and statut = 'en_attente'
    and coalesce(abonne, false) = false
    and partenaire_id is null
    and acces_active_at is null
  );

-- pros_self_update (auth_id = auth.uid()) est conserve tel quel.

create policy pros_admin_all on public.pros
  for all to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

-- Garde de colonnes : un pro (ou anon) ne change jamais son statut, son abonnement,
-- son rattachement commerce, son compte d'acces ni son identifiant. Les fonctions
-- SECURITY DEFINER (current_user = proprietaire) et le super admin ne sont pas bornes.
create or replace function public.pros_garde_colonnes()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.est_super_admin() then
    new.id              := old.id;
    new.statut          := old.statut;
    new.abonne          := old.abonne;
    new.partenaire_id   := old.partenaire_id;
    new.auth_id         := old.auth_id;
    new.acces_active_at := old.acces_active_at;
  end if;
  return new;
end $$;

drop trigger if exists trg_pros_garde_colonnes on public.pros;
create trigger trg_pros_garde_colonnes
  before update on public.pros
  for each row execute function public.pros_garde_colonnes();

-- ---------------------------------------------------------------------------
-- 2. PARTENAIRES
-- ---------------------------------------------------------------------------
-- Ecrivains recenses :
--   anon  : landing NDS (app/nds/NdsClient.tsx, public/nds-partenaire.html), sponsor
--           (app/sponsor/[se]/SponsorClient.tsx) -> prospect INSERT seul (ignore-duplicates)
--   pro   : sa fiche commerce (components/pro/EntrepriseForm.tsx : image, liens, adresse, tel)
--   admin : dashboard.html (PATCH lots / DELETE, jeton SA deja), lib/dashboard.ts,
--           ModalPartenaires.tsx, BlocsOperations.tsx, ActionsFichePro.tsx (code_pin)
--   triggers : sync_bon_to_partenaire (passe SECURITY DEFINER ci-dessous),
--              assurer_fiche_commerce (DEFINER)

drop policy if exists flowin_anon_all_partenaires on public.partenaires;
drop policy if exists partenaires_lecture_publique on public.partenaires;
drop policy if exists partenaires_insert_prospect on public.partenaires;
drop policy if exists partenaires_pro_update on public.partenaires;
drop policy if exists partenaires_admin_all on public.partenaires;

-- Lecture inchangee (parcours joueurs, cartes, billets) -- voir « reste ouvert ».
create policy partenaires_lecture_publique on public.partenaires
  for select to anon, authenticated
  using (true);

-- Prospect / sponsor depuis une page publique : fiche inactive, invisible, non payee, sans PIN.
create policy partenaires_insert_prospect on public.partenaires
  for insert to anon, authenticated
  with check (
    (id like 'prosp-nds-%' or id like 'part-%')
    and actif = false
    and visible = false
    and coalesce(en_avant, false) = false
    and coalesce(statut_paiement, 'en_attente') in ('prospect', 'en_attente', 'en_attente_reglement')
    and coalesce(code_pin, '') = ''
    and coalesce(facture_emise, false) = false
  );

-- Le pro modifie la fiche commerce rattachee a SA ligne pros.
create policy partenaires_pro_update on public.partenaires
  for update to authenticated
  using (id in (select p.partenaire_id from public.pros p where p.auth_id = auth.uid() and p.partenaire_id is not null))
  with check (id in (select p.partenaire_id from public.pros p where p.auth_id = auth.uid() and p.partenaire_id is not null));

create policy partenaires_admin_all on public.partenaires
  for all to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

-- Garde de colonnes cote pro : pas d'auto-activation, de paiement, de PIN, de lots.
create or replace function public.partenaires_garde_colonnes()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.est_super_admin() then
    new.id                 := old.id;
    new.actif              := old.actif;
    new.visible            := old.visible;
    new.en_avant           := old.en_avant;
    new.statut_paiement    := old.statut_paiement;
    new.montant_sponsoring := old.montant_sponsoring;
    new.facture_emise      := old.facture_emise;
    new.code_pin           := old.code_pin;
    new.lots               := old.lots;
    new.super_event_id     := old.super_event_id;
    new.pack               := old.pack;
    new.offre              := old.offre;
    new.tickets_par_scan   := old.tickets_par_scan;
  end if;
  return new;
end $$;

drop trigger if exists trg_partenaires_garde_colonnes on public.partenaires;
create trigger trg_partenaires_garde_colonnes
  before update on public.partenaires
  for each row execute function public.partenaires_garde_colonnes();

-- Trigger bon -> partenaire : SECURITY DEFINER (sinon la signature publique d'un bon
-- echoue des que partenaires est ferme a anon). Hors super admin, il ne fait plus
-- que COMPLETER les champs vides (un bon anonyme ne peut plus ecraser l'adresse /
-- le tel / l'email d'un commerce existant en reprenant sa raison sociale).
create or replace function public.sync_bon_to_partenaire()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.est_super_admin() then
    update partenaires set
      adresse       = coalesce(nullif(new.adresse, ''), adresse),
      contact_tel   = coalesce(nullif(new.tel, ''),     contact_tel),
      contact_email = coalesce(nullif(new.email, ''),   contact_email)
    where nom = new.raison_sociale;
  else
    update partenaires set
      adresse       = coalesce(nullif(adresse, ''),       nullif(new.adresse, '')),
      contact_tel   = coalesce(nullif(contact_tel, ''),   nullif(new.tel, '')),
      contact_email = coalesce(nullif(contact_email, ''), nullif(new.email, ''))
    where nom = new.raison_sociale;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 3. FACTURES : plus aucune ecriture anon ni pro
-- ---------------------------------------------------------------------------
-- Ecrivains recenses : facture-nds.html (session admin obligatoire, jeton SA),
-- RPC emettre_facture_animation / commandes_animation_facture_au_paiement (DEFINER).
-- Lecture publique d'une facture : RPC facture_publique(numero, jeton).

drop policy if exists factures_anon_insert on public.factures;
drop policy if exists factures_anon_update on public.factures;
drop policy if exists factures_admin_all on public.factures;
drop policy if exists factures_lecture_authentifiee on public.factures;

-- Lecture conservee pour les connectes (lib/operations.ts cote pro la lit) -- voir « reste ouvert ».
create policy factures_lecture_authentifiee on public.factures
  for select to authenticated
  using (true);

create policy factures_admin_all on public.factures
  for all to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());
-- factures_anon_select est conservee (lecture) -- voir « reste ouvert ».

-- ---------------------------------------------------------------------------
-- 4. BONS DE COMMANDE
-- ---------------------------------------------------------------------------
-- Ecrivains recenses :
--   anon  : bons-prets/0x-bon-commande-*.html (bon pre-rempli SIGNE par le commerce, POST)
--           bon-commande-nds.html en lien public ?jeton= : signature -> RPC signer_bon_commande_public
--   admin : bon-commande-nds.html (session admin obligatoire), lib/commercial.ts majBonCommande
--   triggers : fn_bon_commande_chain (DEFINER), trg_bon_vers_pro (DEFINER),
--              notify_bon_commande, sync_bon_to_partenaire (DEFINER ci-dessus)

drop policy if exists bons_commande_anon_update on public.bons_commande;
drop policy if exists bons_commande_anon_insert on public.bons_commande;
drop policy if exists bons_commande_admin_all on public.bons_commande;
drop policy if exists bons_commande_lecture_authentifiee on public.bons_commande;

-- Insert public = uniquement un bon deja signe, CGV acceptees, sans jeton ni rattachement.
create policy bons_commande_anon_insert on public.bons_commande
  for insert to anon
  with check (
    statut = 'signe'
    and coalesce(signature, '') <> ''
    and cgv_acceptee_at is not null
    and jeton_public is null
    and partenaire_id is null
    and event_id is null
  );

create policy bons_commande_lecture_authentifiee on public.bons_commande
  for select to authenticated
  using (true);

create policy bons_commande_admin_all on public.bons_commande
  for all to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());
-- bons_commande_anon_select est conservee (lecture) -- voir « reste ouvert ».

-- Signature publique d'un bon par son lien a jeton : seules les colonnes de signature,
-- seulement si le bon n'est pas deja signe.
create or replace function public.signer_bon_commande_public(
  p_id text, p_jeton text, p_signature text, p_signataire text,
  p_date_signature text, p_cgv_version text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_n int;
begin
  if coalesce(btrim(p_jeton), '') = '' then
    return jsonb_build_object('ok', false, 'erreur', 'jeton manquant');
  end if;
  if coalesce(p_signature, '') not like 'data:image/png;base64,%' or length(p_signature) > 2000000 then
    return jsonb_build_object('ok', false, 'erreur', 'signature invalide');
  end if;
  update bons_commande set
    statut          = 'signe',
    signature       = p_signature,
    signataire      = left(coalesce(nullif(btrim(p_signataire), ''), raison_sociale, ''), 200),
    date_signature  = left(coalesce(nullif(btrim(p_date_signature), ''), to_char(now(), 'DD/MM/YYYY')), 40),
    cgv_version     = left(coalesce(p_cgv_version, ''), 40),
    cgv_acceptee_at = now()
  where id = p_id
    and jeton_public = p_jeton
    and coalesce(signature, '') = '';
  get diagnostics v_n = row_count;
  if v_n = 0 then
    return jsonb_build_object('ok', false, 'erreur', 'bon introuvable, jeton invalide ou deja signe');
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.signer_bon_commande_public(text, text, text, text, text, text) from public;
grant execute on function public.signer_bon_commande_public(text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. DEMANDES DE RATTACHEMENT
-- ---------------------------------------------------------------------------
-- Ecrivains recenses :
--   anon  : RejoindreClient.tsx ; ParcoursCreation.tsx (pro sans session, email a confirmer)
--   pro   : ParcoursCreation.tsx (session pro) -> demandes_self_insert
--   admin : dashboard/demandes-rattachement (geocodage lat/lng, refus), ParcoursCreation mode SA,
--           RPC approuver_demande_rattachement (DEFINER, controle ajoute ci-dessous)

drop policy if exists demandes_anon_update on public.demandes_rattachement_super_event;
drop policy if exists demandes_public_insert on public.demandes_rattachement_super_event;
drop policy if exists demandes_self_insert on public.demandes_rattachement_super_event;
drop policy if exists demandes_admin_all on public.demandes_rattachement_super_event;

create policy demandes_public_insert on public.demandes_rattachement_super_event
  for insert to anon
  with check (
    coalesce(statut, 'en_attente') = 'en_attente'
    and event_id is null
    and traite_at is null
    and note_sa is null
  );

create policy demandes_self_insert on public.demandes_rattachement_super_event
  for insert to authenticated
  with check (
    pro_id in (select pros.id from public.pros where pros.auth_id = auth.uid())
    and coalesce(statut, 'en_attente') = 'en_attente'
    and event_id is null
    and traite_at is null
    and note_sa is null
  );

create policy demandes_admin_all on public.demandes_rattachement_super_event
  for all to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());
-- « lecture demandes rattachement » (SELECT public true) conservee -- voir « reste ouvert ».

-- approuver : on conserve le corps d'origine sous un nom interne NON executable par les
-- clients, et on expose un enveloppe qui exige est_super_admin().
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_approuver_demande_rattachement_sans_controle'
                   and pronamespace = 'public'::regnamespace) then
    alter function public.approuver_demande_rattachement(bigint)
      rename to _approuver_demande_rattachement_sans_controle;
  end if;
end $$;
revoke all on function public._approuver_demande_rattachement_sans_controle(bigint) from public, anon, authenticated;

create or replace function public.approuver_demande_rattachement(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.est_super_admin() then
    return jsonb_build_object('ok', false, 'erreur', 'reserve au super admin');
  end if;
  return public._approuver_demande_rattachement_sans_controle(p_id);
end $$;
revoke all on function public.approuver_demande_rattachement(bigint) from public;
grant execute on function public.approuver_demande_rattachement(bigint) to authenticated;

create or replace function public.refuser_demande_rattachement(p_id bigint, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_n int;
begin
  if not public.est_super_admin() then
    return jsonb_build_object('ok', false, 'erreur', 'reserve au super admin');
  end if;
  update demandes_rattachement_super_event
     set statut = 'refusee', traite_at = now(),
         note_sa = coalesce(nullif(btrim(p_note), ''), note_sa)
   where id = p_id and statut is distinct from 'validee';
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'erreur', 'demande introuvable ou deja approuvee'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.refuser_demande_rattachement(bigint, text) from public;
grant execute on function public.refuser_demande_rattachement(bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. VALIDER_LOT : PIN pro obligatoire
-- ---------------------------------------------------------------------------
-- Appelants : public/lot.html (PIN deja saisi a l'ecran precedent, desormais transmis),
-- components/pro/GagnantsClient.tsx (idem). Meme controle que verifier_pin_pro, mais :
-- PIN vide refuse ; billet sans commerce rattache -> pas de PIN possible -> reserve
-- au super admin. Le super admin connecte valide sans PIN.
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_valider_lot_sans_pin'
                   and pronamespace = 'public'::regnamespace) then
    alter function public.valider_lot(text, text) rename to _valider_lot_sans_pin;
  end if;
end $$;
revoke all on function public._valider_lot_sans_pin(text, text) from public, anon, authenticated;

create or replace function public.valider_lot(p_token text, p_pin text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare v_id bigint; v_pt text;
begin
  select id into v_id from tirages where retrait_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'raison', 'introuvable'); end if;

  if not public.est_super_admin() then
    if p_pin is null or length(btrim(p_pin)) = 0 then
      return jsonb_build_object('ok', false, 'raison', 'pin_requis',
        'message', 'Code professionnel requis.');
    end if;
    v_pt := partenaire_du_tirage(v_id);
    if v_pt is null then
      return jsonb_build_object('ok', false, 'raison', 'pin_requis',
        'message', 'Aucun commerce rattache a ce billet : validation par l''equipe Flowin.');
    end if;
    if not exists (select 1 from partenaires pa
                    where pa.id = v_pt and coalesce(btrim(pa.code_pin), '') <> ''
                      and pa.code_pin = btrim(p_pin)) then
      return jsonb_build_object('ok', false, 'raison', 'pin_invalide',
        'message', 'Code professionnel incorrect.');
    end if;
  end if;

  -- PIN controle ci-dessus : on appelle le corps d'origine sans sa comparaison au n° de billet.
  return public._valider_lot_sans_pin(p_token, null);
end $$;
revoke all on function public.valider_lot(text, text) from public;
grant execute on function public.valider_lot(text, text) to anon, authenticated;

commit;

-- ============================================================================
-- RESTE OUVERT (non traite ici, pour ne rien casser) :
--   * LECTURES anon : pros (pros_anon_select true : email, tel, siret de tous les pros,
--     IDOR ?pro=), partenaires (contact_email, contact_tel, code_pin lisible -> le PIN
--     de retrait est lisible par anon !), factures / bons_commande (anon_select true),
--     demandes (SELECT public). A fermer par vues / RPC dediees + revoke de colonnes.
--   * Le dashboard Next charge ses donnees cote serveur (layout) avec la cle publique.
--   * Pas de limitation d'essais sur valider_lot / verifier_pin_pro (PIN a 4 chiffres ?).
-- ============================================================================

-- ============================================================================
-- RETOUR ARRIERE (a executer A LA MAIN si besoin ; restaure l'etat du 07/11/2026)
-- ============================================================================
-- begin;
-- -- pros
-- drop trigger if exists trg_pros_garde_colonnes on public.pros;
-- drop function if exists public.pros_garde_colonnes();
-- drop policy if exists pros_anon_insert_inscription on public.pros;
-- drop policy if exists pros_admin_all on public.pros;
-- drop policy if exists pros_self_insert on public.pros;
-- create policy pros_self_insert on public.pros for insert to authenticated with check (auth_id = auth.uid());
-- drop policy if exists pros_anon_write on public.pros;
-- create policy pros_anon_write on public.pros for all to anon using (true) with check (true);
-- drop function if exists public.compte_pro_neuf(uuid);
-- -- partenaires
-- drop trigger if exists trg_partenaires_garde_colonnes on public.partenaires;
-- drop function if exists public.partenaires_garde_colonnes();
-- drop policy if exists partenaires_lecture_publique on public.partenaires;
-- drop policy if exists partenaires_insert_prospect on public.partenaires;
-- drop policy if exists partenaires_pro_update on public.partenaires;
-- drop policy if exists partenaires_admin_all on public.partenaires;
-- drop policy if exists flowin_anon_all_partenaires on public.partenaires;
-- create policy flowin_anon_all_partenaires on public.partenaires for all to public using (true) with check (true);
-- create or replace function public.sync_bon_to_partenaire() returns trigger language plpgsql
--   security invoker as $f$
-- BEGIN
--   UPDATE partenaires SET
--     adresse       = COALESCE(NULLIF(NEW.adresse,''), adresse),
--     contact_tel   = COALESCE(NULLIF(NEW.tel,''),   contact_tel),
--     contact_email = COALESCE(NULLIF(NEW.email,''), contact_email)
--   WHERE nom = NEW.raison_sociale;
--   RETURN NEW;
-- END; $f$;
-- alter function public.sync_bon_to_partenaire() reset search_path;
-- -- factures
-- drop policy if exists factures_lecture_authentifiee on public.factures;
-- drop policy if exists factures_admin_all on public.factures;
-- create policy factures_admin_all on public.factures for all to authenticated using (true) with check (true);
-- drop policy if exists factures_anon_insert on public.factures;
-- create policy factures_anon_insert on public.factures for insert to anon with check (true);
-- drop policy if exists factures_anon_update on public.factures;
-- create policy factures_anon_update on public.factures for update to anon using (true) with check (true);
-- -- bons_commande
-- drop policy if exists bons_commande_lecture_authentifiee on public.bons_commande;
-- drop policy if exists bons_commande_admin_all on public.bons_commande;
-- create policy bons_commande_admin_all on public.bons_commande for all to authenticated using (true) with check (true);
-- drop policy if exists bons_commande_anon_insert on public.bons_commande;
-- create policy bons_commande_anon_insert on public.bons_commande for insert to anon with check (true);
-- drop policy if exists bons_commande_anon_update on public.bons_commande;
-- create policy bons_commande_anon_update on public.bons_commande for update to anon using (true) with check (true);
-- drop function if exists public.signer_bon_commande_public(text, text, text, text, text, text);
-- -- demandes
-- drop policy if exists demandes_admin_all on public.demandes_rattachement_super_event;
-- drop policy if exists demandes_public_insert on public.demandes_rattachement_super_event;
-- create policy demandes_public_insert on public.demandes_rattachement_super_event for insert to anon with check (true);
-- drop policy if exists demandes_self_insert on public.demandes_rattachement_super_event;
-- create policy demandes_self_insert on public.demandes_rattachement_super_event for insert to authenticated
--   with check (pro_id in (select pros.id from pros where pros.auth_id = auth.uid()));
-- drop policy if exists demandes_anon_update on public.demandes_rattachement_super_event;
-- create policy demandes_anon_update on public.demandes_rattachement_super_event for update to anon using (true) with check (true);
-- drop function if exists public.refuser_demande_rattachement(bigint, text);
-- drop function if exists public.approuver_demande_rattachement(bigint);
-- alter function public._approuver_demande_rattachement_sans_controle(bigint) rename to approuver_demande_rattachement;
-- grant execute on function public.approuver_demande_rattachement(bigint) to public, anon, authenticated;
-- -- valider_lot (le corps d'origine, avec sa comparaison au n° de billet, revient tel quel)
-- drop function if exists public.valider_lot(text, text);
-- alter function public._valider_lot_sans_pin(text, text) rename to valider_lot;
-- grant execute on function public.valider_lot(text, text) to public, anon, authenticated;
-- commit;
