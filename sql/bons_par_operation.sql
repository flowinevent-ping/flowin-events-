-- LOT 6 — referentiel 41 : bon de commande et facture rattaches a CHAQUE operation.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- bons_commande portait super_event_id (toujours se-nds-2026, ecrit en dur par
-- bon-commande-nds.html) et partenaire_id. Un event autonome n avait aucun
-- moyen d avoir son bon. event_id le rattache a une station / un event ; la
-- facture suit le bon (factures.client->>bon_id).
alter table bons_commande add column if not exists event_id text;
comment on column bons_commande.event_id is 'Event (ou station) auquel le bon se rapporte. Null = bon de super event.';
create index if not exists bons_commande_event_id_idx on bons_commande(event_id);
notify pgrst, 'reload schema';
