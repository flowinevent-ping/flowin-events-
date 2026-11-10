/**
 * Règlement par virement à la publication (09/11/2026, décision de Romain) : pas de paiement en ligne
 * branché pour l'instant. Coordonnées bancaires reprises du bon de commande Animation (bon-commande-animation.html).
 */
export const REGLEMENT = {
  titulaire: 'BAITA EURL',
  iban: 'FR76 1460 7003 3470 2211 6462 345',
  bic: 'CCBPFRPPMAR',
}

export const OFFRES_ANIMATION = [
  { cle: 'lancement', nom: 'Première année', prix: '445 € HT la 1re année', detail: 'Offre de lancement -50 %, puis 990 € HT / an' },
  { cle: 'annuelle', nom: 'Annuelle', prix: '990 € HT / an', detail: 'Reconduction tacite, résiliable' },
  { cle: 'mensuelle', nom: 'Mensuelle', prix: '110 € HT / mois', detail: 'Prélèvement SEPA, résiliable' },
] as const

/** Option : quiz et questions bonus rédigés par Flowin (30 + 5), -50 % la première année. */
export const OPTION_QUIZ_FLOWIN = { nom: 'Quiz rédigés par Flowin', detail: '30 questions quiz + 5 questions bonus', prix: 145, prixLancement: 72.5 }

export type CleOffreAnimation = typeof OFFRES_ANIMATION[number]['cle']

/** Référence de virement lisible : ANIM-<6 premiers caractères de l'identifiant>. */
export const referenceVirement = (id: string | null | undefined, prefixe = 'ANIM') =>
  `${prefixe}-${(id || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || '[n°]'}`
