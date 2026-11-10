/**
 * Règlement par virement à la publication (09/11/2026, décision de Romain) : pas de paiement en ligne
 * branché pour l'instant. Coordonnées bancaires reprises du bon de commande Animation (bon-commande-animation.html).
 */
/** PAIEMENT EN ATTENTE pendant la phase de test (Romain, 10/11/2026) : false = « Publier » met l'animation
 *  en ligne directement, sans bon de commande ni virement (tout le code reste en place). Même interrupteur
 *  dans public/bon-commande-animation.html (PAIEMENT_ACTIF). Romain le repasse à true après validation. */
export const PAIEMENT_ACTIF = false

export const REGLEMENT = {
  titulaire: 'BAITA EURL',
  iban: 'FR76 1460 7003 3470 2211 6462 345',
  bic: 'CCBPFRPPMAR',
}

/** Grille UNIQUE des prix Flowin Animation (décision de Romain, 10/11/2026), en euros HT.
 *  Reportée telle quelle dans public/bon-commande-pdf.js (PRIX), public/bon-commande-animation.html,
 *  public/cgv-animation-magasin.html (art. 4 et 6) et sql/2026-11-10-lot-a.sql (trigger de la base). */
export const PRIX_ANIMATION = {
  lancement: 445,      // 1re année, offre de lancement -50 %
  annuelle: 990,       // ensuite, par an, reconduction tacite
  mensuelle: 110,      // ou par mois, prélèvement SEPA, reconduction tacite
  quizFlowin: 145,     // option : 30 questions quiz + 5 questions bonus rédigées par Flowin
  quizFlowinLancement: 72.5, // la même option, -50 % la 1re année
} as const

export const OFFRES_ANIMATION = [
  /* 10/11/2026 (Romain) : « Votre première année à -50 % : 445 € HT » présentée en premier ; rien sur l'année suivante à la commande (les CGV gardent les conditions). */
  { cle: 'lancement', nom: 'Votre première année à -50 %', prix: '445 € HT', detail: 'Engagement 12 mois' },
  { cle: 'mensuelle', nom: 'Mensuelle', prix: '110 € HT / mois', detail: 'Prélèvement SEPA, 3 mois minimum' },
  { cle: 'annuelle', nom: 'Annuelle', prix: '990 € HT / an', detail: 'Un seul paiement pour l’année' },
] as const

/** Option : quiz et questions bonus rédigés par Flowin (30 + 5), -50 % la première année. */
export const OPTION_QUIZ_FLOWIN = { nom: 'Votre premier quiz rédigé par Flowin', detail: '30 questions + 5 questions bonus', prix: PRIX_ANIMATION.quizFlowin, prixLancement: PRIX_ANIMATION.quizFlowinLancement }
/** Option : customisation totale (couleurs, thématique, jeu 100 % personnalisable, lancement de campagne), sur devis. */
export const OPTION_CUSTOMISATION = { nom: 'Customisation totale', detail: 'Couleurs, thématique, jeu 100 % personnalisable et modifiable, lancement de campagne', prix: 'Sur demande' }

/** Délai annoncé au pro entre la déclaration du virement et son contrôle par Flowin. */
export const DELAI_CONTROLE_PAIEMENT = '3 à 5 jours'

/** Lien du bon de commande pré-rempli (public/bon-commande-animation.html) depuis la publication. */
export const lienBonCommande = (o: { proId: string; offre: CleOffreAnimation; quizFlowin: boolean; customisation: boolean; eventId: string | null }) =>
  `/bon-commande-animation.html?pro=${encodeURIComponent(o.proId)}&offre=${o.offre}` +
  (o.quizFlowin ? '&quizflowin=1' : '') + (o.customisation ? '&custom=1' : '') +
  (o.eventId ? `&ev=${encodeURIComponent(o.eventId)}` : '')

export type CleOffreAnimation = typeof OFFRES_ANIMATION[number]['cle']

/** Référence de virement lisible : ANIM-<6 premiers caractères de l'identifiant>. */
export const referenceVirement = (id: string | null | undefined, prefixe = 'ANIM') =>
  `${prefixe}-${(id || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || '[n°]'}`

/** Prix affiché de l'option quiz selon l'offre (72,50 € HT avec la première année à -50 %, 145 € HT sinon). */
export const prixOptionQuiz = (offre: CleOffreAnimation) => offre === 'lancement' ? '72,50 € HT' : '145 € HT'

/** Contenu du « QR de virement » SEPA (norme EPC069-12, version 002) : lu par les applications bancaires
 *  pour préremplir le virement (bénéficiaire, IBAN, montant, référence). Montant en euros, TTC. */
export const qrVirementEpc = (montant: number, reference: string) => [
  'BCD', '002', '1', 'SCT', REGLEMENT.bic, REGLEMENT.titulaire, REGLEMENT.iban.replace(/\s/g, ''),
  montant > 0 ? 'EUR' + (Math.round(montant * 100) / 100).toFixed(2) : '', '', '', reference.slice(0, 140),
].join('\n')
