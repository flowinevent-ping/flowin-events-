-- 01/11/2026 — Commandes « Flowin Animation magasin »
-- NON APPLIQUÉ. À relire par Romain, puis à appliquer UNE fois (apply_migration, projet
-- ywcqtupgoxfzkddqkztk). Ne pas rejouer après application.
--
-- Alimente par : admin/public/bon-commande-animation.html (insert anonyme, clé publishable)
-- Mis à jour par : admin/app/api/paiement/gocardless (+ /webhook), clé service_role côté Vercel
-- Notification : fonction edge notify-commande-animation (supabase/functions/notify-commande-animation)
--
-- Statuts :
--   en_attente_paiement  commande signée, virement attendu (ou prélèvement pas encore lancé)
--   mandat_en_cours      client redirigé vers GoCardless, mandat en cours de signature / validation
--   mandat_actif         mandat SEPA actif (webhook mandates.active)
--   payee                paiement confirmé (webhook payments.confirmed / paid_out, ou virement reçu saisi à la main)
--   mandat_echoue        mandat refusé, annulé ou expiré
--   paiement_echoue      prélèvement échoué, annulé ou rejeté
--   annulee              commande annulée par Flowin
--
-- Sécurité :
--   * anon peut UNIQUEMENT insérer une commande neuve (statut forcé, montants recalculés en base,
--     CGV + signature obligatoires). Aucune lecture, aucune modification en anon.
--   * lecture / mise à jour : authenticated (session admin) et service_role (routes serveur).
--   * horodatage et IP de signature posés par la base (en-têtes PostgREST), pas par le navigateur.

create table if not exists public.commandes_animation (
  id                          text primary key check (id ~ '^AM-[0-9]{8}-[A-Z0-9]{8}$'),
  created_at                  timestamptz not null default now(),
  statut                      text not null default 'en_attente_paiement'
                              check (statut in ('en_attente_paiement','mandat_en_cours','mandat_actif','payee','mandat_echoue','paiement_echoue','annulee')),

  -- Client (saisi par le client ; SIRET jamais inventé)
  raison_sociale              text not null check (char_length(raison_sociale) between 2 and 200),
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

  -- Formule
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
  mode_paiement               text not null default 'virement' check (mode_paiement in ('virement','prelevement_sepa')),
  prelevement_inclut_reste    boolean not null default false,
  montant_preleve_ttc         numeric(10,2),
  gc_billing_request_id       text,
  gc_mandate_id               text,
  gc_payment_id               text,
  gc_dernier_evenement        text,
  paiement_maj_at             timestamptz,

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
  c_abo   constant numeric := 990;   -- abonnement annuel HT
  c_kit   constant numeric := 149;   -- kit physique HT par boutique
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
  NEW.gc_dernier_evenement := null;
  NEW.montant_preleve_ttc := null;
  NEW.paiement_maj_at := null;
  NEW.note_interne := null;
  NEW.created_at := now();
  if NEW.mode_paiement <> 'prelevement_sepa' then NEW.prelevement_inclut_reste := false; end if;

  NEW.montant_abonnement_ht := c_abo;
  NEW.montant_kit_ht        := case when NEW.kit = 'physique' then c_kit * NEW.nb_boutiques else 0 end;
  NEW.montant_options_ht    := c_quiz * NEW.opt_quiz_qte + c_bonus * NEW.opt_bonus_qte;
  NEW.montant_ht            := NEW.montant_abonnement_ht + NEW.montant_kit_ht + NEW.montant_options_ht;
  NEW.montant_tva           := round(NEW.montant_ht * 0.20, 2);
  NEW.montant_ttc           := NEW.montant_ht + NEW.montant_tva;

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
-- RLS minimale
-- ---------------------------------------------------------------------------
alter table public.commandes_animation enable row level security;

revoke all on public.commandes_animation from anon;
grant insert on public.commandes_animation to anon;
grant select, insert, update on public.commandes_animation to authenticated;
grant all on public.commandes_animation to service_role;

drop policy if exists commandes_animation_insert_public on public.commandes_animation;
create policy commandes_animation_insert_public on public.commandes_animation
  for insert to anon, authenticated
  with check (
    statut = 'en_attente_paiement'
    and cgv_acceptee is true
    and signature_acceptee is true
    and gc_billing_request_id is null
  );

drop policy if exists commandes_animation_lecture_admin on public.commandes_animation;
create policy commandes_animation_lecture_admin on public.commandes_animation
  for select to authenticated using (true);

drop policy if exists commandes_animation_maj_admin on public.commandes_animation;
create policy commandes_animation_maj_admin on public.commandes_animation
  for update to authenticated using (true) with check (true);

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
      'type', case when TG_OP = 'INSERT' then 'nouvelle_commande' else 'statut' end,
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

-- Vérifications après application (une requête à la fois) :
--   select count(*) from public.commandes_animation;
--   select polname, polcmd, polroles::regrole[] from pg_policy where polrelid = 'public.commandes_animation'::regclass;
