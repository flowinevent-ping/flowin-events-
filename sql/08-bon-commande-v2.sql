-- 08 — Bon de commande v2 : préparation CRM (numérotation, export), garantie « satisfait ou remboursé »
--      souscrite APRÈS la commande (lien email / page de confirmation).
--
-- NON APPLIQUÉ. À relire puis à appliquer À LA MAIN dans Supabase (apply_migration = DDL persistant
-- immédiatement en production : ne pas rejouer). Le fichier est idempotent (if not exists / or replace).
-- Prérequis : 01 (est_super_admin) et 03 (commandes_animation, factures_animation, journal).
-- Rien ici n'est bloquant pour la facturation actuelle : tant que facturation_config.source_numerotation
-- vaut 'flowin' (valeur par défaut), le comportement est celui de 03 (FL-AM-AAAA-NNNNN).
--
-- Contenu :
--   1. Colonnes CRM sur commandes_animation et factures_animation : numero_externe, crm_id, crm_synchro_le
--   2. facturation_config (source de numérotation : 'flowin' ou 'crm')
--   3. prochain_numero_facture_animation() : l'UNIQUE endroit qui fabrique un numéro
--   4. Facture : seules les 3 colonnes CRM peuvent changer après émission (jamais le reste, jamais de suppression)
--   5. emettre_facture_animation() : appelle la fonction ci-dessus
--   6. Vue d'export export_crm_animation (devis = bons de commande + factures)
--   7. admin_enregistrer_numero_crm() : le Super Admin note le numéro / l'identifiant CRM
--   8. Garantie souscrite après coup : souscrire_garantie_animation() (+ trigger de gel réécrit)
-- Voir docs/FACTURATION-AM-numerotation-et-CRM.md.

