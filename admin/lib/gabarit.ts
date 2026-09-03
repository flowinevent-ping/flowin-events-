/**
 * GABARIT MARQUE BLANCHE — Quiz + bonus, tire de NDS 2026.
 *
 * Romain, 03/09 : « on prend super events NDS 2026 comme support de reference
 * et realisons un template a partir de celui-ci "marque blanche" — celui-ci
 * nous servira de reference afin de ne pas partir de ZERO. Le parcours user
 * est bon, le module jeux est celui de QUIZZ + bonus (le parcours deroule et
 * regles du jeu sont les bonnes). Pour events le parcours est 100% le meme a
 * l'exception qu'il n'y a pas la carte de multistation jeux et la carte
 * partenaire. Les UX et UI peuvent etre les memes que pour NDS 2026, tu peux
 * simplement supprimer le logo (laisse l'espace disponible) [et ajouter] la
 * selection des banques de question quizz et banque de question bonus. »
 *
 * CE FICHIER N'INVENTE RIEN. Chaque ligne est relevee dans le code qui tourne :
 *
 *  - le module s'appelle deja `nds2026` en base et est deja route par
 *    `app/parcours/nds2026/page.tsx`. On ne cree pas un module de plus : on
 *    nomme celui qui existe et on le rend generique.
 *  - la charte est deja extraite dans `lib/nds2026Design.ts` (NDS_CSS,
 *    NDS_SPRITE). C'est elle, la marque blanche : elle ne contient aucune
 *    mention des Nuits du Sud. Le seul element de marque est le logo, code en
 *    dur dans l'ecran d'accueil (`/nds/logo_nds_blanc_hd.png`) — c'est
 *    exactement ce que Romain demande de retirer.
 *  - le deroule et les regles sont ceux de `NDS2026Client.tsx`, y compris le
 *    commentaire d'origine sur les tickets : « 1 ticket quiz (4/4) + 1 ticket
 *    bonus -> jusqu'a 2/station/jour ».
 *
 * SEULE VARIABLE ENTRE LES DEUX PORTEES : le multi-station. Un super event
 * groupe plusieurs stations ; un event est une station seule. Les blocs listes
 * dans BLOCS_MULTISTATION disparaissent donc quand l'event n'a pas de super
 * event — c'est le « 100% le meme a l'exception de » de Romain, et rien
 * d'autre ne change.
 */

/** L'identifiant du module tel qu'il est deja ecrit en base sur les events. */
export const GABARIT_MODULE = 'nds2026'

/** Le nom sous lequel Romain le designe. */
export const GABARIT_NOM = 'Quiz + bonus'

export const GABARIT_DESC =
  'Le gabarit de référence, tiré de NDS 2026 : flash, quiz, bonus de rattrapage, inscription, ticket.'

/* ── Le deroule joueur ──────────────────────────────────────────────────────
   Les ecrans sont ceux du type `Screen` de NDS2026Client, dans l'ordre ou le
   joueur les traverse. `hors` = l'ecran n'existe pas pour un event seul. */
export interface EtapeJoueur {
  ecran: string
  titre: string
  detail: string
  /** true = cet ecran n'apparait que pour un super event (multi-stations). */
  multistation?: boolean
}

export const DEROULE: EtapeJoueur[] = [
  { ecran: 'flash', titre: 'Le flash', detail: 'Le joueur scanne le QR de la station. Le QR porte l’identifiant de l’event — c’est lui qui dit quelle station a été jouée.' },
  { ecran: 'onboard', titre: 'Accueil', detail: 'Les lots à gagner, puis « Comment jouer ? » en trois étapes, puis le bouton « Je joue maintenant ».' },
  { ecran: 'quiz', titre: 'Le quiz', detail: 'Les questions tirées au hasard dans les banques cochées. Une réponse par question, correction affichée tout de suite, avec l’explication quand la question en porte une.' },
  { ecran: 'resultats', titre: 'Le score', detail: 'Le score sur le total. Sans faute : le ticket est acquis. Sinon, le bonus le rattrape.' },
  { ecran: 'bonus', titre: 'Le bonus', detail: 'Les questions bonus, tirées dans les banques bonus cochées. Elles rattrapent le ticket manqué et en ajoutent un.' },
  { ecran: 'inscription', titre: 'L’inscription', detail: 'Prénom, nom, email, téléphone, sexe, tranche d’âge, code postal, comment il a connu l’opération, et le consentement. Un joueur déjà venu est reconnu à son email et saute cette étape.' },
  { ecran: 'final', titre: 'Le ticket', detail: 'Le ticket est affiché et compte pour le tirage.' },
  { ecran: 'carte', titre: 'La carte des stations', detail: 'La carte des autres stations à jouer, chacune valant un ticket de plus.', multistation: true },
  { ecran: 'partenaires', titre: 'Les partenaires', detail: 'Les commerces de l’opération, leurs lots et leurs liens. « +1 ticket par commerce ».', multistation: true },
  { ecran: 'tickets', titre: 'Mes tickets', detail: 'Le cumul des tickets gagnés et ce qu’il reste à jouer.', multistation: true },
]

