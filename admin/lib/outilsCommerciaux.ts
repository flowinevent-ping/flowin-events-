/**
 * Catalogue des outils commerciaux et marketing Flowin (Super Admin > Outils commerciaux).
 *
 * UNE seule source : chaque outil a un lien de PRODUCTION canonique (jamais une URL de preview
 * Vercel), de quoi le copier / l'envoyer / en faire un QR, et un apercu. Pour ajouter un outil :
 * ajouter une ligne ici, rien d'autre.
 * Les chemins ont ete verifies sur le disque (admin/public, admin/app) le 01/11/2026.
 */

export const BASE_PROD = 'https://flowin-events.vercel.app'

export type Public = 'participant' | 'commerce' | 'organisateur' | 'partenaire'
export type Statut = 'validé' | 'brouillon'
export type TypeOutil = 'page' | 'plaquette' | 'document' | 'video' | 'parcours' | 'scenario' | 'animation'

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
  /** Animation video (lecteur dans le carrousel + page de lecture publique). */
  animation?: {
    format: 'vertical' | 'paysage'
    /** Fichier video (admin/public/animations/<id>.mp4). Absent du depot tant que `pret` est faux. */
    mp4: string
    /** Version courte (second MP4). */
    courte?: string
    poster?: string
    /** Vrai quand le MP4 est dans le depot ; sinon « Version de travail en préparation ». */
    pret: boolean
  }
  /** Seuls les outils explicitement valides par Romain sont partageables (copie, WhatsApp, email). */
  statut: Statut
  /** Vrai : le fichier n'est pas encore en ligne (video a venir) : ni lien, ni QR, ni apercu. */
  aVenir?: boolean
  /** Message WhatsApp / email d'accompagnement (court). */
  message: string
}

export const PUBLICS: { v: Public; label: string }[] = [
  { v: 'participant', label: 'Participant' },
  { v: 'commerce', label: 'Commerce' },
  { v: 'organisateur', label: 'Organisateur' },
  { v: 'partenaire', label: 'Partenaire' },
]

