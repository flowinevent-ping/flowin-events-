# Flowin — SaaS Gamification événementiel
**OPConsult BAITA EURL** · Romain Collin · v28 · Mai 2026

## Architecture — 3 déploiements Vercel séparés

| Dossier | URL cible | Accès | Rôle |
|---------|-----------|-------|------|
| `/admin` | flowin-admin.vercel.app | Privé — PIN SA | Dashboard SA + PRO |
| `/landing` | flowin.fr | Public | Landing B2B prospection |
| `/parcours` | flowin-jeu.vercel.app | Public — QR code | Parcours joueur |

## Sécurité
- `/admin` jamais exposé publiquement — accès PIN + Auth Supabase
- `/landing` et `/parcours` — écriture joueurs uniquement via RLS Supabase
- Données CRM invisibles côté participant

## Stack
Vanilla JS/HTML/CSS · Supabase eu-west-1 · Vercel · GitHub
LS_KEY : `flowin_v28_data`
