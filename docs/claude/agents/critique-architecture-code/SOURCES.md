# Sources à lire d'abord : critique-architecture-code
1. `CLAUDE.md` (règles critiques 1 à 7, workflow de build), `docs/ARCHITECTURE-flowin.md`, `docs/SPEC-TECHNIQUE-flowin.md`.
2. `docs/DECISIONS-flowin-event.md` (règles d'interface), `docs/REGISTRE-livrables-refonte.md` (aucune ligne supprimée).
3. `docs/claude/ERREURS.md`, `ETAT.md`, `AMELIORATIONS.md` (AMEL-PERF-01 déjà ouverte), `CONTROLES.md`.
4. Fichiers : `admin/package.json`, `admin/tsconfig.json`, `admin/next.config.js`, `admin/vercel.json`, `.github/workflows/controle-qualite.yml`, `scripts/controle/`, `admin/scripts/`.
5. `docs/claude/PLAN-DE-REPRISE.md` (retour arrière à citer dans chaque proposition).
6. Mesures : `wc -l`, `du -sh admin/public/*`, `git count-objects -vH`, `git log --stat`.
