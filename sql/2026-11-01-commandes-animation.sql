-- 01/11/2026 — Commandes « Flowin Animation magasin »
-- NON APPLIQUÉ. À relire par Romain, puis à appliquer UNE fois (apply_migration, projet
-- ywcqtupgoxfzkddqkztk). Ne pas rejouer après application.
--
-- Alimente par : admin/public/bon-commande-animation.html (insert anonyme, clé publishable)
-- Mis à jour par : admin/app/api/paiement/gocardless (+ /webhook), clé service_role côté Vercel
-- Notification : fonction edge notify-commande-animation (supabase/functions/notify-commande-animation)
--
-- Chaîne : souscription -> accusé de réception (bon + virement, PAS de facture) -> paiement validé
--          (webhook GoCardless ou virement marqué reçu par le SA) -> facture émise (numéro
--          séquentiel sans trou) -> envoi contrat signé + facture acquittée -> documents_envoyes.
--
-- Statuts :
--   en_attente_paiement  commande signée, virement attendu (ou prélèvement pas encore lancé)
--   mandat_en_cours      client redirigé vers GoCardless, mandat en cours de signature / validation
--   mandat_actif         mandat SEPA actif (webhook mandates.active)
--   payee                paiement confirmé (offre mensuelle : 1er mois ; mois suivants par l'abonnement GoCardless) (webhook payments.confirmed / paid_out, ou virement reçu saisi à la main)
--   mandat_echoue        mandat refusé, annulé ou expiré
--   paiement_echoue      prélèvement échoué, annulé ou rejeté
--   documents_envoyes    paiement validé ET contrat signé + facture acquittée envoyés au client
--   annulee              commande annulée par Flowin
--
-- Sécurité :
--   * anon peut UNIQUEMENT insérer une commande neuve (statut forcé, montants recalculés en base,
--     CGV + signature obligatoires). Aucune lecture, aucune modification en anon.
--   * lecture / mise à jour : Super Admin uniquement (public.est_super_admin(), table super_admins)
--     et service_role (routes serveur, fonction edge). Un pro connecté ne voit rien.
--   * horodatage et IP de signature posés par la base (en-têtes PostgREST), pas par le navigateur.

-- ---------------------------------------------------------------------------
-- Super Admin : liste explicite d'emails autorisés (session Supabase Auth du dashboard SA).
-- À REMPLIR au moment de l'application, rien n'est inventé ici :
--   insert into public.super_admins (email) values ('[email du Super Admin à compléter]');
-- ---------------------------------------------------------------------------
create table if not exists public.super_admins (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.super_admins enable row level security;
revoke all on public.super_admins from anon, authenticated;
grant all on public.super_admins to service_role;

create or replace function public.est_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.super_admins where email = lower(coalesce(auth.jwt()->>'email', '')));
$$;
revoke all on function public.est_super_admin() from public, anon;
grant execute on function public.est_super_admin() to authenticated, service_role;

create table if not exists public.commandes_animation (
  id                          text primary key check (id ~ '^AM-[0-9]{8}-[A-Z0-9]{8}$'),
  created_at                  timestamptz not null default now(),
  statut                      text not null default 'en_attente_paiement'
                              check (statut in ('en_attente_paiement','mandat_en_cours','mandat_actif','payee','documents_envoyes','mandat_echoue','paiement_echoue','annulee')),

  -- Client (saisi par le client ; SIRET jamais inventé)
  raison_sociale              text not null check (char_length(raison_sociale) between 2 and 200),
  enseigne                    text check (char_length(enseigne) <= 200),
  siret                       text not null check (siret ~ '^[0-9]{14}$'),
  adresse                     text not null check (char_length(adresse) <= 300),
  cp                          text not null check (cp ~ '^[0-9]{5}$'),
  ville                       text not null check (char_length(ville) <= 120),
  contact_nom                 text not null check (char_length(contact_nom) <= 160),
  contact_fonction            text check (char_length(contact_fonction) <= 120),
  email                       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  tel                         text not null check (char_length(tel) <= 40),
  nb_boutiques                integer not null default 1 check (nb_boutiques between 1 and 200),
  panier_moyen                numeric(10,2) check (panier_moyen is null or panier_moyen >= 0),
  logo                        text check (logo is null or (logo like 'data:image/%' and char_length(logo) <= 2000000)),
  commercial                  text check (char_length(commercial) <= 60),
  flux_journalier             text check (flux_journalier is null or flux_journalier in ('15+','50+','100+')),

  -- Offre spéciale premiers adhérents « satisfait ou remboursé » : FORMULE ANNUELLE UNIQUEMENT
  garantie                    boolean not null default false,
  garantie_clients_objectif   integer,              -- recalculé : arrondi sup. (990 € HT ÷ panier moyen certifié)
  garantie_certifiee_le       timestamptz,          -- horodatage de la certification par le client (page Garantie)
  garantie_certifiee_par      text check (char_length(garantie_certifiee_par) <= 120),
  -- panier_moyen, flux_journalier, garantie*, certification : figés à l'insertion (trigger plus bas)

  -- Formule
  -- Formule au choix exclusif : annuelle (12 mois) OU mensuelle (3 mois minimum, puis mois par mois)
  offre                       text not null default 'annuelle' check (offre in ('annuelle','mensuelle')),
  engagement_mois             integer not null default 12 check (engagement_mois in (3, 12)),   -- forcé par le trigger
  engagement_accepte          boolean not null default false,                                   -- case « engagement 3 mois minimum »
  -- Supports au choix exclusif : kit digital (0 €) OU kit physique (149 € HT par boutique)
  kit                         text not null default 'digital' check (kit in ('digital','physique')),
  opt_quiz_qte                integer not null default 0 check (opt_quiz_qte between 0 and 20),
  opt_bonus_qte               integer not null default 0 check (opt_bonus_qte between 0 and 20),

  -- Montants (recalculés par le trigger, en euros)
  montant_abonnement_ht       numeric(10,2) not null default 0,
  montant_kit_ht              numeric(10,2) not null default 0,
  montant_options_ht          numeric(10,2) not null default 0,
  montant_ht                  numeric(10,2) not null default 0,
  montant_tva                 numeric(10,2) not null default 0,
  montant_ttc                 numeric(10,2) not null default 0,

  -- Paiement
  mode_paiement               text not null default 'virement' check (mode_paiement in ('virement','prelevement_sepa','aucun')),
  prelevement_inclut_reste    boolean not null default false,
  montant_preleve_ttc         numeric(10,2),
  gc_billing_request_id       text,
  gc_mandate_id               text,
  gc_payment_id               text,
  gc_subscription_id          text,                 -- offre mensuelle : abonnement GoCardless (mois 2 et suivants)
  gc_dernier_evenement        text,
  paiement_maj_at             timestamptz,
  paiement_valide_le          timestamptz,          -- paiement validé (webhook ou SA)
  paiement_source             text check (paiement_source in ('webhook_gocardless','admin_virement')),
  paiement_valide_par         text,                 -- email du SA, ou 'gocardless'

  -- Emails et documents
  accuse_envoye_le            timestamptz,          -- accusé de réception (bon + coordonnées de virement)
  documents_envoi_en_cours    timestamptz,          -- verrou d'envoi (idempotence)
  documents_envoyes_le        timestamptz,          -- contrat signé + facture acquittée envoyés
  documents_envois            integer not null default 0,
  espace_pro_active_le        timestamptz,          -- activation de l'espace pro au paiement validé
  espace_pro_id               text,                 -- pros.id activé (rapprochement SIRET puis email)

  -- CGV et signature électronique simple
  cgv_acceptee                boolean not null default false,
  cgv_version                 text check (char_length(cgv_version) <= 60),
  signataire_nom              text not null check (char_length(signataire_nom) between 2 and 160),
  signataire_qualite          text check (char_length(signataire_qualite) <= 120),
  signature_acceptee          boolean not null default false,
  signature_horodatage        timestamptz,          -- posé par la base (now())
  signature_horodatage_client timestamptz,          -- heure affichée au client, pour information
  signature_ip                text,                 -- posé par la base depuis les en-têtes de la requête
  user_agent                  text check (char_length(user_agent) <= 300),

  note_interne                text
);

create index if not exists commandes_animation_created_idx on public.commandes_animation (created_at desc);
create index if not exists commandes_animation_statut_idx  on public.commandes_animation (statut);
create unique index if not exists commandes_animation_gc_br_idx  on public.commandes_animation (gc_billing_request_id) where gc_billing_request_id is not null;
create index if not exists commandes_animation_gc_md_idx  on public.commandes_animation (gc_mandate_id) where gc_mandate_id is not null;
create index if not exists commandes_animation_gc_pm_idx  on public.commandes_animation (gc_payment_id) where gc_payment_id is not null;

-- ---------------------------------------------------------------------------
-- Trigger BEFORE INSERT : statut forcé, montants recalculés, horodatage + IP serveur.
-- Les prix doivent rester alignés avec admin/lib/animationMagasin.ts et les deux pages.
-- ---------------------------------------------------------------------------
create or replace function public.commandes_animation_avant_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c_annuel  constant numeric := 990;  -- offre annuelle HT
  c_mensuel constant numeric := 110;  -- offre mensuelle HT, par mois (la commande porte le 1er mois)
  c_kit     constant numeric := 149;   -- kit physique HT par boutique
  c_quiz  constant numeric := 180;   -- option quiz HT par événement
  c_bonus constant numeric := 180;   -- option questions bonus HT
  h json;
  ip text;
begin
  -- Rien de ce qui relève du paiement ne vient du navigateur
  NEW.statut := 'en_attente_paiement';
  NEW.gc_billing_request_id := null;
  NEW.gc_mandate_id := null;
  NEW.gc_payment_id := null;
  NEW.gc_subscription_id := null;
  NEW.gc_dernier_evenement := null;
  NEW.montant_preleve_ttc := null;
  NEW.paiement_maj_at := null;
  NEW.paiement_valide_le := null; NEW.paiement_source := null; NEW.paiement_valide_par := null;
  NEW.accuse_envoye_le := null; NEW.documents_envoi_en_cours := null; NEW.documents_envoyes_le := null; NEW.documents_envois := 0;
  NEW.espace_pro_active_le := null; NEW.espace_pro_id := null;
  NEW.note_interne := null;
  -- Engagement : 12 mois (annuelle) ou 3 mois minimum (mensuelle, acceptation explicite obligatoire)
  NEW.engagement_mois := case when NEW.offre = 'mensuelle' then 3 else 12 end;
  if NEW.offre = 'mensuelle' and NEW.engagement_accepte is not true then
    raise exception 'Formule mensuelle : l''engagement de 3 mois minimum doit etre accepte.' using errcode = 'P0001';
  end if;
  if NEW.offre = 'annuelle' then NEW.engagement_accepte := true; end if;
  NEW.created_at := now();
  if NEW.mode_paiement <> 'prelevement_sepa' then NEW.prelevement_inclut_reste := false; end if;

  NEW.montant_abonnement_ht := case NEW.offre when 'annuelle' then c_annuel else c_mensuel end;
  NEW.montant_kit_ht        := case when NEW.kit = 'physique' then c_kit * NEW.nb_boutiques else 0 end;
  NEW.montant_options_ht    := c_quiz * NEW.opt_quiz_qte + c_bonus * NEW.opt_bonus_qte;
  NEW.montant_ht            := NEW.montant_abonnement_ht + NEW.montant_kit_ht + NEW.montant_options_ht;
  NEW.montant_tva           := round(NEW.montant_ht * 0.20, 2);
  NEW.montant_ttc           := NEW.montant_ht + NEW.montant_tva;
  if NEW.montant_ttc = 0 then NEW.mode_paiement := 'aucun'; NEW.prelevement_inclut_reste := false;
  elsif NEW.mode_paiement = 'aucun' then NEW.mode_paiement := 'virement'; end if;

  -- Garantie : formule annuelle uniquement, données certifiées par le client obligatoires
  if NEW.offre <> 'annuelle' or NEW.panier_moyen is null or NEW.panier_moyen <= 0
     or NEW.garantie_certifiee_le is null or coalesce(NEW.garantie_certifiee_par, '') = '' then
    NEW.garantie := false;
    NEW.garantie_clients_objectif := null;
    NEW.garantie_certifiee_le := null;
    NEW.garantie_certifiee_par := null;
  elsif NEW.garantie then
    NEW.garantie_clients_objectif := ceil(c_annuel / NEW.panier_moyen);
  else
    NEW.garantie_clients_objectif := null;
  end if;

  -- Signature électronique simple : horodatage et IP côté serveur
  NEW.signature_horodatage := now();
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then h := null;
  end;
  if h is not null then
    ip := coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', nullif(trim(split_part(coalesce(h->>'x-forwarded-for',''), ',', 1)), ''));
  end if;
  NEW.signature_ip := left(ip, 64);
  return NEW;
end;
$$;

drop trigger if exists trg_commandes_animation_avant_insert on public.commandes_animation;
create trigger trg_commandes_animation_avant_insert
before insert on public.commandes_animation
for each row execute function public.commandes_animation_avant_insert();

-- ---------------------------------------------------------------------------
-- Anti-modification : données certifiées ET contrat signé figés après insertion. Aucune mise à
-- jour possible, y compris en service_role ; pour changer, nouvelle commande.
-- ---------------------------------------------------------------------------
create or replace function public.commandes_animation_donnees_figees()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.panier_moyen is distinct from OLD.panier_moyen
     or NEW.flux_journalier is distinct from OLD.flux_journalier
     or NEW.garantie is distinct from OLD.garantie
     or NEW.garantie_clients_objectif is distinct from OLD.garantie_clients_objectif
     or NEW.garantie_certifiee_le is distinct from OLD.garantie_certifiee_le
     or NEW.garantie_certifiee_par is distinct from OLD.garantie_certifiee_par
     -- contrat signé : client, formule, engagement, supports, options, montants, signature
     or NEW.raison_sociale is distinct from OLD.raison_sociale or NEW.enseigne is distinct from OLD.enseigne or NEW.siret is distinct from OLD.siret
     or NEW.offre is distinct from OLD.offre or NEW.engagement_mois is distinct from OLD.engagement_mois
     or NEW.engagement_accepte is distinct from OLD.engagement_accepte
     or NEW.kit is distinct from OLD.kit or NEW.nb_boutiques is distinct from OLD.nb_boutiques
     or NEW.opt_quiz_qte is distinct from OLD.opt_quiz_qte or NEW.opt_bonus_qte is distinct from OLD.opt_bonus_qte
     or NEW.montant_ht is distinct from OLD.montant_ht or NEW.montant_tva is distinct from OLD.montant_tva
     or NEW.montant_ttc is distinct from OLD.montant_ttc
     or NEW.cgv_version is distinct from OLD.cgv_version or NEW.signataire_nom is distinct from OLD.signataire_nom
     or NEW.signature_horodatage is distinct from OLD.signature_horodatage or NEW.signature_ip is distinct from OLD.signature_ip then
    raise exception 'Commande signee : donnees non modifiables (commande %). Creer une nouvelle commande.', OLD.id
      using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_commandes_animation_donnees_figees on public.commandes_animation;
create trigger trg_commandes_animation_donnees_figees
before update on public.commandes_animation
for each row execute function public.commandes_animation_donnees_figees();

-- ---------------------------------------------------------------------------
-- RLS minimale
-- ---------------------------------------------------------------------------
alter table public.commandes_animation enable row level security;

revoke all on public.commandes_animation from anon;
grant insert on public.commandes_animation to anon;
grant select, insert, update on public.commandes_animation to authenticated;  -- filtré par les policies SA ci-dessous
grant all on public.commandes_animation to service_role;

drop policy if exists commandes_animation_insert_public on public.commandes_animation;
create policy commandes_animation_insert_public on public.commandes_animation
  for insert to anon, authenticated
  with check (
    statut = 'en_attente_paiement'
    and cgv_acceptee is true
    and signature_acceptee is true
    and gc_billing_request_id is null
    and (offre = 'annuelle' or engagement_accepte is true)
  );

drop policy if exists commandes_animation_lecture_admin on public.commandes_animation;
create policy commandes_animation_lecture_admin on public.commandes_animation
  for select to authenticated using (public.est_super_admin());

drop policy if exists commandes_animation_maj_admin on public.commandes_animation;
create policy commandes_animation_maj_admin on public.commandes_animation
  for update to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------------
-- Notification email vers Flowin (modèle : docs/sql/nds-notify-souscription.sql)
-- À l'insert (nouvelle commande) et à chaque changement de statut de paiement.
-- Le logo (data URL) n'est pas envoyé. <ANON_KEY> = clé anon legacy du projet
-- (JWT public, par design ; à remplacer au moment de l'application, jamais un secret).
-- ---------------------------------------------------------------------------
create or replace function public.notify_commande_animation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/notify-commande-animation',
    body := jsonb_build_object(
      'type', case when TG_OP = 'INSERT' then 'nouvelle_commande'
                   when NEW.statut = 'payee' then 'paiement_valide' else 'statut' end,
      'ancien_statut', case when TG_OP = 'UPDATE' then OLD.statut else null end,
      'record', to_jsonb(NEW) - 'logo' - 'user_agent' || jsonb_build_object('a_un_logo', NEW.logo is not null)
    ),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <ANON_KEY>'),
    timeout_milliseconds := 5000
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_commande_animation_insert on public.commandes_animation;
create trigger trg_notify_commande_animation_insert
after insert on public.commandes_animation
for each row execute function public.notify_commande_animation();

drop trigger if exists trg_notify_commande_animation_statut on public.commandes_animation;
create trigger trg_notify_commande_animation_statut
after update of statut on public.commandes_animation
for each row
when (OLD.statut is distinct from NEW.statut and NEW.statut in ('mandat_actif','payee','mandat_echoue','paiement_echoue'))
execute function public.notify_commande_animation();

-- ===========================================================================
-- FACTURES « Animation magasin » : émises UNIQUEMENT quand le paiement est validé
-- ===========================================================================
-- Numérotation : série dédiée FL-AM-AAAA-NNNNN, séquentielle et SANS TROU.
-- Pas de SEQUENCE (une séquence laisse des trous si une transaction échoue) : un compteur
-- par année, verrouillé (FOR UPDATE) dans la même transaction que l'insertion de la facture.
-- Série distincte des factures NDS (FL-2026-XXXX-01, table factures) : préfixe propre.
-- Mentions reprises de admin/public/facture-nds.html (BAITA EURL, SIRET, TVA, pénalités BCE+10,
-- indemnité 40 €, pas d'escompte, TVA d'après les débits) dans la fonction edge qui édite le PDF.

create table if not exists public.factures_animation_compteur (
  annee   integer primary key,
  dernier integer not null default 0 check (dernier >= 0)
);
alter table public.factures_animation_compteur enable row level security;
revoke all on public.factures_animation_compteur from anon, authenticated;
grant all on public.factures_animation_compteur to service_role;

create table if not exists public.factures_animation (
  numero            text primary key check (numero ~ '^FL-AM-[0-9]{4}-[0-9]{5}$'),
  commande_id       text not null references public.commandes_animation(id) on delete restrict,
  objet             text not null default 'commande' check (objet in ('commande','mensualite')),
  gc_payment_id     text,                          -- mensualités GoCardless (mois 2 et suivants)
  emise_le          timestamptz not null default now(),
  payee_le          timestamptz not null,          -- facture acquittée : émise après paiement validé
  mode_paiement     text not null check (mode_paiement in ('virement','prelevement_sepa')),
  client            jsonb not null,                -- copie figée : raison sociale, SIRET, adresse, contact
  lignes            jsonb not null,                -- [{lib, det, q, ht}]
  montant_ht        numeric(10,2) not null,
  montant_tva       numeric(10,2) not null,
  montant_ttc       numeric(10,2) not null,
  jeton_public      text not null default encode(gen_random_bytes(16), 'hex')
);
create unique index if not exists factures_animation_commande_idx on public.factures_animation (commande_id) where objet = 'commande';
create unique index if not exists factures_animation_gcpay_idx on public.factures_animation (gc_payment_id) where gc_payment_id is not null;

alter table public.commandes_animation add column if not exists facture_numero text;

-- Une facture émise ne se modifie ni ne se supprime (même en service_role)
create or replace function public.factures_animation_immuable()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'Facture % emise : non modifiable, non supprimable (emettre un avoir).', OLD.numero using errcode = 'P0001';
end;
$$;
drop trigger if exists trg_factures_animation_immuable on public.factures_animation;
create trigger trg_factures_animation_immuable before update or delete on public.factures_animation
for each row execute function public.factures_animation_immuable();

alter table public.factures_animation enable row level security;
revoke all on public.factures_animation from anon;
grant select on public.factures_animation to authenticated;
grant select, insert on public.factures_animation to service_role;
drop policy if exists factures_animation_lecture_sa on public.factures_animation;
create policy factures_animation_lecture_sa on public.factures_animation for select to authenticated using (public.est_super_admin());

-- Émission (idempotente) : une seule facture « commande » par commande.
create or replace function public.emettre_facture_animation(p_commande text, p_gc_payment text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.commandes_animation%rowtype;
  n integer;
  num text;
  an integer := extract(year from now() at time zone 'Europe/Paris')::int;
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
      'lib', case when c.offre = 'annuelle' then 'Formule annuelle Flowin Animation' else 'Formule mensuelle Flowin Animation, 1er mois' end,
      'det', case when c.offre = 'annuelle' then 'Engagement 12 mois' else 'Engagement 3 mois minimum, puis 110 EUR HT par mois' end,
      'q', 1, 'ht', c.montant_abonnement_ht));
    lignes := lignes || jsonb_build_array(jsonb_build_object(
      'lib', case when c.kit = 'physique' then 'Kit physique imprime' else 'Kit digital' end,
      'det', case when c.kit = 'physique' then 'Par boutique : 1 support de caisse, 3 affiches A4, 3 macarons' else 'Fichiers a imprimer, QR inclus' end,
      'q', case when c.kit = 'physique' then c.nb_boutiques else 1 end, 'ht', c.montant_kit_ht));
    if c.opt_quiz_qte > 0 then lignes := lignes || jsonb_build_array(jsonb_build_object('lib','Option : quiz personnalise','det','180 EUR HT par evenement','q',c.opt_quiz_qte,'ht',180 * c.opt_quiz_qte)); end if;
    if c.opt_bonus_qte > 0 then lignes := lignes || jsonb_build_array(jsonb_build_object('lib','Option : questions bonus','det','180 EUR HT','q',c.opt_bonus_qte,'ht',180 * c.opt_bonus_qte)); end if;
    ht := c.montant_ht; tva := c.montant_tva;
  else
    select numero into num from public.factures_animation where gc_payment_id = p_gc_payment;
    if num is not null then return num; end if;
    if c.offre <> 'mensuelle' then raise exception 'Mensualite sur une formule annuelle (%).', p_commande; end if;
    lignes := jsonb_build_array(jsonb_build_object('lib','Formule mensuelle Flowin Animation','det','Mensualite prelevee (GoCardless ' || p_gc_payment || ')','q',1,'ht',110));
    ht := 110; tva := 22;
  end if;

  insert into public.factures_animation_compteur (annee, dernier) values (an, 0) on conflict (annee) do nothing;
  update public.factures_animation_compteur set dernier = dernier + 1 where annee = an returning dernier into n;
  num := 'FL-AM-' || an || '-' || lpad(n::text, 5, '0');

  insert into public.factures_animation (numero, commande_id, objet, gc_payment_id, payee_le, mode_paiement, client, lignes, montant_ht, montant_tva, montant_ttc)
  values (num, c.id, case when p_gc_payment is null then 'commande' else 'mensualite' end, p_gc_payment, coalesce(c.paiement_valide_le, now()),
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

-- Activation de l'espace pro au paiement validé (une seule fois) : le compte pro créé par
-- /pro/inscription ou /pro/premiere-fois arrive en pros.statut = 'en_attente' ; il passe 'valide'.
-- Rapprochement : même SIRET, sinon même email. Sans compte, rien n'est créé ici : l'email
-- « documents » invite le pro à créer son espace ; l'espace pro rappelle cette fonction à
-- l'inscription (même SIRET qu'une commande payée) pour l'activer aussitôt.
create or replace function public.activer_espace_pro_animation(p_commande text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  c public.commandes_animation%rowtype;
  pid text;
begin
  select * into c from public.commandes_animation where id = p_commande;
  if not found or c.paiement_valide_le is null then return null; end if;
  if c.espace_pro_id is not null then return c.espace_pro_id; end if;
  if to_regclass('public.pros') is null then return null; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pros' and column_name = 'statut') then return null; end if;
  execute 'select id from public.pros where (siret = $1 and $1 <> '''') or lower(email) = lower($2) order by (siret = $1) desc limit 1' into pid using c.siret, c.email;
  if pid is null then return null; end if;
  execute 'update public.pros set statut = ''valide'' where id = $1 and coalesce(statut, '''') <> ''valide''' using pid;
  update public.commandes_animation set espace_pro_id = pid, espace_pro_active_le = now() where id = c.id;
  return pid;
end;
$$;
revoke all on function public.activer_espace_pro_animation(text) from public, anon, authenticated;
grant execute on function public.activer_espace_pro_animation(text) to service_role;

-- Paiement validé (statut -> payee) : facture émise dans la même transaction, AVANT la notification
-- (les triggers AFTER s'exécutent par ordre alphabétique : trg_commandes_animation_facture < trg_notify_...)
create or replace function public.commandes_animation_facture_au_paiement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.paiement_valide_le is null then
    update public.commandes_animation set paiement_valide_le = now() where id = NEW.id;
  end if;
  perform public.emettre_facture_animation(NEW.id, null);
  perform public.activer_espace_pro_animation(NEW.id);
  return NEW;
end;
$$;
drop trigger if exists trg_commandes_animation_facture on public.commandes_animation;
create trigger trg_commandes_animation_facture
after update of statut on public.commandes_animation
for each row when (OLD.statut is distinct from NEW.statut and NEW.statut = 'payee')
execute function public.commandes_animation_facture_au_paiement();

-- ---------------------------------------------------------------------------
-- Journal des actions (qui, quand, quoi) : virement marqué reçu, renvoi, envois
-- ---------------------------------------------------------------------------
create table if not exists public.commandes_animation_journal (
  id          bigserial primary key,
  commande_id text not null references public.commandes_animation(id) on delete restrict,
  le          timestamptz not null default now(),
  par         text not null,
  action      text not null check (action in ('virement_recu','renvoi_documents','accuse_envoye','documents_envoyes','envoi_echoue','paiement_webhook')),
  details     jsonb
);
create index if not exists commandes_animation_journal_cmd_idx on public.commandes_animation_journal (commande_id, le desc);
alter table public.commandes_animation_journal enable row level security;
revoke all on public.commandes_animation_journal from anon;
grant select on public.commandes_animation_journal to authenticated;
grant select, insert on public.commandes_animation_journal to service_role;
grant usage on sequence public.commandes_animation_journal_id_seq to service_role;
drop policy if exists commandes_animation_journal_sa on public.commandes_animation_journal;
create policy commandes_animation_journal_sa on public.commandes_animation_journal for select to authenticated using (public.est_super_admin());

-- SA : « Marquer le virement reçu » (journalisé). Déclenche facture + envoi des documents.
create or replace function public.admin_marquer_virement_recu(p_commande text, p_commentaire text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  c public.commandes_animation%rowtype;
  qui text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if not public.est_super_admin() then raise exception 'Reserve au Super Admin.' using errcode = '42501'; end if;
  select * into c from public.commandes_animation where id = p_commande for update;
  if not found then raise exception 'Commande % inconnue', p_commande; end if;
  if c.statut in ('payee','documents_envoyes') then return c.statut; end if;   -- idempotent
  if c.statut = 'annulee' then raise exception 'Commande % annulee.', p_commande; end if;
  update public.commandes_animation
     set paiement_valide_le = now(), paiement_source = 'admin_virement', paiement_valide_par = qui, paiement_maj_at = now(), statut = 'payee'
   where id = p_commande;
  insert into public.commandes_animation_journal (commande_id, par, action, details)
  values (p_commande, qui, 'virement_recu', jsonb_build_object('ancien_statut', c.statut, 'commentaire', left(p_commentaire, 500), 'montant_ttc', c.montant_ttc));
  return 'payee';
end;
$$;
revoke all on function public.admin_marquer_virement_recu(text, text) from public, anon;
grant execute on function public.admin_marquer_virement_recu(text, text) to authenticated;

-- SA : « Renvoyer les documents » (contrat signé + facture), seulement si le paiement est validé.
create or replace function public.admin_renvoyer_documents(p_commande text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  c public.commandes_animation%rowtype;
  qui text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if not public.est_super_admin() then raise exception 'Reserve au Super Admin.' using errcode = '42501'; end if;
  select * into c from public.commandes_animation where id = p_commande;
  if not found then raise exception 'Commande % inconnue', p_commande; end if;
  if c.statut not in ('payee','documents_envoyes') then raise exception 'Paiement non valide : documents non envoyes.' using errcode = 'P0001'; end if;
  insert into public.commandes_animation_journal (commande_id, par, action) values (p_commande, qui, 'renvoi_documents');
  perform net.http_post(
    url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/notify-commande-animation',
    body := jsonb_build_object('type', 'renvoi_documents', 'commande_id', p_commande, 'par', qui),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <ANON_KEY>'),
    timeout_milliseconds := 5000);
  return 'envoi_demande';
end;
$$;
revoke all on function public.admin_renvoyer_documents(text) from public, anon;
grant execute on function public.admin_renvoyer_documents(text) to authenticated;

-- Fonction edge (service_role) : réserve l'envoi des documents, une seule fois sauf renvoi forcé.
-- Renvoie true si l'appelant doit envoyer ; false si déjà envoyé / envoi en cours (< 10 min).
create or replace function public.reserver_envoi_documents(p_commande text, p_force boolean default false)
returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.commandes_animation
     set documents_envoi_en_cours = now()
   where id = p_commande
     and statut in ('payee','documents_envoyes')
     and (p_force or documents_envoyes_le is null)
     and (documents_envoi_en_cours is null or documents_envoi_en_cours < now() - interval '10 minutes')
  returning true into ok;
  return coalesce(ok, false);
end;
$$;
revoke all on function public.reserver_envoi_documents(text, boolean) from public, anon, authenticated;
grant execute on function public.reserver_envoi_documents(text, boolean) to service_role;

-- Fonction edge (service_role) : envoi réussi -> documents_envoyes ; échec -> verrou libéré.
create or replace function public.terminer_envoi_documents(p_commande text, p_ok boolean, p_details jsonb default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_ok then
    update public.commandes_animation
       set documents_envoyes_le = now(), documents_envoi_en_cours = null, documents_envois = documents_envois + 1, statut = 'documents_envoyes'
     where id = p_commande;
    insert into public.commandes_animation_journal (commande_id, par, action, details) values (p_commande, 'fonction notify-commande-animation', 'documents_envoyes', p_details);
  else
    update public.commandes_animation set documents_envoi_en_cours = null where id = p_commande;
    insert into public.commandes_animation_journal (commande_id, par, action, details) values (p_commande, 'fonction notify-commande-animation', 'envoi_echoue', p_details);
  end if;
end;
$$;
revoke all on function public.terminer_envoi_documents(text, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.terminer_envoi_documents(text, boolean, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Alerte « en attente de paiement » : chaque nouvelle commande envoie déjà un email à Flowin
-- (trigger d'insertion). La vue SA signale les commandes en attente depuis plus de X jours ;
-- cette vue sert aussi à un rappel quotidien éventuel (pg_cron, à décider par Romain) :
--   select cron.schedule('rappel-commandes-animation', '17 8 * * *', $$ ... net.http_post ... $$);
-- ---------------------------------------------------------------------------
create or replace view public.commandes_animation_en_attente
with (security_invoker = true) as
select id, created_at, raison_sociale, enseigne, montant_ttc, mode_paiement, statut,
       floor(extract(epoch from (now() - created_at)) / 86400)::int as jours_attente
from public.commandes_animation
where statut in ('en_attente_paiement','mandat_en_cours','mandat_actif','paiement_echoue','mandat_echoue');
grant select on public.commandes_animation_en_attente to authenticated, service_role;

-- Vérifications après application (une requête à la fois) :
--   select count(*) from public.commandes_animation;
--   select polname, polcmd, polroles::regrole[] from pg_policy where polrelid = 'public.commandes_animation'::regclass;
--   select count(*) from public.super_admins;          -- doit être >= 1 avant d'ouvrir la vue SA
--   select * from public.factures_animation_compteur;   -- vide tant qu'aucun paiement n'est validé