/* ── Les regles du jeu ──────────────────────────────────────────────────────
   Relevees dans NDS2026Client : le ledger (`ndsLedgerAdd`, `ndsPlayedToday`)
   et les drapeaux `quiz_ticket` / `bonus_ticket` de `writeJoueur`. */
export interface RegleJeu {
  titre: string
  texte: string
  /** 'super' = seulement en multi-stations, 'event' = seulement station seule. */
  portee?: 'super' | 'event'
}

export const REGLES: RegleJeu[] = [
  { titre: 'Un ticket par station et par jour', portee: 'super', texte: 'Le droit au ticket d’une station se remet à zéro chaque jour : on peut rejouer au même endroit le lendemain.' },
  { titre: 'Un ticket par jour', portee: 'event', texte: 'Le droit au ticket se remet à zéro chaque jour : on peut rejouer le lendemain.' },
  { titre: 'Quiz sans faute = 1 ticket', texte: 'Le sans-faute donne le ticket directement.' },
  { titre: 'Bonus = 1 ticket de plus', texte: 'Les questions bonus rattrapent le ticket manqué et en ajoutent un — jusqu’à 2 tickets par jour.' },
  { titre: 'Le cumul ne se perd pas', texte: 'Les tickets gagnés sont conservés : le compteur ne redescend jamais.' },
  { titre: 'Chaque station en plus = 1 ticket', portee: 'super', texte: 'Jouer une autre station de l’opération ajoute un ticket.' },
  { titre: 'Chaque commerce = 1 ticket', portee: 'super', texte: 'Passer chez un commerce partenaire ajoute un ticket.' },
]

/* ── Ce que le gabarit demande a la creation ────────────────────────────────
   Les cles sont celles que le parcours lit deja ; `bonusBanques` est la seule
   ajoutee, et elle est lue par fetchParcoursData en plus de `quizBanques`. */
export const CLES_CONFIG = {
  /** Banques dont les questions sont des QCM — le quiz. */
  quizBanques: 'quizBanques',
  /** Banques dont les questions sont des sondages single/multi — le bonus. */
  bonusBanques: 'bonusBanques',
  /** Texte d'accueil libre : remplace le bloc « Comment jouer ? » quand il est rempli. */
  intro: 'intro',
} as const

/** Les blocs de l'accueil qui n'existent que pour un super event. */
export const BLOCS_MULTISTATION = [
  'la liste des autres stations et le bouton « Gagner d’autres tickets »',
  'la carte des stations',
  'la carte partenaires « Cumule tes tickets en boutique »',
] as const

/** Le deroule pour une portee donnee. */
export function deroulePour(multistation: boolean): EtapeJoueur[] {
  return DEROULE.filter(e => multistation || !e.multistation)
}

/** Les règles pour une portée donnée. Les deux premières s’excluent : selon
 *  qu’il y a plusieurs stations ou une seule, le ticket se compte par station
 *  ou tout court. */
export function reglesPour(multistation: boolean): RegleJeu[] {
  return REGLES.filter(r => !r.portee || r.portee === (multistation ? 'super' : 'event'))
}

/* ── Tri des banques ────────────────────────────────────────────────────────
   La table `banques` porte les DEUX formats dans la meme colonne `questions`
   (voir l'en-tete de lib/banques.ts) : `type:'qcm'` pour le quiz,
   `type:'single'|'multi'` pour le bonus. On ne cree donc pas de table ni de
   colonne : on classe ce qui existe. Une banque vide n'est proposee nulle
   part — elle n'apporterait aucune question. */
export type SorteBanque = 'quiz' | 'bonus' | 'vide' | 'mixte'

export function sorteBanque(questions: { type?: string }[] | null | undefined): SorteBanque {
  const qs = questions ?? []
  if (!qs.length) return 'vide'
  const qcm = qs.filter(q => q.type === 'qcm').length
  const bonus = qs.filter(q => q.type === 'single' || q.type === 'multi').length
  if (qcm && bonus) return 'mixte'
  if (qcm) return 'quiz'
  if (bonus) return 'bonus'
  return 'vide'
}
