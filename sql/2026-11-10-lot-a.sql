-- =============================================================================
-- Lot A (10/11/2026) — Commande et paiement à la publication d'une animation
-- NON APPLIQUÉ. À relire puis appliquer par Romain (SQL editor ou apply_migration), une seule fois.
--
-- Grille unique (admin/lib/reglement.ts, décision de Romain) :
--   1re année 445 € HT (offre « lancement », -50 %), puis 990 € HT / an ou 110 € HT / mois ;
--   option quiz rédigés par Flowin (30 questions + 5 bonus) : forfait 145 € HT, 72,50 € HT la 1re année.
--
-- Ce que fait ce fichier :
--   1. commandes_animation.offre accepte 'lancement' (contrainte CHECK) ;
--   2. trigger BEFORE INSERT supplémentaire (s'exécute APRÈS trg_commandes_animation_avant_insert, ordre
--      alphabétique) : recalcule abonnement + option quiz à la nouvelle grille, sans toucher au trigger existant ;
--   3. colonnes event_id + paiement_declare_le sur commandes_animation, RPC publique declarer_virement_animation
--      (appelée par bon-commande-animation.html à la déclaration du virement ; absente = ignorée par la page) ;
--   4. journal : action 'paiement_declare' (fonction edge notify-commande-animation) ;
--   5. emettre_facture_animation : libellés et montants de la nouvelle grille (reprise de la version EN PROD).
--
-- Pas de migration nécessaire sur events : l'animation en attente utilise events.status = 'pending'
-- (valeur déjà connue de l'app, aucune contrainte) et events.cfg.paiement (jsonb).
-- =============================================================================

begin;

-- 1. Offre de lancement --------------------------------------------------------
alter table public.commandes_animation drop constraint if exists commandes_animation_offre_check;
alter table public.commandes_animation add constraint commandes_animation_offre_check
  check (offre in ('lancement', 'annuelle', 'mensuelle'));

-- 2. Prix du Lot A, recalculés en base -------------------------------------------
create or replace function public.commandes_animation_prix_lot_a()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c_lancement  constant numeric := 445;
  c_annuel     constant numeric := 990;
  c_mensuel    constant numeric := 110;
  c_quiz       constant numeric := 145;
  c_quiz_lanc  constant numeric := 72.5;
begin
  if NEW.offre = 'lancement' then NEW.engagement_mois := 12; NEW.engagement_accepte := true; end if;
  NEW.montant_abonnement_ht := case NEW.offre when 'lancement' then c_lancement when 'annuelle' then c_annuel else c_mensuel end;
  -- option quiz Flowin : forfait unique (0 ou 1) ; les questions bonus sont incluses (plus vendues seules)
  NEW.opt_quiz_qte := least(coalesce(NEW.opt_quiz_qte, 0), 1);
  NEW.opt_bonus_qte := 0;
  NEW.montant_options_ht := case when NEW.opt_quiz_qte > 0 then (case when NEW.offre = 'lancement' then c_quiz_lanc else c_quiz end) else 0 end;
  NEW.montant_ht  := NEW.montant_abonnement_ht + NEW.montant_kit_ht + NEW.montant_options_ht;
  NEW.montant_tva := round(NEW.montant_ht * 0.20, 2);
  NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
  return NEW;
end;
$$;
drop trigger if exists trg_commandes_animation_zz_prix_lot_a on public.commandes_animation;
create trigger trg_commandes_animation_zz_prix_lot_a
before insert on public.commandes_animation
for each row execute function public.commandes_animation_prix_lot_a();

-- 3. Lien animation + déclaration du virement ------------------------------------
alter table public.commandes_animation add column if not exists event_id text;
alter table public.commandes_animation add column if not exists paiement_declare_le timestamptz;

create or replace function public.declarer_virement_animation(p_commande text, p_event text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  -- Ne touche que ces deux champs, seulement sur une commande encore en attente ; jamais le statut de paiement.
  update public.commandes_animation
     set paiement_declare_le = coalesce(paiement_declare_le, now()),
         event_id = coalesce(event_id, left(p_event, 100))
   where id = p_commande and statut = 'en_attente_paiement';
  if not found then return false; end if;
  insert into public.commandes_animation_journal (commande_id, par, action, details)
  values (p_commande, 'client (bon de commande)', 'paiement_declare', jsonb_build_object('event_id', left(p_event, 100)));
  return true;
end;
$$;
revoke all on function public.declarer_virement_animation(text, text) from public;
grant execute on function public.declarer_virement_animation(text, text) to anon, authenticated;

-- NB : le trigger « données figées » (commandes_animation_donnees_figees) ne doit pas bloquer ces deux colonnes :
-- il compare une liste explicite de colonnes (offre, montants, signature…), event_id / paiement_declare_le n'y sont pas.

-- 4. Journal ---------------------------------------------------------------------
alter table public.commandes_animation_journal drop constraint if exists commandes_animation_journal_action_check;
alter table public.commandes_animation_journal add constraint commandes_animation_journal_action_check
  check (action in ('virement_recu','renvoi_documents','accuse_envoye','documents_envoyes','envoi_echoue','paiement_webhook','espace_pro_active','relance_paiement','paiement_declare'));

-- 5. Facture : grille du Lot A (reprise de la définition en production le 10/11/2026) -------------
create or replace function public.emettre_facture_animation(p_commande text, p_gc_payment text default null)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare
  c public.commandes_animation%rowtype;
  n integer; num text;
  an integer := extract(year from now() at time zone 'Europe/Paris')::int;
  lignes jsonb; ht numeric; tva numeric;
begin
  select * into c from public.commandes_animation where id = p_commande for update;
  if not found then raise exception 'Commande % inconnue', p_commande; end if;
  if c.paiement_valide_le is null then raise exception 'Commande % : paiement non valide, pas de facture.', p_commande; end if;
  if p_gc_payment is null then
    select numero into num from public.factures_animation where commande_id = p_commande and objet = 'commande';
    if num is not null then return num; end if;
    lignes := jsonb_build_array(jsonb_build_object(
      'lib', case c.offre when 'lancement' then 'Premiere annee Flowin, jeu d''animation (offre de lancement -50 %)'
                          when 'annuelle' then 'Formule annuelle Flowin, jeu d''animation'
                          else 'Formule mensuelle Flowin, jeu d''animation, 1er mois' end,
      'det', case c.offre when 'lancement' then 'Engagement 12 mois, puis 990 EUR HT par an ou 110 EUR HT par mois, reconduction tacite'
                          when 'annuelle' then 'Engagement 12 mois, reconduction tacite'
                          else 'Prelevement SEPA, 110 EUR HT par mois, reconduction tacite' end,
      'q', 1, 'ht', c.montant_abonnement_ht));
    lignes := lignes || jsonb_build_array(jsonb_build_object(
      'lib', case when c.kit = 'physique' then 'Kit physique imprime' else 'Kit digital' end,
      'det', case when c.kit = 'physique' then 'Par boutique : 1 support de caisse, 3 affiches A4, 3 macarons' else 'Fichiers a imprimer, QR inclus' end,
      'q', case when c.kit = 'physique' then c.nb_boutiques else 1 end, 'ht', c.montant_kit_ht));
    if c.opt_quiz_qte > 0 then lignes := lignes || jsonb_build_array(jsonb_build_object('lib','Option : quiz rediges par Flowin','det','30 questions quiz + 5 questions bonus, forfait 145 EUR HT' || case when c.offre = 'lancement' then ', -50 % la 1re annee' else '' end,'q',1,'ht',c.montant_options_ht)); end if;
    ht := c.montant_ht; tva := c.montant_tva;
  else
    select numero into num from public.factures_animation where gc_payment_id = p_gc_payment;
    if num is not null then return num; end if;
    if c.offre <> 'mensuelle' then raise exception 'Mensualite sur une formule annuelle (%).', p_commande; end if;
    lignes := jsonb_build_array(jsonb_build_object('lib','Formule mensuelle Flowin, jeu d''animation','det','Mensualite prelevee (GoCardless ' || p_gc_payment || ')','q',1,'ht',110));
    ht := 110; tva := 22;
  end if;
  insert into public.factures_animation_compteur (annee, dernier) values (an, 0) on conflict (annee) do nothing;
  update public.factures_animation_compteur set dernier = dernier + 1 where annee = an returning dernier into n;
  num := 'FL-AM-' || an || '-' || lpad(n::text, 5, '0');
  insert into public.factures_animation (numero, commande_id, objet, gc_payment_id, payee_le, mode_paiement, client, lignes, montant_ht, montant_tva, montant_ttc)
  values (num, c.id, case when p_gc_payment is null then 'commande' else 'mensualite' end, p_gc_payment, coalesce(c.paiement_valide_le, now()),
          case when c.mode_paiement = 'prelevement_sepa' then 'prelevement_sepa' else 'virement' end,
          jsonb_build_object('raison_sociale', c.raison_sociale, 'enseigne', c.enseigne, 'siret', c.siret, 'adresse', c.adresse, 'cp', c.cp, 'ville', c.ville, 'contact_nom', c.contact_nom, 'email', c.email, 'tel', c.tel),
          lignes, ht, tva, ht + tva);
  if p_gc_payment is null then update public.commandes_animation set facture_numero = num where id = c.id; end if;
  return num;
end;
$function$;

commit;

-- =============================================================================
-- ROLLBACK (à exécuter seulement pour revenir en arrière ; échoue si des commandes 'lancement' existent :
-- les passer d'abord en 'annuelle' ou les annuler)
-- =============================================================================
-- begin;
-- drop trigger if exists trg_commandes_animation_zz_prix_lot_a on public.commandes_animation;
-- drop function if exists public.commandes_animation_prix_lot_a();
-- drop function if exists public.declarer_virement_animation(text, text);
-- alter table public.commandes_animation drop column if exists paiement_declare_le;
-- alter table public.commandes_animation drop column if exists event_id;
-- alter table public.commandes_animation drop constraint if exists commandes_animation_offre_check;
-- alter table public.commandes_animation add constraint commandes_animation_offre_check check (offre in ('annuelle', 'mensuelle'));
-- delete from public.commandes_animation_journal where action = 'paiement_declare';
-- alter table public.commandes_animation_journal drop constraint if exists commandes_animation_journal_action_check;
-- alter table public.commandes_animation_journal add constraint commandes_animation_journal_action_check
--   check (action in ('virement_recu','renvoi_documents','accuse_envoye','documents_envoyes','envoi_echoue','paiement_webhook','espace_pro_active','relance_paiement'));
-- -- emettre_facture_animation : rejouer la définition précédente (libellés 990/110, quiz 180 x qté, bonus 180 x qté),
-- -- telle que relevée en production le 10/11/2026 (voir l'en-tête de la section 5, seules les lignes 'lib'/'det'/quiz diffèrent).
-- commit;
