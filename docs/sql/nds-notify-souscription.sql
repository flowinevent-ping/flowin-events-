-- docs/sql/nds-notify-souscription.sql
-- DEJA APPLIQUE EN PROD (migration trg_notify_souscription_partenaire_nds, 18/06/2026).
-- Teste bout-en-bout OK : insert tag nds-landing -> net.http_post -> edge fn -> Resend 200 {ok:true}.
--
-- Declenche la notification email a chaque souscription partenaire issue de la landing
-- (nds-partenaire.html insere dans partenaires avec tags contenant 'nds-landing').
-- Le trigger NE se declenche PAS pour les ajouts manuels dashboard (pas de tag nds-landing).
--
-- Auth : le header Authorization porte la cle anon (JWT public, par design) -> verify_jwt OK.
-- <ANON_KEY> = cle anon legacy du projet (recuperable via dashboard > Settings > API Keys).

create or replace function public.notify_souscription_partenaire()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/notify-souscription',
    body := jsonb_build_object('record', to_jsonb(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    timeout_milliseconds := 5000
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_souscription_partenaire on public.partenaires;

create trigger trg_notify_souscription_partenaire
after insert on public.partenaires
for each row
when (NEW.tags @> ARRAY['nds-landing']::text[])
execute function public.notify_souscription_partenaire();
