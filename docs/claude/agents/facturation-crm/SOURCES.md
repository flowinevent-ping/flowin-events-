# Sources à lire d'abord : facturation-crm

1. `docs/FACTURATION-AM-numerotation-et-CRM.md` : bons, numérotation, risque de double numérotation, les 13 questions.
2. `admin/lib/roadmap.ts` lignes 118 à 130 : « Projet câblage facturation, Jeffrey CRM » (décisions du 18/09, bloqueurs).
3. `sql/08-bon-commande-v2.sql` (colonnes CRM, `facturation_config`, `prochain_numero_facture_animation`, vue d'export) et `sql/2026-11-10-lot-a.sql` (commande et paiement à la publication).
4. `docs/audit-2026-11-07/v4/facturation.md` : chaînes A et B, conformité (CGI art. 242 nonies A, L.441-9).
5. `docs/rapatriement-compte-maitre.md` : comptes, projets Supabase (dont `pxqeelvavgzfyrwtgmib` sous 3opconsult), piège des connecteurs.
6. `docs/CGV-flowin-animation-magasin-PROJET.md`, `admin/public/bon-commande-animation.html`, `admin/lib/documentsAnimation.ts`.
7. `docs/claude/ACCES.md`, `docs/claude/ERREURS.md` (e-mails, connecteurs).
