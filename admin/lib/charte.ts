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

/**
 * CHARTE PRO (16/09, P6) — l espace pro prend les couleurs et la police de
 * l application joueur (charte NDS 2026, lib/nds2026Design.ts) : la saisie
 * ressemble a ce que verra le client. Valeurs relevees, aucune inventee :
 *   --ink #1c1024, --muted #8a7e93, --line #efe9f2, --purple #7C2D92,
 *   --purple-deep #5A1E6E, --magenta #E0218A, --magenta2 #8E2E9E,
 *   --card1 #2B1036, --card2 #160820 ; fond #f2edf7 (lot.html) ;
 *   champs clairs #faf7fd / #e7def0 (surcharges blanches du gabarit).
 */
export const CHARTE_PRO = {
  fond: '#f2edf7',
  carte: '#FFFFFF',
  bordure: '#efe9f2',
  bordureChamp: '#e7def0',
  champ: '#faf7fd',
  texte: '#1c1024',
  attenue: '#8a7e93',
  subtil: '#faf7fd',
  sidebar: '#2B1036',
  sidebar2: '#160820',
  accent: '#7C2D92',
  accentFonce: '#5A1E6E',
  magenta: '#E0218A',
  magenta2: '#8E2E9E',
  or: '#F5A100',
  degrade: 'linear-gradient(90deg,#8E2E9E,#E0218A)',
  filet: 'linear-gradient(90deg,#F5A100,#E0218A,#6f4bd8)',
} as const

export const POLICE_PRO = "'Manrope',system-ui,sans-serif"
