/**
 * DÉMO — « Fêtes du haut et moyen pays » (03/11/2026). Romain AUTORISE explicitement d'inventer, UNIQUEMENT pour cette fête :
 *   - un logo (public/demo/fhmp-logo.svg : « FHMP », fête de village du haut et moyen pays, charte bleu/violet, sans enseigne réelle) ;
 *   - un jeu Quiz + bonus dont les questions portent sur la fête et le haut et moyen pays (faits locaux prudents et vérifiables).
 * Tout est marqué « démo » : ces contenus ne servent QU'À L'APERÇU du parcours « rejoindre un super event » (aucune écriture en base).
 * Les mêmes valeurs sont déposées en base par sql/11-super-events-demo.sql (NON appliqué).
 * Avant : l'aperçu de cette fête affichait le visuel Nuits du Sud, parce que son jeu est « nds2026 ».
 */
export const FHMP_DEMO = {
  /** Identifiant du super event en base (sql/reparer_id_super_event_fetes_haut_moyen_pays.sql). */
  motif: /fetes-du-haut-et-moyen-pays/i,
  nom: 'Fêtes du haut et moyen pays',
  logoUrl: '/demo/fhmp-logo.svg',
  /** Questions du quiz (format cfg.customQuestions lu par lib/masters/resolve.ts). DEMO. */
  questions: [
    { texte: 'Dans quel département se trouve Vence ?', options: ['Les Alpes-Maritimes', 'Le Var', 'Les Alpes-de-Haute-Provence', 'Le Vaucluse'], bonne: 0, explication: 'Vence se situe dans les Alpes-Maritimes (06), entre mer et montagne.' },
    { texte: 'Quel arbre, très présent dans l’arrière-pays méditerranéen, donne une huile réputée ?', options: ['Le chêne', 'L’olivier', 'Le hêtre', 'Le bouleau'], bonne: 1, explication: 'L’olivier est emblématique des paysages méditerranéens et de leurs fêtes.' },
    { texte: 'Quel duo d’instruments accompagne traditionnellement les fêtes de village provençales ?', options: ['Le galoubet et le tambourin', 'Le violon et la harpe', 'La cornemuse et le banjo', 'Le piano et la contrebasse'], bonne: 0, explication: 'Le galoubet-tambourin est l’instrument traditionnel des fêtes provençales.' },
    { texte: 'Quelle ville voisine est célèbre pour son industrie du parfum ?', options: ['Grasse', 'Menton', 'Antibes', 'Cannes'], bonne: 0, explication: 'Grasse est connue dans le monde entier pour ses parfums.' },
  ],
  /** Questions bonus (sondage sans bonne réponse, format cfg.customBonus). DEMO. */
  bonus: [
    { label: 'Comment avez-vous connu la fête ?', options: ['Bouche à oreille', 'Réseaux sociaux', 'Affiche ou flyer', 'Je viens chaque année'] },
    { label: 'Venez-vous du haut pays, du moyen pays ou d’ailleurs ?', options: ['Du haut pays', 'Du moyen pays', 'Du littoral', 'D’ailleurs'] },
  ],
}
export const estFeteHautMoyenPays = (seId: string | null | undefined) => !!seId && FHMP_DEMO.motif.test(seId)
/** Cfg d'aperçu (cfg.logoUrl, cfg.customQuestions, cfg.customBonus) : jeu Quiz + bonus de la démo. */
export function cfgApercuFhmp(): Record<string, unknown> {
  return { logoUrl: FHMP_DEMO.logoUrl, customQuestions: FHMP_DEMO.questions, customBonus: FHMP_DEMO.bonus, quizNbQuestions: 3, demo: true }
}

/** « Nice Jazz Festival » : événement FACTICE de démonstration (logo générique « jazz », aucun logo officiel). */
export const NICE_JAZZ_DEMO = { motif: /nice-jazz-festival-demo/i, logoUrl: '/demo/nice-jazz-logo.svg' }
/** Les deux événements factices (à supprimer plus tard) : drapeau demo dans cfg_jeu, ou identifiant connu. */
export function estSuperEventDemo(s: { id?: string | null; cfg_jeu?: unknown } | null | undefined): boolean {
  if (!s) return false
  const cfg = s.cfg_jeu && typeof s.cfg_jeu === 'object' ? (s.cfg_jeu as { demo?: unknown }) : null
  return cfg?.demo === true || estFeteHautMoyenPays(s.id) || NICE_JAZZ_DEMO.motif.test(s.id ?? '')
}
/** Cfg d'aperçu d'une opération de démonstration (undefined = opération réelle : aucun contenu inventé). */
export function cfgApercuDemo(seId: string | null | undefined): Record<string, unknown> | undefined {
  if (estFeteHautMoyenPays(seId)) return cfgApercuFhmp()
  if (seId && NICE_JAZZ_DEMO.motif.test(seId)) return { logoUrl: NICE_JAZZ_DEMO.logoUrl, demo: true }
  return undefined
}
