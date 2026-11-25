# ESSENTIEL (lu à chaque session, moins de 3 Ko)

**Qui** : Romain, propriétaire, non développeur, pressé. Français simple, réponses courtes. « Fait » = preuve ; sinon « non vérifié ».
**Projet** : Flowin Event (BAITA EURL). Next.js 14 dans `admin/`, dashboard SA vanilla `admin/public/dashboard.html` + miroir `static/`, Supabase, Vercel. Flowin Révision = autre projet, hors périmètre.

**Début de session** : lire ton fichier dans `docs/claude/univers/` et tes lignes de `docs/claude/kit/A-FAIRE.md` (+ notes ouvertes). Doute sur l'entrée : `kit/ROUTAGE.md`. Ne rien lire d'autre ; le détail s'ouvre à la demande.
**Une session = un bloc de travail sur UNE entrée** : plusieurs demandes d'affilée jusqu'à ~60 % du contexte, puis état écrit dans le fichier de l'entrée et nouvelle session. Pas de session vide.

**Règles fixes**
1. Aucun secret dans un commit.
2. `dashboard.html` = `static/dashboard.html` (MD5 identique), Acorn ES2020, `var` et `indexOf`.
3. Ne jamais modifier `NDS2026Client.tsx` ni `nds2026Design.ts`.
4. Aucune donnée inventée (`[… à compléter]`). Genre : Homme, Femme ou vide.
5. Interface : carrousel sans scroll, peu de texte, moins d'actions, jamais de violet, pas d'emoji.
6. Rien ne sort à l'extérieur (e-mail, SMS, réseaux) sans le go de Romain ; SQL en production seulement après son accord.
7. Avant push : `tsc` et `build` lus ; une branche, une PR ; fusion sur demande.
8. Fin de travail : 1 ligne `JOURNAL.md`, ta ligne `ETAT.md`, erreur dans `ERREURS.md`, règle dans `REGLES.md` (dans `docs/claude/`). Sans cela, le travail n'est pas terminé.

**À la demande seulement** : `docs/claude/ancien-CLAUDE.md`, `docs/DECISIONS-flowin-event.md`, `docs/REGISTRE-livrables-refonte.md`, `docs/ARGUMENTAIRE-flowin-event.md` (tout texte), `docs/claude/README.md` (agents).
