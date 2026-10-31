-- ============================================================================
-- COMMANDES ANIMATION <-> COMPTE PRO (31/10/2026)
-- ============================================================================
-- A APPLIQUER A LA MAIN, APRES sql/2026-11-01-commandes-animation.sql
-- (table commandes_animation) et APRES sql/pros_onboarding_entreprise.sql.
--
-- 1. Relie une commande au compte pro cree par « Ma premiere fois »
--    (/pro/premiere-fois -> /bon-commande-animation.html). Tant que la
--    colonne n'existe pas, le bon de commande renvoie la commande sans elle.
-- 2. ACTIVATION AUTOMATIQUE (A VALIDER PAR ROMAIN AVANT APPLICATION) :
--    quand le paiement est confirme (virement marque « payee » par le SA, ou
--    mandat GoCardless actif), la fiche pro passe de « en_attente » a
--    « valide ». Si l'on prefere garder la validation manuelle du SA, ne pas
--    appliquer la partie 2.
-- ============================================================================

-- 1. Lien commande -> pro
alter table public.commandes_animation add column if not exists pro_id text references public.pros(id) on delete set null;
create index if not exists commandes_animation_pro_idx on public.commandes_animation (pro_id) where pro_id is not null;

-- 2. Activation de l'espace pro au paiement
create or replace function public.activer_pro_apres_paiement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.pro_id is not null and NEW.statut in ('payee', 'mandat_actif') then
    update public.pros set statut = 'valide' where id = NEW.pro_id and coalesce(statut, '') = 'en_attente';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_activer_pro_apres_paiement on public.commandes_animation;
create trigger trg_activer_pro_apres_paiement
after update of statut on public.commandes_animation
for each row
when (OLD.statut is distinct from NEW.statut)
execute function public.activer_pro_apres_paiement();
