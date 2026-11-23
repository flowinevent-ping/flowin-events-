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
  /* 23/11/2026 (lot ergonomie 1) : plus de violet dans l'application ; accent = bleu Flowin. */
  accent: '#3B5CC4',
  accentClair: '#6F8BDD',
  accentFonce: '#2B47A8',
} as const

/** UN SEUL vert de succes pour tout l'espace pro (lot ergonomie 1, 23/11/2026, AMEL-DES-10).
 *  Remplace #00897A (ancien C.ok) et #0B7A4F ; #15803D etait deja le vert de 90 % des ecrans
 *  (contraste 5,0:1 sur blanc, AA ; le teal #00897A n'atteignait que 4,0:1). Fond doux : VERT_OK_FOND. */
export const VERT_OK = '#15803D'
export const VERT_OK_FOND = '#DCFCE7'

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
 * Accent commun (boutons, selection) : BLEU #3B5CC4 (le violet a ete retire le 09/11 puis du code le 23/11).
 * Le fuchsia #E0368C n'est qu'une touche ponctuelle (pastille « en cours »),
 * jamais en grand aplat, jamais associe a un fond noir. Plus de fond sombre :
 * la barre laterale de l'espace pro est claire.
 *
 * Les noms de cles historiques (magenta, sidebar…) sont conserves pour ne pas
 * casser les ecrans qui les lisent ; leurs VALEURS suivent la nouvelle charte.
 * ALIGNEE sur les maquettes d'app validees (maquettes-jeux/index.html, 31/10) : memes
 * jetons --ink, --ink2, --muted, --line (#DCE3EC), --field (#C9D4E3), --cta (#3B5CC4),
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
  ok: '#15803D', /* = VERT_OK : un seul vert de succes */
  ko: '#C62F2F',
  subtil: '#F8FAFC',
  sidebar: '#FFFFFF',
  sidebar2: '#FFFFFF',
  encre: '#1B3A5C',
  bleu: '#3B5CC4',
  /* 09/11/2026 (Romain) : le violet n'est plus la couleur Flowin. Espace pro aligné sur la plaquette
     Animation V3 : bleu #3B5CC4 pour les actions. Les noms « violet » sont gardés pour ne rien casser. */
  violet: '#3B5CC4',
  violetFonce: '#2B47A8',
  violetClair: '#E3E9F8',
  fuchsia: '#E0368C',
  accent: '#3B5CC4',
  accentFonce: '#2B47A8',
  /** Historique : « magenta » = la teinte de selection. */
  magenta: '#3B5CC4',
  magenta2: '#3B5CC4',
  or: '#F5A100',
  degrade: 'linear-gradient(135deg,#3B5CC4,#2B47A8)',
  filet: 'linear-gradient(90deg,#3B5CC4,#2B47A8)',
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
/* 07/11 (decision du commanditaire, audit coherence graphique) : couleur de
   CATEGORIE super event = ORANGE #C2410C (degrade #FF8A14), animation/event =
   BLEU #3B5CC4. Le rouge/jaune « comics » (--fl-super-rouge, --fl-super-jaune)
   reste l univers d illustration des maquettes joueur, pas la couleur de
   categorie. */
export const ACCENT_SUPER = '#C2410C'
export const ACCENT_SUPER_2 = '#FF8A14'
export const ACCENT_ANIM = CHARTE_PRO.bleu
