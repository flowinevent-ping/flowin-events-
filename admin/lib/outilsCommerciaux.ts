/**
 * Catalogue des outils commerciaux et marketing Flowin (Super Admin > Outils commerciaux).
 *
 * UNE seule source : chaque outil a un lien de PRODUCTION canonique (jamais une URL de preview
 * Vercel), de quoi le copier / l'envoyer / en faire un QR, et un apercu. Pour ajouter un outil :
 * ajouter une ligne ici, rien d'autre.
 * Les chemins ont ete verifies sur le disque (admin/public, admin/app) le 01/11/2026.
 */

export const BASE_PROD = 'https://flowin-events.vercel.app'

export type Public = 'commerce' | 'organisateur' | 'partenaire'
export type TypeOutil = 'page' | 'plaquette' | 'document' | 'video' | 'parcours'

export interface Outil {
  id: string
  titre: string
  public: Public[]
  type: TypeOutil
  description: string
  /** Chemin sur le site de production (commence par /). */
  chemin: string
  /** Vrai quand le lien peut porter ?src=<canal> (page qui mene a l'inscription ou la mesure). */
  suivi: boolean
  /** Canal propose par defaut. */
  canalDefaut?: string
  /** Vignette (videos). */
  vignette?: string
  /** Message WhatsApp / email d'accompagnement (court). */
  message: string
}

export const PUBLICS: { v: Public; label: string }[] = [
  { v: 'commerce', label: 'Commerce' },
  { v: 'organisateur', label: 'Organisateur' },
  { v: 'partenaire', label: 'Partenaire' },
]

