-- REGLE AUTO : synchro des coordonnées de contact sur `partenaires`
-- S'applique à CHAQUE création/modification de partenaire (BEFORE INSERT OR UPDATE).
-- Effet : trim tel/email ; remplit contact_tel<-tel, contact_email<-email, contact_nom<-contact
--         UNIQUEMENT si le champ contact_* est vide (n'écrase jamais un contact_* déjà renseigné).
-- But : les bons de commande / factures se pré-remplissent toujours
--       (le prefill lit contact_tel||tel et contact_email||email).
-- NB : la table `pros` n'a pas ces colonnes dupliquées -> pas de trigger nécessaire.

create or replace function flowin_sync_partenaire_contact() returns trigger
language plpgsql as $fn$
begin
  NEW.tel           := nullif(btrim(NEW.tel),'');
  NEW.email         := nullif(btrim(NEW.email),'');
  NEW.contact_tel   := coalesce(nullif(btrim(NEW.contact_tel),''),   nullif(btrim(NEW.tel),''));
  NEW.contact_email := coalesce(nullif(btrim(NEW.contact_email),''), nullif(btrim(NEW.email),''));
  NEW.contact_nom   := coalesce(nullif(btrim(NEW.contact_nom),''),   nullif(btrim(NEW.contact),''));
  return NEW;
end;
$fn$;

drop trigger if exists trg_sync_partenaire_contact on partenaires;
create trigger trg_sync_partenaire_contact
  before insert or update on partenaires
  for each row execute function flowin_sync_partenaire_contact();
