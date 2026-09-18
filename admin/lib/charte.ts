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
  accent: '#2563EB',
  accentClair: '#60A5FA',
  accentFonce: '#1D4ED8',
} as const

export const POLICE_ADMIN = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif'

/** Les variables --sa-* telles que les declare app/dashboard/globals.css. */
export const VARIABLES_CSS = `--sa-bg:${CHARTE.fond};--sa-card:${CHARTE.carte};--sa-border:${CHARTE.bordure};--sa-text:${CHARTE.texte};--sa-muted:${CHARTE.attenue};--sa-subtle:${CHARTE.subtil};--sa-accent:${CHARTE.accent};--sa-accent-light:${CHARTE.accentClair};--sa-accent-dark:${CHARTE.accentFonce};`

/**
 * CHARTE PRO (17/09) — bascule du violet/magenta vers un bleu, sur demande
 * Romain (l espace pro et le dashboard SA ne sont plus alignes sur la
 * charte NDS 2026 du parcours joueur, qui reste violette et n est pas
 * touchee : lib/nds2026Design.ts et NDS2026Client.tsx sont hors perimetre).
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
  sidebar: '#0F1E33',
  sidebar2: '#0A1526',
  accent: '#2563EB',
  accentFonce: '#1D4ED8',
  magenta: '#0EA5E9',
  magenta2: '#3B82F6',
  or: '#F5A100',
  degrade: 'linear-gradient(90deg,#3B82F6,#0EA5E9)',
  filet: 'linear-gradient(90deg,#F5A100,#0EA5E9,#2563EB)',
} as const

export const POLICE_PRO = "'Manrope',system-ui,sans-serif"

/**
 * Code couleur super event / event-animation (Romain, 18/09) : « garde le
 * super event en orange, l'event en bleu » -- identifiant deja etabli
 * ailleurs (SuperEventDrawer .t-super, /rejoindre). Source unique : tout
 * ecran qui distingue les deux types reprend CES constantes, jamais une
 * teinte recalculee localement (« applique ces choses sur la totalite de
 * l'environnement », 18/09).
 */
export const ACCENT_SUPER = '#C2410C'
export const ACCENT_ANIM = CHARTE_PRO.accentFonce