export const OUTILS: Outil[] = [
  { id: 'plaquette-animation', titre: 'Plaquette Animation magasin', public: ['commerce'], type: 'plaquette', suivi: true,
    description: 'L’offre Animation pour un commerce : formules, prix, garantie, bouton « je m’inscris ».',
    chemin: '/plaquette-animation-magasin.html',
    message: 'Bonjour, voici la présentation de Flowin Animation pour votre magasin :' },
  { id: 'premiere-fois', titre: 'Inscription pro « Ma première fois »', public: ['commerce'], type: 'parcours', suivi: true,
    description: 'Création de l’espace pro en quelques minutes (SIRET, activité, points de vente, compte).',
    chemin: '/pro/premiere-fois',
    message: 'Bonjour, pour créer votre espace Flowin, c’est ici (quelques minutes) :' },
  { id: 'bon-commande-animation', titre: 'Bon de commande Animation', public: ['commerce'], type: 'document', suivi: true,
    description: 'Bon de commande en ligne, signature et paiement.',
    chemin: '/bon-commande-animation.html',
    message: 'Bonjour, voici votre bon de commande Flowin Animation :' },
  { id: 'cgv-animation', titre: 'CGV Animation magasin', public: ['commerce'], type: 'document', suivi: false,
    description: 'Conditions générales de vente de l’offre Animation.',
    chemin: '/cgv-animation-magasin.html',
    message: 'Bonjour, voici les conditions générales de Flowin Animation :' },
  { id: 'prospection', titre: 'Page de prospection', public: ['commerce', 'partenaire'], type: 'page', suivi: false,
    description: 'Présentation de prospection : argumentaire visuel pour un premier contact.',
    chemin: '/prospection.html',
    message: 'Bonjour, voici une présentation de Flowin :' },
  { id: 'landing-flowin', titre: 'Landing Flowin', public: ['commerce', 'organisateur'], type: 'page', suivi: true,
    description: 'Page d’accueil publique Flowin.',
    chemin: '/landing',
    message: 'Bonjour, découvrez Flowin, la plateforme de jeux pour vos événements :' },
  { id: 'plaquette-super-event', titre: 'Plaquette Event & Super Event', public: ['organisateur'], type: 'plaquette', suivi: true,
    description: 'Les formats Event et Super Event pour les organisateurs.',
    chemin: '/plaquette-nds.html',
    message: 'Bonjour, voici la présentation des formats Event et Super Event Flowin :' },
  { id: 'super-event-pro', titre: 'Le Super Event Flowin', public: ['organisateur'], type: 'page', suivi: false,
    description: 'Le jeu qui continue chez les commerçants : présentation pour organisateurs.',
    chemin: '/nds-super-event-pro.html',
    message: 'Bonjour, voici le principe du Super Event Flowin :' },
  { id: 'nds-pro', titre: 'NDS Pro (présentation)', public: ['organisateur'], type: 'page', suivi: false,
    description: 'Présentation de l’espace pro Nuits du Sud.',
    chemin: '/nds-pro.html',
    message: 'Bonjour, voici la présentation de l’espace pro Nuits du Sud :' },
  { id: 'pitch-nds', titre: 'Pitch NDS (argumentaire téléphonique)', public: ['partenaire'], type: 'page', suivi: false,
    description: 'Argumentaire pour appeler les partenaires Nuits du Sud 2026.',
    chemin: '/pitch-nds.html',
    message: 'Bonjour, voici l’argumentaire Nuits du Sud 2026 :' },
  { id: 'partenaire-presentation', titre: 'Jeu RSE NDS — présentation partenaire', public: ['partenaire'], type: 'plaquette', suivi: false,
    description: 'Présentation du jeu pour les partenaires de Nuits du Sud.',
    chemin: '/nds-partenaire-presentation.html',
    message: 'Bonjour, voici la présentation du jeu Nuits du Sud pour nos partenaires :' },
  { id: 'flowin-partenaire', titre: 'Flowin partenaire', public: ['partenaire'], type: 'plaquette', suivi: false,
    description: 'Présentation partenaire (version Flowin).',
    chemin: '/flowin-partenaire-presentation.html',
    message: 'Bonjour, voici la présentation Flowin pour les partenaires :' },
  { id: 'kit-digital', titre: 'Kit digital partenaires NDS', public: ['partenaire'], type: 'document', suivi: false,
    description: 'Dossiers par partenaire : visuels, QR, vidéos.',
    chemin: '/nds/kit-digital/index.html',
    message: 'Bonjour, voici votre kit digital Nuits du Sud :' },
  { id: 'demos', titre: 'Démos Flowin × NDS', public: ['commerce', 'partenaire'], type: 'page', suivi: false,
    description: 'Accès aux démos des jeux.',
    chemin: '/demos.html',
    message: 'Bonjour, voici les démos Flowin :' },
  { id: 'video-commerce', titre: 'Vidéo commerces (80 s)', public: ['commerce'], type: 'video', suivi: false,
    description: 'Vidéo de prospection verticale pour les commerces (WhatsApp, réseaux).',
    chemin: '/videos/video-commerce.mp4', vignette: '/videos/video-commerce.jpg',
    message: 'Bonjour, une vidéo de 80 secondes pour comprendre Flowin en magasin :' },
  { id: 'video-organisateur', titre: 'Vidéo organisateurs (35 s)', public: ['organisateur'], type: 'video', suivi: false,
    description: 'Vidéo de prospection verticale pour les organisateurs.',
    chemin: '/videos/video-organisateur.mp4', vignette: '/videos/video-organisateur.jpg',
    message: 'Bonjour, une courte vidéo pour comprendre Flowin pour votre événement :' },
  { id: 'video-partenaire', titre: 'Vidéo partenaires (35 s)', public: ['partenaire'], type: 'video', suivi: false,
    description: 'Vidéo de prospection verticale pour les partenaires de super-event.',
    chemin: '/videos/video-partenaire.mp4', vignette: '/videos/video-partenaire.jpg',
    message: 'Bonjour, une courte vidéo pour comprendre Flowin côté partenaire :' },
  { id: 'video-nds-partenaire', titre: 'Vidéo NDS partenaires (16:9)', public: ['partenaire'], type: 'video', suivi: false,
    description: 'Vidéo partenaires Nuits du Sud 2026, format horizontal.',
    chemin: '/nds/kit-digital/nds/nds-partenaire-16x9.mp4',
    message: 'Bonjour, voici la vidéo partenaires Nuits du Sud 2026 :' },
]

/** Lien de production complet (jamais d'URL de preview). */
export function urlProd(o: Outil): string {
  return BASE_PROD + o.chemin
}

/** Liens WhatsApp / email : messages courts, lien en fin de texte. */
export function lienWhatsApp(message: string, url: string): string {
  return 'https://wa.me/?text=' + encodeURIComponent(`${message} ${url}`)
}
export function lienEmail(titre: string, message: string, url: string): string {
  return 'mailto:?subject=' + encodeURIComponent(`Flowin : ${titre}`)
    + '&body=' + encodeURIComponent(`${message}\n\n${url}\n\nL’équipe Flowin`)
}

/** Ce que Romain demande mais qui n'existe pas encore (affiché en bas de page, aucun faux lien). */
export const OUTILS_MANQUANTS: { titre: string; public: Public; note: string }[] = [
  { titre: 'CGV Super Event / Event', public: 'organisateur', note: 'CGV de l’offre organisateur hors Nuits du Sud : à rédiger.' },
  { titre: 'Bon de commande organisateur', public: 'organisateur', note: 'Seul le bon NDS existe : un bon générique reste à construire.' },
  { titre: 'Vidéo organisateurs et partenaires : version finale', public: 'organisateur', note: 'Versions de travail copiées ici ; à valider avant diffusion large.' },
  { titre: 'Email de présentation prêt à l’emploi', public: 'commerce', note: 'Modèle d’email avec pièce jointe : à rédiger avec Florine.' },
]