export const OUTILS: Outil[] = [
  { statut: 'validé', id: 'plaquette-animation', titre: 'Plaquette Animation magasin', public: ['commerce'], type: 'plaquette', suivi: true,
    description: 'L’offre Animation pour un commerce : formules, prix, bouton « je m’inscris ».',
    chemin: '/plaquette-animation-magasin.html',
    message: 'Bonjour, voici la présentation de Flowin Animation pour votre magasin :' },
  { statut: 'validé', id: 'premiere-fois', titre: 'Inscription pro « Ma première fois »', public: ['commerce'], type: 'parcours', suivi: true,
    description: 'Création de l’espace pro en quelques minutes (SIRET, activité, points de vente, compte).',
    chemin: '/pro/premiere-fois',
    message: 'Bonjour, pour créer votre espace Flowin, c’est ici (quelques minutes) :' },
  { statut: 'validé', id: 'bon-commande-animation', titre: 'Bon de commande Animation', public: ['commerce'], type: 'document', suivi: true,
    description: 'Bon de commande en ligne, signature et paiement.',
    chemin: '/bon-commande-animation.html',
    message: 'Bonjour, voici votre bon de commande Flowin Animation :' },
  { statut: 'validé', id: 'cgv-animation', titre: 'CGV Animation magasin', public: ['commerce'], type: 'document', suivi: false,
    description: 'Conditions générales de vente de l’offre Animation.',
    chemin: '/cgv-animation-magasin.html',
    message: 'Bonjour, voici les conditions générales de Flowin Animation :' },
  { statut: 'brouillon', id: 'prospection', titre: 'Page de prospection', public: ['commerce', 'partenaire'], type: 'page', suivi: false,
    description: 'Présentation de prospection : argumentaire visuel pour un premier contact.',
    chemin: '/prospection.html',
    message: 'Bonjour, voici une présentation de Flowin :' },
  { statut: 'brouillon', id: 'landing-flowin', titre: 'Landing Flowin', public: ['commerce', 'organisateur'], type: 'page', suivi: true,
    description: 'Page d’accueil publique Flowin.',
    chemin: '/landing',
    message: 'Bonjour, découvrez Flowin, la plateforme de jeux pour vos événements :' },
  { statut: 'validé', id: 'plaquette-super-event', titre: 'Plaquette Event & Super Event', public: ['organisateur'], type: 'plaquette', suivi: true,
    description: 'Les formats Event et Super Event pour les organisateurs.',
    chemin: '/plaquette-nds.html',
    message: 'Bonjour, voici la présentation des formats Event et Super Event Flowin :' },
  { statut: 'brouillon', id: 'super-event-pro', titre: 'Le Super Event Flowin', public: ['organisateur'], type: 'page', suivi: false,
    description: 'Le jeu qui continue chez les commerçants : présentation pour organisateurs.',
    chemin: '/nds-super-event-pro.html',
    message: 'Bonjour, voici le principe du Super Event Flowin :' },
  { statut: 'brouillon', id: 'nds-pro', titre: 'NDS Pro (présentation)', public: ['organisateur'], type: 'page', suivi: false,
    description: 'Présentation de l’espace pro Nuits du Sud.',
    chemin: '/nds-pro.html',
    message: 'Bonjour, voici la présentation de l’espace pro Nuits du Sud :' },
  { statut: 'brouillon', id: 'pitch-nds', titre: 'Pitch NDS (argumentaire téléphonique)', public: ['partenaire'], type: 'page', suivi: false,
    description: 'Argumentaire pour appeler les partenaires Nuits du Sud 2026.',
    chemin: '/pitch-nds.html',
    message: 'Bonjour, voici l’argumentaire Nuits du Sud 2026 :' },
  { statut: 'brouillon', id: 'partenaire-presentation', titre: 'Jeu RSE NDS — présentation partenaire', public: ['partenaire'], type: 'plaquette', suivi: false,
    description: 'Présentation du jeu pour les partenaires de Nuits du Sud.',
    chemin: '/nds-partenaire-presentation.html',
    message: 'Bonjour, voici la présentation du jeu Nuits du Sud pour nos partenaires :' },
  { statut: 'brouillon', id: 'flowin-partenaire', titre: 'Flowin partenaire', public: ['partenaire'], type: 'plaquette', suivi: false,
    description: 'Présentation partenaire (version Flowin).',
    chemin: '/flowin-partenaire-presentation.html',
    message: 'Bonjour, voici la présentation Flowin pour les partenaires :' },
  { statut: 'brouillon', id: 'kit-digital', titre: 'Kit digital partenaires NDS', public: ['partenaire'], type: 'document', suivi: false,
    description: 'Dossiers par partenaire : visuels, QR, vidéos.',
    chemin: '/nds/kit-digital/index.html',
    message: 'Bonjour, voici votre kit digital Nuits du Sud :' },
  { statut: 'brouillon', id: 'demos', titre: 'Démos Flowin × NDS', public: ['commerce', 'partenaire'], type: 'page', suivi: false,
    description: 'Accès aux démos des jeux.',
    chemin: '/demos.html',
    message: 'Bonjour, voici les démos Flowin :' },
  { statut: 'brouillon', id: 'storyboard-commerce-v15', titre: 'Scénario vidéo commerçants (v15, à valider)', public: ['commerce'], type: 'scenario', suivi: false,
    description: 'Storyboard v15 de la vidéo Flowin Animation pour les commerçants (version à jour). Pas de MP4 : scénario à valider.',
    chemin: '/storyboards-video/v15-animation-commercants.html',
    message: 'Scénario vidéo à valider (ne pas diffuser) :' },
  { statut: 'brouillon', id: 'storyboard-commerce', titre: 'Scénario vidéo commerçants (v14, remplacé par v15)', public: ['commerce'], type: 'scenario', suivi: false,
    description: 'Storyboard v14 de la vidéo Flowin Animation pour les commerçants. Pas de MP4 : scénario à valider.',
    chemin: '/storyboards-video/v14-animation-commercants.html',
    message: 'Scénario vidéo à valider (ne pas diffuser) :' },
  { statut: 'brouillon', id: 'storyboard-organisateur', titre: 'Scénario vidéo organisateurs (v14, à valider)', public: ['organisateur'], type: 'scenario', suivi: false,
    description: 'Storyboard v14 de la vidéo Super Event pour organisateurs, collectivités et festivals. À valider.',
    chemin: '/storyboards-video/v14-super-event-organisateurs.html',
    message: 'Scénario vidéo à valider (ne pas diffuser) :' },
  { statut: 'brouillon', id: 'storyboard-partenaire', titre: 'Scénario vidéo partenaires (v14, à valider)', public: ['partenaire'], type: 'scenario', suivi: false,
    description: 'Storyboard v14 de la vidéo Super Event pour commerces et partenaires. À valider.',
    chemin: '/storyboards-video/v14-super-event-partenaires.html',
    message: 'Scénario vidéo à valider (ne pas diffuser) :' },
  { statut: 'brouillon', id: 'video-nds-partenaire', titre: 'Vidéo NDS partenaires (16:9)', public: ['partenaire'], type: 'video', suivi: false,
    description: 'Vidéo partenaires Nuits du Sud 2026, format horizontal.',
    chemin: '/nds/kit-digital/nds/nds-partenaire-16x9.mp4',
    message: 'Bonjour, voici la vidéo partenaires Nuits du Sud 2026 :' },
  { statut: 'brouillon', id: 'landing-nds', titre: 'Landing NDS', public: ['partenaire'], type: 'page', suivi: false,
    description: 'Page publique Nuits du Sud 2026.',
    chemin: '/nds',
    message: 'Bonjour, voici la page Nuits du Sud 2026 :' },
  { statut: 'brouillon', id: 'pro-connexion', titre: 'Pro (connexion)', public: ['commerce'], type: 'page', suivi: false,
    description: 'Connexion à l’espace pro.',
    chemin: '/pro',
    message: 'Bonjour, voici l’accès à votre espace pro Flowin :' },
  { statut: 'brouillon', id: 'pro-nds-live', titre: 'Pro NDS live', public: ['partenaire'], type: 'page', suivi: false,
    description: 'Suivi en direct pour les partenaires NDS.',
    chemin: '/pro-nds-live.html',
    message: 'Bonjour, voici votre suivi en direct :' },
  { statut: 'brouillon', id: 'carte', titre: 'Carte', public: ['partenaire'], type: 'page', suivi: false,
    description: 'Carte des partenaires et des stations.',
    chemin: '/carte.html',
    message: 'Bonjour, voici la carte :' },
  { statut: 'validé', id: 'anim-participant-commerces', titre: 'Animation participant (chez les commerces)', public: ['participant'], type: 'animation', suivi: true, canalDefaut: 'video-participant',
    description: 'Vidéo de présentation pour les participants : jouer chez les commerces du quartier.',
    chemin: '/animations/anim-participant-commerces.html',
    animation: { format: 'vertical', mp4: '/animations/anim-participant-commerces.mp4', courte: '/animations/anim-participant-commerces-courte.mp4', poster: '/animations/anim-participant-commerces.jpg', pret: true },
    message: 'Bonjour, une courte vidéo pour comprendre Flowin :' },
  { statut: 'validé', id: 'anim-commerce-plug-play', titre: 'Animation commerce : Flowin, animation Plug & Play', public: ['commerce'], type: 'animation', suivi: true, canalDefaut: 'video-commerce',
    description: 'Vidéo de présentation pour les commerçants : Flowin, l’animation Plug & Play.',
    chemin: '/animations/anim-commerce-plug-play.html',
    animation: { format: 'vertical', mp4: '/animations/anim-commerce-plug-play.mp4', courte: '/animations/anim-commerce-plug-play-courte.mp4', poster: '/animations/anim-commerce-plug-play.jpg', pret: true },
    message: 'Bonjour, une courte vidéo pour comprendre Flowin :' },
  { statut: 'validé', id: 'anim-participant-super-event', titre: 'Animation participant super event', public: ['participant'], type: 'animation', suivi: true, canalDefaut: 'video-participant-se',
    description: 'Vidéo de présentation pour les participants d’un super event.',
    chemin: '/animations/anim-participant-super-event.html',
    animation: { format: 'vertical', mp4: '/animations/anim-participant-super-event.mp4', courte: '/animations/anim-participant-super-event-courte.mp4', poster: '/animations/anim-participant-super-event.jpg', pret: true },
    message: 'Bonjour, une courte vidéo pour comprendre Flowin :' },
  { statut: 'validé', id: 'anim-organisateur', titre: 'Animation organisateur', public: ['organisateur'], type: 'animation', suivi: true, canalDefaut: 'video-organisateur',
    description: 'Vidéo de présentation pour les organisateurs de festival.',
    chemin: '/animations/anim-organisateur.html',
    animation: { format: 'vertical', mp4: '/animations/anim-organisateur.mp4', courte: '/animations/anim-organisateur-courte.mp4', poster: '/animations/anim-organisateur.jpg', pret: true },
    message: 'Bonjour, une courte vidéo pour comprendre Flowin :' },
  { statut: 'validé', id: 'anim-commerces-sponsors', titre: 'Animation commerces et sponsors (rejoindre un super event)', public: ['partenaire'], type: 'animation', suivi: true, canalDefaut: 'video-partenaire-se',
    description: 'Vidéo de présentation pour les commerces et sponsors qui rejoignent un super event.',
    chemin: '/animations/anim-commerces-sponsors.html',
    animation: { format: 'vertical', mp4: '/animations/anim-commerces-sponsors.mp4', courte: '/animations/anim-commerces-sponsors-courte.mp4', poster: '/animations/anim-commerces-sponsors.jpg', pret: true },
    message: 'Bonjour, une courte vidéo pour comprendre Flowin :' },
]

/** Lien de production complet (jamais d'URL de preview). */
export function urlProd(o: Outil): string {
  if (!o.chemin) return ''
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
  { titre: 'Vidéo organisateurs et partenaires : version finale', public: 'organisateur', note: 'Les 3 scénarios v14 sont à valider ; les MP4 ne seront produits qu’après.' },
  { titre: 'Email de présentation prêt à l’emploi', public: 'commerce', note: 'Modèle d’email avec pièce jointe : à rédiger avec Florine.' },
]

/* ── Validation par le Super Admin (depuis l'aperçu) ─────────────────────────
   Aucune table existante ne porte ce statut : stockage LOCAL au navigateur du Super Admin
   (localStorage), sans SQL. Limite connue : la validation n'est pas partagee entre appareils ;
   le statut de reference reste celui du catalogue ci-dessus. */
export const CLE_VALIDES = 'flowin_outils_valides'

export function lireValides(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLE_VALIDES) ?? '[]')
    return Array.isArray(v) ? v.filter((x: unknown) => typeof x === 'string') : []
  } catch { return [] }
}
export function ecrireValides(ids: string[]): void {
  try { window.localStorage.setItem(CLE_VALIDES, JSON.stringify(ids)) } catch { /* ignore */ }
}
