/**
 * CHARTE — source unique des couleurs et de la police du dashboard SA et de
 * l espace pro (famille J, constats 16 et 17 de docs/audit-parcours.html).
 *
 * Les couleurs etaient redeclarees a quatre endroits (globals.css, ProShell,
 * proui.ts, apercu). Elles viennent maintenant d ici pour tout le code React ;
 * app/dashboard/globals.css garde ses variables CSS, aux MEMES valeurs.
 * Police : la police systeme sur les deux surfaces d administration ;
 * Manrope reste reservee au parcours joueur.
 */
export const CHARTE = {
  fond: '#F1F5F9',
  carte: '#FFFFFF',
  bordure: '#E2E8F0',
  texte: '#0F172A',
  attenue: '#64748B',
  subtil: '#F8FAFC',
  sidebar: '#1E293B',
  sidebar2: '#172033',
  accent: '#7C2D92',
  accentClair: '#A855F7',
  accentFonce: '#6B248A',
} as const

export const POLICE_ADMIN = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif'

/** Les variables --sa-* telles que les declare app/dashboard/globals.css. */
export const VARIABLES_CSS = `--sa-bg:${CHARTE.fond};--sa-card:${CHARTE.carte};--sa-border:${CHARTE.bordure};--sa-text:${CHARTE.texte};--sa-muted:${CHARTE.attenue};--sa-subtle:${CHARTE.subtil};--sa-accent:${CHARTE.accent};--sa-accent-light:${CHARTE.accentClair};--sa-accent-dark:${CHARTE.accentFonce};`
