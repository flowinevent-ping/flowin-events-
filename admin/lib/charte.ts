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
 * CHARTE PRO — refonte du 31/10 (« espace pro conforme »).
 *
 * Reprend la charte de la page d'accueil publique (app/landing/LandingClient.tsx) :
 * encre #1B3A5C, bleu #3B5CC4, papier #F4F6F9, texte secondaire #5a6b80, police
 * systeme graisse 800-900, logo « Flow » + « in » bleu.
 *
 * DIFFERENCE VOULUE avec la landing : l'accent commun (boutons, selection) est
 * le VIOLET #7A4FE0 et non le teal (decision Romain : « bleu + vert = pharmacie »).
 * Le fuchsia #E0368C n'est qu'une touche ponctuelle (pastille « en cours »),
 * jamais en grand aplat, jamais associe a un fond noir. Plus de fond sombre :
 * la barre laterale de l'espace pro est claire.
 *
 * Les noms de cles historiques (magenta, sidebar…) sont conserves pour ne pas
 * casser les ecrans qui les lisent ; leurs VALEURS suivent la nouvelle charte.
 * ALIGNEE sur les maquettes d'app validees (maquettes-jeux/index.html, 31/10) : memes
 * jetons --ink, --ink2, --muted, --line (#DCE3EC), --field (#C9D4E3), --cta (#7A4FE0),
 * --ok, --ko, logo graisse 800 / -.045em, dock bas blanc a filet 1,5 px.
 * Les memes valeurs sont exposees en variables CSS (--fl-*) par VARIABLES_PRO_CSS,
 * injectees par ProShell et par le parcours « Ma premiere fois ».
 */
export const CHARTE_PRO = {
  fond: '#F4F6F9',
  carte: '#FFFFFF',
  bordure: '#DCE3EC',
  bordureChamp: '#C9D4E3',
  champ: '#F8FAFC',
  texte: '#1B3A5C',
  attenue: '#5a6b80',
  encre2: '#3a4d63',
  ok: '#00897A',
  ko: '#C62F2F',
  subtil: '#F8FAFC',
  sidebar: '#FFFFFF',
  sidebar2: '#FFFFFF',
  encre: '#1B3A5C',
  bleu: '#3B5CC4',
  violet: '#7A4FE0',
  violetFonce: '#6A3FD0',
  violetClair: '#EFE9FC',
  fuchsia: '#E0368C',
  accent: '#3B5CC4',
  accentFonce: '#2C479E',
  /** Historique : « magenta » = la teinte de selection. Desormais le violet commun. */
  magenta: '#7A4FE0',
  magenta2: '#3B5CC4',
  or: '#F5A100',
  degrade: 'linear-gradient(135deg,#7A4FE0,#6A3FD0)',
  filet: 'linear-gradient(90deg,#3B5CC4,#7A4FE0)',
} as const

/** Les couleurs de l'espace pro en variables CSS, a poser sur :root ou un conteneur. */
export const VARIABLES_PRO_CSS = `--fl-encre:${CHARTE_PRO.encre};--fl-bleu:${CHARTE_PRO.bleu};--fl-violet:${CHARTE_PRO.violet};--fl-violet-fonce:${CHARTE_PRO.violetFonce};--fl-violet-clair:${CHARTE_PRO.violetClair};--fl-fuchsia:${CHARTE_PRO.fuchsia};--fl-papier:${CHARTE_PRO.fond};--fl-carte:${CHARTE_PRO.carte};--fl-texte2:${CHARTE_PRO.attenue};--fl-bordure:${CHARTE_PRO.bordure};--fl-bordure-champ:${CHARTE_PRO.bordureChamp};--fl-champ:${CHARTE_PRO.champ};--fl-encre2:${CHARTE_PRO.encre2};--fl-ok:${CHARTE_PRO.ok};--fl-alerte:#B45309;--fl-erreur:${CHARTE_PRO.ko};`

/* Police systeme, comme la landing (graisse 800-900 pour les titres). */
export const POLICE_PRO = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'

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
