-- =============================================================================
-- sql/2026-11-20-resultats-tirage-inapp.sql — RÉSULTAT DE TIRAGE DANS L'APPLICATION (20/11/2026)
--
-- Règle de Romain : aucun email ni SMS aux clients, sauf les relances (email du billet gagnant,
-- rappel 48 h). Le participant qui n'a pas gagné n'est donc PAS prévenu par email : il voit un message
-- dans ses notifications Flowin (/moi, rubrique « Alertes »).
--
-- CE QUE FAIT CE FICHIER (additif, idempotent, rejouable) :
--   1. Palier 'resultat' ajouté à joueur_notifications_palier_check (les paliers existants sont conservés)
--      + colonne resultat_id (rattachement à tirage_resultats) + index unique (un message par résultat).
--   2. _notifier_resultats_tirage() (appelée par enregistrer_resultats_tirage et _super, donc par le trigger
--      events_resultats_apres_tirage à « Terminer le tirage ») ne fait plus d'appel HTTP vers la fonction
--      d'email send-resultat-tirage : elle écrit une notification 'resultat' pour chaque participant au
--      résultat 'perdu'. Les gagnants ne reçoivent rien ici : leur lot arrive par la chaîne existante
--      (billet dans /moi, email du billet gagnant = relance).
--      Le réglage events.cfg.tirage.notifierPerdants = false éteint toujours ce message.
--   3. mes_notifications(p_joueur_id) : mêmes colonnes et mêmes deux branches qu'avant (lots, annonces),
--      plus une branche 'resultat' : titre « Pas de lot cette fois », message court, nom du commerce.
--
-- CONFIDENTIALITÉ / CONSENTEMENT
--   - Un participant ne lit que SES lignes (p_joueur_id, filtre sur joueur_notifications.joueur_id ET
--     tirage_resultats.joueur_id). Le message ne contient aucune donnée d'un autre joueur : pas de nom du
--     gagnant, pas de nombre de participants, pas d'email.
--   - Message transactionnel dans l'application (pas d'email, pas de SMS, aucune offre commerciale).
--     Par prudence il suit tout de même le choix du participant pour le commerce, comme les annonces :
--     si clients_commerce.optin = false pour ce commerce, le message n'est pas affiché.
--     Le résultat reste lisible dans « Mes tickets » (mes_resultats_tirage, sql/10-resultats-tirage.sql).
--
-- PRÉREQUIS : sql/10-resultats-tirage.sql (tirage_resultats, trigger) et sql/2026-11-18-annonces-pro.sql
-- (colonne annonce_id, branche 'annonce' de mes_notifications) — tous deux déjà en base.
--
-- ROLLBACK : bloc commenté tout en bas.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Palier 'resultat' + rattachement au résultat de tirage
-- -----------------------------------------------------------------------------
alter table public.joueur_notifications
  add column if not exists resultat_id uuid references public.tirage_resultats(id) on delete cascade;

alter table public.joueur_notifications drop constraint if exists joueur_notifications_palier_check;
alter table public.joueur_notifications add constraint joueur_notifications_palier_check
  check (palier in ('30j', '15j', '48h', 'cadeau', 'relance', 'annonce', 'resultat'));

create unique index if not exists joueur_notifications_resultat_unique
  on public.joueur_notifications (resultat_id) where resultat_id is not null;