-- ---------------------------------------------------------------------------
-- 1. Colonnes CRM (toutes facultatives, aucune n'est exigée)
-- ---------------------------------------------------------------------------
alter table public.commandes_animation
  add column if not exists numero_externe  text,         -- numéro du bon / devis dans le CRM (quand il existe)
  add column if not exists crm_id          text,         -- identifiant de la fiche dans le CRM
  add column if not exists crm_synchro_le  timestamptz;  -- dernière synchronisation réussie
alter table public.factures_animation
  add column if not exists source_numero   text not null default 'flowin' check (source_numero in ('flowin','crm')),
  add column if not exists numero_externe  text,         -- numéro légal côté CRM, si le CRM numérote
  add column if not exists crm_id          text,
  add column if not exists crm_synchro_le  timestamptz;
create index if not exists factures_animation_numero_externe_idx on public.factures_animation (numero_externe) where numero_externe is not null;

-- ---------------------------------------------------------------------------
-- 2. Configuration de facturation (une seule ligne)
--    source_numerotation = 'flowin' : le numéro légal est FL-AM-AAAA-NNNNN (comportement actuel)
--    source_numerotation = 'crm'    : le numéro légal est numero_externe (donné par le CRM) ; FL-AM reste la
--                                     référence INTERNE et continue de s'incrémenter (jamais de trou, jamais de doublon)
-- ---------------------------------------------------------------------------
create table if not exists public.facturation_config (
  id                  integer primary key check (id = 1),
  source_numerotation text not null default 'flowin' check (source_numerotation in ('flowin','crm')),
  modifie_le          timestamptz not null default now()
);
insert into public.facturation_config (id) values (1) on conflict (id) do nothing;
alter table public.facturation_config enable row level security;
revoke all on public.facturation_config from anon;
grant select on public.facturation_config to authenticated;
grant select, update on public.facturation_config to service_role;
drop policy if exists facturation_config_sa on public.facturation_config;
create policy facturation_config_sa on public.facturation_config for select to authenticated using (public.est_super_admin());

-- ---------------------------------------------------------------------------
-- 3. LA fonction de numérotation. Pour brancher un CRM plus tard, on remplace UNIQUEMENT cette fonction
--    (ou on renseigne numero_externe via admin_enregistrer_numero_crm) : les factures, les PDF et les
--    emails ne connaissent pas le détail. Compteur sans séquence (pas de trou si une transaction échoue).
-- ---------------------------------------------------------------------------
create or replace function public.prochain_numero_facture_animation()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  an integer := extract(year from now() at time zone 'Europe/Paris')::int;
  n integer;
begin
  insert into public.factures_animation_compteur (annee, dernier) values (an, 0) on conflict (annee) do nothing;
  update public.factures_animation_compteur set dernier = dernier + 1 where annee = an returning dernier into n;
  return 'FL-AM-' || an || '-' || lpad(n::text, 5, '0');
end;
$$;
revoke all on function public.prochain_numero_facture_animation() from public, anon, authenticated;
grant execute on function public.prochain_numero_facture_animation() to service_role;

-- ---------------------------------------------------------------------------
-- 4. Facture immuable, SAUF les trois colonnes de rapprochement CRM (jamais de suppression)
-- ---------------------------------------------------------------------------
create or replace function public.factures_animation_immuable()
returns trigger language plpgsql set search_path = public as $$
begin
  if TG_OP = 'UPDATE' then
    if (to_jsonb(NEW) - 'numero_externe' - 'crm_id' - 'crm_synchro_le') = (to_jsonb(OLD) - 'numero_externe' - 'crm_id' - 'crm_synchro_le') then
      return NEW;   -- seuls numero_externe, crm_id, crm_synchro_le ont changé
    end if;
  end if;
  raise exception 'Facture % emise : non modifiable, non supprimable (emettre un avoir).', OLD.numero using errcode = 'P0001';
end;
$$;
grant update (numero_externe, crm_id, crm_synchro_le) on public.factures_animation to service_role;

-- ---------------------------------------------------------------------------
-- 5. Émission de facture : même logique que 03, la numérotation passe par la fonction unique
-- ---------------------------------------------------------------------------
create or replace function public.emettre_facture_animation(p_commande text, p_gc_payment text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.commandes_animation%rowtype;
  num text;
  lignes jsonb;
  ht numeric; tva numeric;
begin
  select * into c from public.commandes_animation where id = p_commande for update;
  if not found then raise exception 'Commande % inconnue', p_commande; end if;
  if c.paiement_valide_le is null then raise exception 'Commande % : paiement non valide, pas de facture.', p_commande; end if;

  if p_gc_payment is null then
    select numero into num from public.factures_animation where commande_id = p_commande and objet = 'commande';
    if num is not null then return num; end if;
    lignes := jsonb_build_array(jsonb_build_object(
      'lib', case when c.offre = 'annuelle' then 'Formule annuelle Flowin, jeu d''animation' else 'Formule mensuelle Flowin, jeu d''animation, 1er mois' end,
      'det', case when c.offre = 'annuelle' then 'Engagement 12 mois' else 'Engagement 3 mois minimum, puis 110 EUR HT par mois' end,
      'q', 1, 'ht', c.montant_abonnement_ht));
    lignes := lignes || jsonb_build_array(jsonb_build_object(
      'lib', case when c.kit = 'physique' then 'Kit physique imprime' else 'Kit digital' end,
      'det', case when c.kit = 'physique' then 'Par boutique : 1 support de caisse, 3 affiches A4, 3 macarons' else 'Fichiers a imprimer, QR inclus' end,
      'q', case when c.kit = 'physique' then c.nb_boutiques else 1 end, 'ht', c.montant_kit_ht));
    if c.opt_quiz_qte > 0 then lignes := lignes || jsonb_build_array(jsonb_build_object('lib','Option : quiz personnalise','det','180 EUR HT par animation','q',c.opt_quiz_qte,'ht',180 * c.opt_quiz_qte)); end if;
    if c.opt_bonus_qte > 0 then lignes := lignes || jsonb_build_array(jsonb_build_object('lib','Option : questions bonus','det','180 EUR HT','q',c.opt_bonus_qte,'ht',180 * c.opt_bonus_qte)); end if;
    ht := c.montant_ht; tva := c.montant_tva;
  else
    select numero into num from public.factures_animation where gc_payment_id = p_gc_payment;
    if num is not null then return num; end if;
    if c.offre <> 'mensuelle' then raise exception 'Mensualite sur une formule annuelle (%).', p_commande; end if;
    lignes := jsonb_build_array(jsonb_build_object('lib','Formule mensuelle Flowin, jeu d''animation','det','Mensualite prelevee (GoCardless ' || p_gc_payment || ')','q',1,'ht',110));
    ht := 110; tva := 22;
  end if;

  -- UNE seule fonction de numérotation, remplaçable (voir plus haut) : la facture n'en connaît pas le détail.
  num := public.prochain_numero_facture_animation();

  insert into public.factures_animation (numero, source_numero, commande_id, objet, gc_payment_id, payee_le, mode_paiement, client, lignes, montant_ht, montant_tva, montant_ttc)
  values (num, (select source_numerotation from public.facturation_config where id = 1), c.id, case when p_gc_payment is null then 'commande' else 'mensualite' end, p_gc_payment, coalesce(c.paiement_valide_le, now()),
          case when c.mode_paiement = 'prelevement_sepa' then 'prelevement_sepa' else 'virement' end,
          jsonb_build_object('raison_sociale', c.raison_sociale, 'enseigne', c.enseigne, 'siret', c.siret, 'adresse', c.adresse, 'cp', c.cp, 'ville', c.ville,
                             'contact_nom', c.contact_nom, 'email', c.email, 'tel', c.tel),
          lignes, ht, tva, ht + tva);
  if p_gc_payment is null then update public.commandes_animation set facture_numero = num where id = c.id; end if;
  return num;
end;
$$;
revoke all on function public.emettre_facture_animation(text, text) from public, anon, authenticated;
grant execute on function public.emettre_facture_animation(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Export CRM : bons de commande (devis signés) ET factures, une ligne par document.
--    security_invoker : la RLS de l'appelant s'applique (Super Admin uniquement via les tables sources).
--    numero_legal = le numéro qui fait foi (FL-AM tant que la source est 'flowin', numero_externe si 'crm').
-- ---------------------------------------------------------------------------
create or replace view public.export_crm_animation with (security_invoker = true) as
  select 'bon_de_commande'::text as type_document,
         c.id                    as numero,
         coalesce(c.numero_externe, c.id) as numero_legal,
         c.signature_horodatage  as date_document,
         c.raison_sociale, c.siret, c.contact_nom, c.email, c.tel,
         c.adresse, c.cp, c.ville,
         c.montant_ht, c.montant_tva, c.montant_ttc,
         c.statut, c.id as reference_commande,
         c.numero_externe, c.crm_id, c.crm_synchro_le
    from public.commandes_animation c
  union all
  select 'facture'::text,
         f.numero,
         case when f.source_numero = 'crm' and f.numero_externe is not null then f.numero_externe else f.numero end,
         f.emise_le,
         f.client->>'raison_sociale', f.client->>'siret', f.client->>'contact_nom', f.client->>'email', f.client->>'tel',
         f.client->>'adresse', f.client->>'cp', f.client->>'ville',
         f.montant_ht, f.montant_tva, f.montant_ttc,
         'payee'::text, f.commande_id,
         f.numero_externe, f.crm_id, f.crm_synchro_le
    from public.factures_animation f;
grant select on public.export_crm_animation to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Le Super Admin note le rapprochement CRM (bon ou facture). Journalisé. Non bloquant.
-- ---------------------------------------------------------------------------
alter table public.commandes_animation_journal drop constraint if exists commandes_animation_journal_action_check;
alter table public.commandes_animation_journal add constraint commandes_animation_journal_action_check
  check (action in ('virement_recu','renvoi_documents','accuse_envoye','documents_envoyes','envoi_echoue','paiement_webhook','espace_pro_active','relance_paiement','garantie_souscrite','crm_rapproche'));

create or replace function public.admin_enregistrer_numero_crm(p_type text, p_numero text, p_numero_externe text, p_crm_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare cmd text;
begin
  if not public.est_super_admin() then raise exception 'Reserve au Super Admin.' using errcode = '42501'; end if;
  if p_type = 'facture' then
    update public.factures_animation set numero_externe = nullif(p_numero_externe, ''), crm_id = nullif(p_crm_id, ''), crm_synchro_le = now()
     where numero = p_numero returning commande_id into cmd;
  elsif p_type = 'bon_de_commande' then
    update public.commandes_animation set numero_externe = nullif(p_numero_externe, ''), crm_id = nullif(p_crm_id, ''), crm_synchro_le = now()
     where id = p_numero returning id into cmd;
  else raise exception 'Type inconnu (facture ou bon_de_commande).'; end if;
  if cmd is null then raise exception 'Document % introuvable.', p_numero; end if;
  insert into public.commandes_animation_journal (commande_id, par, action, details)
  values (cmd, 'super_admin', 'crm_rapproche', jsonb_build_object('type', p_type, 'numero', p_numero, 'numero_externe', p_numero_externe, 'crm_id', p_crm_id));
end;
$$;
revoke all on function public.admin_enregistrer_numero_crm(text, text, text, text) from public, anon;
grant execute on function public.admin_enregistrer_numero_crm(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Garantie « satisfait ou remboursé » souscrite APRÈS la commande (lien de l'email / page de confirmation)
--    Règles inchangées : formule annuelle, première souscription, une seule fois, puis verrouillée.
--    Les champs de contrat restent toujours figés ; seuls les champs de garantie peuvent être posés,
--    UNE fois, par la fonction ci-dessous (drapeau de transaction), tant qu'elle n'a pas été certifiée.
-- ---------------------------------------------------------------------------
create or replace function public.commandes_animation_donnees_figees()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  garantie_modifiee boolean;
  contrat_modifie boolean;
begin
  garantie_modifiee := NEW.panier_moyen is distinct from OLD.panier_moyen
     or NEW.flux_journalier is distinct from OLD.flux_journalier
     or NEW.garantie is distinct from OLD.garantie
     or NEW.garantie_clients_objectif is distinct from OLD.garantie_clients_objectif
     or NEW.garantie_certifiee_le is distinct from OLD.garantie_certifiee_le
     or NEW.garantie_certifiee_par is distinct from OLD.garantie_certifiee_par;
  contrat_modifie := NEW.type_commande is distinct from OLD.type_commande
     or NEW.raison_sociale is distinct from OLD.raison_sociale or NEW.enseigne is distinct from OLD.enseigne or NEW.siret is distinct from OLD.siret
     or NEW.offre is distinct from OLD.offre or NEW.engagement_mois is distinct from OLD.engagement_mois
     or NEW.engagement_accepte is distinct from OLD.engagement_accepte
     or NEW.kit is distinct from OLD.kit or NEW.nb_boutiques is distinct from OLD.nb_boutiques
     or NEW.opt_quiz_qte is distinct from OLD.opt_quiz_qte or NEW.opt_bonus_qte is distinct from OLD.opt_bonus_qte
     or NEW.montant_ht is distinct from OLD.montant_ht or NEW.montant_tva is distinct from OLD.montant_tva
     or NEW.montant_ttc is distinct from OLD.montant_ttc
     or NEW.cgv_version is distinct from OLD.cgv_version or NEW.signataire_nom is distinct from OLD.signataire_nom
     or NEW.signature_horodatage is distinct from OLD.signature_horodatage or NEW.signature_ip is distinct from OLD.signature_ip;
  if contrat_modifie
     or (garantie_modifiee and not (coalesce(current_setting('flowin.garantie_souscription', true), '') = 'on' and OLD.garantie_certifiee_le is null)) then
    raise exception 'Commande signee : donnees non modifiables (commande %). Creer une nouvelle commande.', OLD.id
      using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

create or replace function public.souscrire_garantie_animation(p_commande text, p_panier numeric, p_flux text, p_nom text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.commandes_animation%rowtype;
  obj integer;
  nom text := btrim(coalesce(p_nom, ''));
begin
  select * into c from public.commandes_animation where id = p_commande for update;
  if not found then raise exception 'garantie_introuvable: commande inconnue'; end if;
  if c.offre <> 'annuelle' then raise exception 'garantie_non_eligible: formule mensuelle, garantie reservee a la formule annuelle'; end if;
  if c.type_commande <> 'premiere' then raise exception 'garantie_non_eligible: renouvellement, garantie reservee a la premiere souscription'; end if;
  if c.statut = 'annulee' then raise exception 'garantie_non_eligible: commande annulee'; end if;
  if c.garantie_certifiee_le is not null then raise exception 'garantie_deja_certifiee: donnees verrouillees'; end if;
  if c.created_at < now() - interval '30 days' then raise exception 'garantie_delai: delai de 30 jours depasse'; end if;
  if p_panier is null or p_panier <= 0 or p_panier > 100000 then raise exception 'garantie_donnees: panier moyen invalide'; end if;
  if p_flux is null or p_flux not in ('15+','50+','100+') then raise exception 'garantie_donnees: flux invalide'; end if;
  if char_length(nom) < 3 or char_length(nom) > 120 then raise exception 'garantie_donnees: nom invalide'; end if;

  obj := ceil(990 / p_panier);
  perform set_config('flowin.garantie_souscription', 'on', true);
  update public.commandes_animation
     set panier_moyen = round(p_panier, 2), flux_journalier = p_flux, garantie = true,
         garantie_clients_objectif = obj, garantie_certifiee_le = now(), garantie_certifiee_par = nom
   where id = p_commande;
  perform set_config('flowin.garantie_souscription', 'off', true);

  insert into public.commandes_animation_journal (commande_id, par, action, details)
  values (p_commande, 'client', 'garantie_souscrite', jsonb_build_object('panier', p_panier, 'flux', p_flux, 'objectif', obj, 'par', nom));
  return jsonb_build_object('ok', true, 'objectif', obj);
end;
$$;
revoke all on function public.souscrire_garantie_animation(text, numeric, text, text) from public;
grant execute on function public.souscrire_garantie_animation(text, numeric, text, text) to anon, authenticated, service_role;

-- Vérifications après application (lecture seule) :
--   select * from public.facturation_config;                    -- 1 ligne, source_numerotation = 'flowin'
--   select * from public.export_crm_animation limit 5;
--   select public.prochain_numero_facture_animation();           -- ATTENTION : consomme un numéro, ne pas lancer en prod
