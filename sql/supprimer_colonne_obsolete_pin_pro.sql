-- Suppression de partenaires.pin_pro, colonne obsolete.
-- Appliquee le 04/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- Le vrai PIN est `partenaires.code_pin` : c est lui qui est imprime sur les
-- fiches de retrait remises aux partenaires NDS (verifie dans
-- admin/public/kit-partenaires/procedure/ : Nook 9153, Utile 2684, identiques a
-- code_pin), et c est la seule colonne que lit verifier_pin_pro().
--
-- `pin_pro` portait des valeurs DIFFERENTES sur les 11 partenaires, jamais
-- distribuees et jamais lues : aucune ligne de code du depot ne la reference,
-- et docs/RUNBOOK-cloture-super-event.md la signalait deja comme obsolete.
-- Elle ne cassait rien mais ressemblait assez a la vraie pour etre lue par
-- erreur -- ce qui est arrive le 04/09, ou elle a fait croire a une faille.
--
-- Valeurs sauvegardees avant suppression, pour pouvoir revenir en arriere :
--   pt-bergerie 3122 · pt-carrosserie-gp 8662 · pt-charvolin 9340
--   pt-cycles963 5104 · pt-giordano 5271 · pt-nds-digital 5835
--   pt-nook 8193 · pt-pegase 1880 · pt-safer 1681 · pt-utile 3416
--   pt-vence 3097
--
-- Verifie apres application : plus qu une seule colonne PIN sur partenaires,
-- et verifier_pin_pro() repond true sur le bon code, false sur un faux.

alter table partenaires drop column if exists pin_pro;

comment on column partenaires.code_pin is
  'PIN a 4 chiffres remis au commercant. Authentifie la validation d un billet en caisse et ouvre son espace. Confidentiel : ne jamais afficher cote client. Conserve ici pour pouvoir le lui redonner. SEULE colonne PIN du projet : la colonne pin_pro, obsolete et jamais distribuee, a ete supprimee le 04/09/2026.';
