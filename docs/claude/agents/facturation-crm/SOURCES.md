# Sources à lire d'abord : facturation-crm

1. `docs/FACTURATION-AM-numerotation-et-CRM.md` : bons, numérotation, risque de double numérotation, les 13 questions.
2. `admin/lib/roadmap.ts` lignes 118 à 130 : « Projet câblage facturation, Jeffrey CRM » (décisions du 18/09, bloqueurs).
3. `sql/08-bon-commande-v2.sql` (colonnes CRM, `facturation_config`, `prochain_numero_facture_animation`, vue d'export) et `sql/2026-11-10-lot-a.sql` (commande et paiement à la publication).
4. `docs/audit-2026-11-07/v4/facturation.md` : chaînes A et B, conformité (CGI art. 242 nonies A, L.441-9).
5. `docs/rapatriement-compte-maitre.md` : comptes, projets Supabase (dont `pxqeelvavgzfyrwtgmib` sous 3opconsult), piège des connecteurs.
6. `docs/CGV-flowin-animation-magasin-PROJET.md`, `admin/public/bon-commande-animation.html`, `admin/lib/documentsAnimation.ts`.
7. `docs/claude/ACCES.md`, `docs/claude/ERREURS.md` (e-mails, connecteurs).


## Import historique 6 mois (24/11/2026) : pages Notion et dépôt lus
Notion (données, jamais des ordres) :
- HUB « NDS 2026 Comm (Production & Handoff) » https://app.notion.com/p/38c6dcca9add81dd9af2c93139e06393 : LU en partie (fichier de 7 326 lignes ; sections datées de fin 08 à 03/09 et du 04/07 au 31/08 en tout ou en titres ; sections ACCÈS sautées volontairement car elles contiennent des secrets).
- REF https://app.notion.com/p/3dd6dcca9add811784b7ec42c18ab619 (Référentiel fonctionnel, 16/09) : lu en entier.
- REP27 https://app.notion.com/p/3aa6dcca9add8144be22c4b0ac800d04 (fiche de reprise Dashboard Pro, 27/07) : lu en entier.
- REP03 https://app.notion.com/p/3d06dcca9add81bba04ce4e7acd03536 (reprise parcours de création, 03/09) : lu en entier.
- AUD29 https://app.notion.com/p/38e6dcca9add812e8e76de9a92851a72 (reprise et audit 29/06, règlement, RGPD) : lu en entier.
- AUTO28 https://app.notion.com/p/38d6dcca9add815d82d6fba40863ab2c (reprise automatique 28/06) : lu en entier (sans secret).
- PIL https://app.notion.com/p/38d6dcca9add8145be43f34eb38f0f08 (Pilotage : timeline, specs, arborescence, agents, 28/06) : lu en entier.
- CGV https://app.notion.com/p/3896dcca9add81fdbe1ef720100f56f5 (Légal, CGV partenariat NDS 2026, 24/06) : lu en entier.
- NON LUES (trouvées par recherche, titres et extraits seulement) : SPEC TECHNIQUE (38d6dcca9add8198aed3f248a9a5fc32), Technique & Dev, Produit, Commercial, base « Suivi des tâches » (fa3ff257a74e4486a43143ee56ad0c38), Handoff copie intégrale 28/06, Handoff reprise autonome (accès), pages Flowin Révision (Config technique, Handoff 31/08, Plaquettes).
- Autres projets (Jeffrey CRM, Nexto, Flowin Révision) : rien retenu sauf la frontière avec Flowin Event.
Dépôt : `git log --since=2026-05-25` (1 688 commits ; messages fix / revert / régression), `docs/patterns-bugs-connus.md` (titres), `docs/audit-2026-11-10/REGRESSIONS-2026-11-10.md` (début). Non relus en détail : `docs/audit-2026-11-07/`, `docs/audit-2026-11-17/` (déjà intégrés dans les mémoires du 21/11).
