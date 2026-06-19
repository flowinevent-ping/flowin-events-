-- docs/sql/nds-bons-commande.sql
-- DEJA APPLIQUE EN PROD (migrations create_bons_commande_nds + trg_notify_bon_commande, 19/06/2026).
-- Bon de commande remplissable/signable (bon-commande-nds.html) :
--   client remplit + signe + valide -> insert dans bons_commande -> sa copie (PDF via impression)
--   + mail a flowinevent@gmail.com avec lien ?id=<id> qui recharge le doc rempli+signe.
-- Teste bout-en-bout OK : insert -> net.http_post -> notify-bon-commande -> Resend 200 {ok:true}.
-- Auth header trigger = cle anon (JWT public, par design). <ANON_KEY> = cle anon legacy projet.

create table if not exists public.bons_commande (
  id text primary key,
  created_at timestamptz not null default now(),
  super_event_id text default 'se-nds-2026',
  raison_sociale text, adresse text, cp text, ville text,
  contact text, tel text, email text, siret text,
  offre text, offre_label text,
  montant_ht numeric, montant_tva numeric, montant_ttc numeric,
  signataire text, date_signature text, signature text,
  statut text default 'recu'
);
alter table public.bons_commande enable row level security;
drop policy if exists "public rw bons_commande" on public.bons_commande;
create policy "public rw bons_commande" on public.bons_commande for all using (true) with check (true);
-- NB securite : id = token aleatoire non devinable (capability URL). A durcir avec le reste (cf audit RLS).

create or replace function public.notify_bon_commande()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/notify-bon-commande',
    body := jsonb_build_object('record', to_jsonb(NEW) - 'signature'),
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
    timeout_milliseconds := 5000
  );
  return NEW;
end; $$;
drop trigger if exists trg_notify_bon_commande on public.bons_commande;
create trigger trg_notify_bon_commande after insert on public.bons_commande
for each row execute function public.notify_bon_commande();