-- -----------------------------------------------------------------------------
-- 2. Écriture des notifications « pas de lot cette fois » à la fin d'un tirage
--    (même signature qu'avant : les deux fonctions enregistrer_resultats_tirage* l'appellent telle quelle)
-- -----------------------------------------------------------------------------
create or replace function public._notifier_resultats_tirage(p_event_id text, p_super_event_id text, p_ref text, p_cfg jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Réglage du commerce : false = pas de message aux participants non tirés
  if coalesce(p_cfg -> 'tirage' ->> 'notifierPerdants', 'true') = 'false' then return; end if;

  -- Une notification par participant non tiré de CE tirage, une seule fois (index unique sur resultat_id)
  insert into joueur_notifications (joueur_id, palier, resultat_id)
  select tr.joueur_id, 'resultat', tr.id
    from tirage_resultats tr
   where tr.statut = 'perdu'
     and tr.tirage_ref = p_ref
     and coalesce(tr.event_id, '') = coalesce(p_event_id, '')
     and coalesce(tr.super_event_id, '') = coalesce(p_super_event_id, '')
  on conflict do nothing;

  -- notifie_le : message déposé dans l'application (plus aucun email de résultat)
  update tirage_resultats tr
     set notifie_le = now()
   where tr.statut = 'perdu' and tr.notifie_le is null
     and tr.tirage_ref = p_ref
     and coalesce(tr.event_id, '') = coalesce(p_event_id, '')
     and coalesce(tr.super_event_id, '') = coalesce(p_super_event_id, '');
end;
$$;
revoke all on function public._notifier_resultats_tirage(text, text, text, jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Lecture par le participant : mes_notifications + branche 'resultat'
--    Les branches « lots » et « annonces » sont reprises à l'identique de la base (18/11).
-- -----------------------------------------------------------------------------
create or replace function public.mes_notifications(p_joueur_id uuid)
returns table (id uuid, tirage_id bigint, palier text, created_at timestamptz, vu_le timestamptz,
               lot_nom text, retrait_token text, valable_jusqu_au date,
               titre text, message text, lien text, commerce text)
language sql
stable
security definer
set search_path = public
as $$
  select * from (
    select n.id, n.tirage_id, n.palier, n.created_at, n.vu_le, t.lot_nom, t.retrait_token, t.valable_jusqu_au,
           null::text, null::text, null::text, null::text
      from joueur_notifications n join tirages t on t.id = n.tirage_id
     where n.joueur_id = p_joueur_id and t.retire_at is null
    union all
    select n.id, null::bigint, n.palier, n.created_at, n.vu_le, null::text, null::text, a.date_fin,
           a.titre, a.message, a.lien,
           coalesce(nullif(p.nom_commercial, ''), nullif(p.nom, ''), '[commerce à compléter]')
      from joueur_notifications n
      join annonces_pro a on a.id = n.annonce_id
      left join pros p on p.id = a.pro_id
     where n.joueur_id = p_joueur_id and n.palier = 'annonce'
       and (a.date_fin is null or a.date_fin >= current_date)
       and not exists (select 1 from clients_commerce c
                        where c.pro_id = a.pro_id and c.joueur_id = p_joueur_id and c.optin = false)
    union all
    -- Résultat de tirage : « Pas de lot cette fois » (participant non tiré, ses lignes uniquement)
    select n.id, null::bigint, n.palier, n.created_at, n.vu_le, null::text, null::text, null::date,
           'Pas de lot cette fois'::text,
           'Le tirage est terminé. Merci d’avoir joué, à bientôt.'::text,
           null::text,
           coalesce(nullif(p.nom_commercial, ''), nullif(p.nom, ''), nullif(se.nom, ''), '[commerce à compléter]')
      from joueur_notifications n
      join tirage_resultats tr on tr.id = n.resultat_id
      left join events ev on ev.id = tr.event_id
      left join pros p on p.id = ev.pro_id
      left join super_events se on se.id = coalesce(tr.super_event_id, ev.super_event_id)
     where n.joueur_id = p_joueur_id and n.palier = 'resultat'
       and tr.joueur_id = p_joueur_id and tr.statut = 'perdu'
       and not exists (select 1 from clients_commerce c
                        where c.pro_id = ev.pro_id and c.joueur_id = p_joueur_id and c.optin = false)
  ) x
  order by 4 desc limit 50;
$$;

grant execute on function public.mes_notifications(uuid) to anon, authenticated;

commit;

-- =============================================================================
-- ROLLBACK (à exécuter à la main si besoin ; ne touche à aucun autre palier)
-- =============================================================================
-- begin;
-- delete from public.joueur_notifications where palier = 'resultat';
-- drop index if exists public.joueur_notifications_resultat_unique;
-- alter table public.joueur_notifications drop column if exists resultat_id;
-- alter table public.joueur_notifications drop constraint if exists joueur_notifications_palier_check;
-- alter table public.joueur_notifications add constraint joueur_notifications_palier_check
--   check (palier in ('30j', '15j', '48h', 'cadeau', 'relance', 'annonce'));
-- -- mes_notifications : rejouer la définition de sql/2026-11-18-annonces-pro.sql (sections A, deux branches)
-- -- _notifier_resultats_tirage : rejouer la section 4 de sql/10-resultats-tirage.sql (appel email, non déployé)
-- commit;
