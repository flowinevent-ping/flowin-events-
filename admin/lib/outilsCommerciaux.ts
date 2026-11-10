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
export type Statut = 'validé' | 'brouillon'
export type TypeOutil = 'page' | 'plaquette' | 'document' | 'video' | 'parcours' | 'scenario'

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
  /** Seuls les outils explicitement valides par Romain sont partageables (copie, WhatsApp, email). */
  statut: Statut
  /** Vrai : le fichier n'est pas encore en ligne (video a venir) : ni lien, ni QR, ni apercu. */
  aVenir?: boolean
  /** Message WhatsApp / email d'accompagnement (court). */
  message: string
}

export const PUBLICS: { v: Public; label: string }[] = [
  { v: 'commerce', label: 'Commerce' },
  { v: 'organisateur', label: 'Organisateur' },
  { v: 'partenaire', label: 'Partenaire' },
]

export const OUTILS: Outil[] = [
  { statut: 'brouillon', id: 'film-v4-f1-commerce', titre: 'Film réseaux sociaux : Animation · commerce', public: ['commerce'], type: 'video', suivi: false,
    description: 'Format TikTok / Instagram, vertical, muet avec sous-titres (version 15 s : f1-15s.mp4).',
    chemin: '/videos/v4/f1-commerce.mp4',
    message: 'Bonjour, découvrez Flowin Event en vidéo :' },
  { statut: 'brouillon', id: 'film-v4-f2-participant-animation', titre: 'Film réseaux sociaux : Animation · participant', public: ['commerce'], type: 'video', suivi: false,
    description: 'Format TikTok / Instagram, vertical, muet avec sous-titres (version 15 s : f2-15s.mp4).',
    chemin: '/videos/v4/f2-participant-animation.mp4',
    message: 'Bonjour, découvrez Flowin Event en vidéo :' },
  { statut: 'brouillon', id: 'film-v4-f3-organisateur', titre: 'Film réseaux sociaux : Super Event · organisateur', public: ['organisateur'], type: 'video', suivi: false,
    description: 'Format TikTok / Instagram, vertical, muet avec sous-titres (version 15 s : f3-15s.mp4).',
    chemin: '/videos/v4/f3-organisateur.mp4',
    message: 'Bonjour, découvrez Flowin Event en vidéo :' },
  { statut: 'brouillon', id: 'film-v4-f4-commerce-super-event', titre: 'Film réseaux sociaux : Super Event · commerce', public: ['commerce'], type: 'video', suivi: false,
    description: 'Format TikTok / Instagram, vertical, muet avec sous-titres (version 15 s : f4-15s.mp4).',
    chemin: '/videos/v4/f4-commerce-super-event.mp4',
    message: 'Bonjour, découvrez Flowin Event en vidéo :' },
  { statut: 'brouillon', id: 'film-v4-f5-participant-super-event', titre: 'Film réseaux sociaux : Super Event · participant', public: ['organisateur'], type: 'video', suivi: false,
    description: 'Format TikTok / Instagram, vertical, muet avec sous-titres (version 15 s : f5-15s.mp4).',
    chemin: '/videos/v4/f5-participant-super-event.mp4',
    message: 'Bonjour, découvrez Flowin Event en vidéo :' },
  { statut: 'brouillon', id: 'film-participant', titre: 'Film participant (scénarisé)', public: ['commerce', 'organisateur'], type: 'video', suivi: false,
    description: 'Flashe, joue, gagne, reviens : le jeu vu par le participant (34 s).',
    chemin: '/videos/flowin-film-participant.mp4',
    message: 'Bonjour, voici comment vos clients jouent avec Flowin :' },
  { statut: 'brouillon', id: 'film-pro', titre: 'Film pro (scénarisé)', public: ['commerce'], type: 'video', suivi: false,
    description: 'De l’inscription aux rapports : le parcours du commerçant mis en scène (40 s).',
    chemin: '/videos/flowin-film-pro.mp4',
    message: 'Bonjour, voici comment créer votre jeu Flowin :' },
  { statut: 'validé', id: 'video-animation-v3', titre: 'Vidéo Flowin Animation (présentation)', public: ['commerce'], type: 'video', suivi: false,
    description: 'Présentation animée de Flowin Animation, format vertical (27 s).',
    chemin: '/videos/flowin-animation-presentation.mp4',
    message: 'Bonjour, découvrez Flowin Animation en 30 secondes :' },
  { statut: 'validé', id: 'video-super-event-v3', titre: 'Vidéo Flowin Super Event (présentation)', public: ['organisateur', 'commerce'], type: 'video', suivi: false,
    description: 'La super diffusion locale de votre événement, format vertical (27 s).',
    chemin: '/videos/flowin-super-event-presentation.mp4',
    message: 'Bonjour, découvrez Flowin Super Event en 30 secondes :' },
  { statut: 'validé', id: 'video-parcours-commercant', titre: 'Vidéo parcours commerçant', public: ['commerce'], type: 'video', suivi: false,
    description: 'Le parcours vu par le commerçant : inscription, jeu, lots, publication, QR, rapports, super event (35 s).',
    chemin: '/videos/flowin-parcours-commercant.mp4',
    message: 'Bonjour, voici comment on crée son jeu Flowin :' },
  { statut: 'validé', id: 'plaquette-animation-v3', titre: 'Plaquette Flowin Animation V3', public: ['commerce'], type: 'plaquette', suivi: true,
    description: 'Présentation Flowin Animation (V3) : jeux, quiz, QR par support, fichier client, offres, inscription.',
    chemin: '/validation/plaquette-animation-v3.html',
    message: 'Bonjour, voici la présentation de Flowin Animation pour votre commerce :' },
  { statut: 'validé', id: 'plaquette-super-event-v3', titre: 'Plaquette Flowin Super Event V3', public: ['organisateur', 'commerce'], type: 'plaquette', suivi: true,
    description: 'La super diffusion locale de votre événement (V3) : avant, pendant, après, formules, contact.',
    chemin: '/validation/plaquette-super-event-v3.html',
    message: 'Bonjour, voici la présentation de Flowin Super Event :' },
  { statut: 'validé', id: 'plaquette-animation', titre: 'Plaquette Animation magasin', public: ['commerce'], type: 'plaquette', suivi: true,
    description: 'L’offre Animation pour un commerce : formules, prix, bouton « je m’inscris ».',
    chemin: '/plaquette-animation-magasin.html',
    message: 'Bonjour, voici la présentation de Flowin Animation pour votre magasin :' },
  { statut: 'validé', id: 'premiere-fois', titre: 'Inscription pro « Ma première fois »', public: ['commerce'], type: 'parcours', suivi: true,
    description: 'Création de l’espace pro en quelques minutes (SIRET, activité, points de vente, compte).',
    chemin: '/pro/premiere-fois',
    message: 'Bonjour, pour créer votre espace Flowin, c’est ici (quelques minutes) :' },
  { statut: 'validé', id: 'visite-guidee', titre: 'Visite guidée Flowin', public: ['commerce', 'organisateur'], type: 'parcours', suivi: false,
    description: 'Démo cliquable sans compte : parcours commerçant, organisateur et joueur (données fictives).',
    chemin: '/visite-guidee/index.html',
    message: 'Bonjour, découvrez Flowin en quelques clics, sans créer de compte :' },
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
  { statut: 'brouillon', id: 'storyboard-commerce', titre: 'Scénario vidéo commerçants (v16, 38 s, à valider)', public: ['commerce'], type: 'scenario', suivi: false,
    description: 'Storyboard v16 de la vidéo Flowin Animation pour les commerçants : le jeu, 4 bénéfices, les supports, QR « Je crée mon jeu ».',
    chemin: '/storyboards-video/v16-animation-commercants.html',
    message: 'Scénario vidéo à valider (ne pas diffuser) :' },
  { statut: 'brouillon', id: 'storyboard-organisateur', titre: 'Scénario vidéo organisateurs (v16, 47 s, à valider)', public: ['organisateur'], type: 'scenario', suivi: false,
    description: 'Storyboard v16 de la vidéo Flowin Super Event pour organisateurs et associations de commerçants. Fin : prendre rendez-vous.',
    chemin: '/storyboards-video/v16-super-event-organisateurs.html',
    message: 'Scénario vidéo à valider (ne pas diffuser) :' },
  { statut: 'brouillon', id: 'storyboard-partenaire', titre: 'Scénario vidéo partenaires (v16, 32 s, à valider)', public: ['partenaire'], type: 'scenario', suivi: false,
    description: 'Storyboard v16 de la vidéo Flowin Super Event pour les commerces station jeu. QR vers /rejoindre.',
    chemin: '/storyboards-video/v16-super-event-partenaires.html',
    message: 'Scénario vidéo à valider (ne pas diffuser) :' },
  { statut: 'brouillon', id: 'storyboard-joueur', titre: 'Scénario vidéo joueur générique (v16, 22 s, à valider)', public: ['commerce', 'partenaire'], type: 'scenario', suivi: false,
    description: 'Gabarit vidéo joueur « Flashe. Joue. Gagne. » avec exemple neutre ; QR de l’animation à insérer.',
    chemin: '/storyboards-video/v16-joueur-generique.html',
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
