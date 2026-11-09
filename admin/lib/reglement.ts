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
  { cle: 'mensuelle', nom: 'Mensuelle', prix: '110 € HT / mois', detail: 'Engagement 3 mois minimum' },
  { cle: 'annuelle', nom: 'Annuelle', prix: '990 € HT / an', detail: 'Engagement 12 mois' },
] as const

export type CleOffreAnimation = typeof OFFRES_ANIMATION[number]['cle']

/** Référence de virement lisible : ANIM-<6 premiers caractères de l'identifiant>. */
export const referenceVirement = (id: string | null | undefined, prefixe = 'ANIM') =>
  `${prefixe}-${(id || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || '[n°]'}`
