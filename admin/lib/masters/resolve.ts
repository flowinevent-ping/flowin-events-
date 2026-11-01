/**
 * MASTERS DE JEUX — resolution « master + personnalisations » (la cascade).
 *
 * Regle validee (hypothese a confirmer par Romain, sa phrase etait coupee) :
 * MODIFIER UN MASTER MET A JOUR TOUTES LES ANIMATIONS QUI L'UTILISENT, SAUF LES
 * CHAMPS QUE L'ANIMATION A PERSONNALISES. Concretement, a chaque affichage :
 *
 *   1. valeurs du code      (lib/masters/defs.ts, MASTERS[id].defauts)
 *   2. valeurs du Super Admin (table jeux_masters.defauts — si la table existe)
 *   3. personnalisations de l'animation (events.cfg.master.perso)
 *   4. donnees reelles deja saisies ailleurs (nom du commerce, lots de la
 *      table `lots`, questions cfg.customQuestions / banques, cases
 *      cfg.spinSegments, candidats cfg.voteItems, cfg.logoUrl, date du tirage)
 *
 * Chaque niveau ne remplace que les champs qu'il renseigne (objets fusionnes
 * cle par cle ; une liste — lots, questions, cases… — est remplacee en bloc).
 * L'animation ne copie donc jamais le master : elle ne garde que ses ecarts.
 *
 * En mode reel, les EXEMPLES du master (lots, nom « … Exemple ») ne sont jamais
 * montres aux joueurs : un lot non saisi devient « [lots à compléter] ».
 */
import type { ParcoursPageData, QuizQuestion, BonusQuestion } from '@/lib/parcours'
import type { FlowinLot } from '@/lib/types'
import { MASTERS, L, estMasterId } from './defs'
import type { ContenuMaster, DefinitionMaster, LotAffiche, MasterId, CaseRoue, Candidat, PartenaireAffiche, CommerceAffiche, ReferenceMaster } from './types'

/** Partenaires d'exemple de la maquette (demo uniquement, jamais en reel). */
const PARTENAIRES_EXEMPLE: PartenaireAffiche[] = ([
  { nom: 'Sponsor Exemple 1', sponsor: true, distance: true, desc: 'Sponsor principal de l\'animation (texte d\'exemple).', lots: [L('bon', '50', '€', 'Bon d\'achat de 50 €', 'Tiré au sort parmi les tickets', 'tir'), L('produit', '1', 'panier', 'Un panier de produits locaux', 'Tiré au sort parmi les tickets', 'tir')] },
  { nom: 'Sponsor Exemple 2', sponsor: true, desc: 'Offre les lots du grand tirage (texte d\'exemple).' },
] as PartenaireAffiche[]).concat([1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ nom: 'Partenaire Exemple ' + i })))

/** Commerces d'exemple de la maquette (demo uniquement). */
const COMMERCES_EXEMPLE: CommerceAffiche[] = [
  { mono: 'CE', nom: 'Café Exemple', cat: 'Restauration', enjeu: 'Café offert, −10 % sur l\'addition', adresse: '[adresse à compléter]' },
  { mono: 'LE', nom: 'Librairie Exemple', cat: 'Culture', enjeu: 'Bon d\'achat 20 €, coffret de romans', adresse: '[adresse à compléter]' },
  { mono: 'FE', nom: 'Fleuriste Exemple', cat: 'Maison', enjeu: 'Bouquet de saison, une rose offerte', adresse: '[adresse à compléter]' },
]

export type DefautsBase = Partial<Record<MasterId, ContenuMaster>>

function estObjet(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}

/** Fusion cle par cle ; les listes et valeurs simples sont remplacees. */
export function fusionner<T>(base: T, dessus: unknown): T {
  if (!estObjet(dessus)) return base
  const out: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) }
  Object.keys(dessus).forEach(k => {
    const v = (dessus as Record<string, unknown>)[k]
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v) && v.length === 0) return
    out[k] = estObjet(v) && estObjet(out[k]) ? fusionner(out[k], v) : v
  })
  return out as T
}

/** Contenu d'un master apres les niveaux 1 a 3. */
export function contenuResolu(id: MasterId, base?: DefautsBase | null, perso?: ContenuMaster | null): ContenuMaster {
  let c = MASTERS[id].defauts
  if (base && base[id]) c = fusionner(c, base[id])
  if (perso) c = fusionner(c, perso)
  return c
}

/** Lit cfg.master d'un event (absent = l'event n'utilise pas les masters). */
export function referenceMaster(cfg: unknown): ReferenceMaster | null {
  const m = estObjet(cfg) ? (cfg as Record<string, unknown>).master : null
  if (!estObjet(m) || !estMasterId(m.id)) return null
  return { id: m.id, perso: estObjet(m.perso) ? (m.perso as ContenuMaster) : undefined }
}

/* ── Vue d'affichage, consommee par le moteur d'ecrans ───────────────────── */
export interface StationVue { id: string; nom: string; lat: number | null; lng: number | null; adresse?: string | null; categorie?: string | null; module?: string | null }
export interface SuperEventVue { id: string; nom: string; dates: string; nbStations: number; stations?: StationVue[]; lots?: LotAffiche[] }
export interface VueMaster {
  id: MasterId
  def: DefinitionMaster
  key: DefinitionMaster['cle']
  theme: string
  label: string
  demo: boolean
  evId: string | null
  who: { mono: string; nom: string; tag: string; logo?: string | null }
  achat: string
  achatAvec: boolean
  tirage: string
  lots: LotAffiche[]
  billet: LotAffiche
  billetChez: string
  how: [string, string][]
  accueilSous: string
  parrain: string
  questions: { txt: string; opts: string[]; ok: number; expl: string }[]
  bonus: { label: string; opts: string[] }[]
  cases: CaseRoue[]
  candidats: Candidat[]
  voteKicker: string
  voteTitre: string
  vitrines: Candidat[]
  sondage: { label: string; opts: string[] }[]
  vitrineAsso: string
  images: { hero?: string; vitrine?: string }
  commerce: { activite: string; adresse: string; horaires: string; site: string }
  partenaires: PartenaireAffiche[]
  commerces: CommerceAffiche[]
  superEvent: SuperEventVue | null
}

export function monogramme(nom: string): string {
  const mots = (nom || '').replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿ ]/g, ' ').split(/\s+/).filter(Boolean)
  if (!mots.length) return 'FL'
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase()
  return (mots[0][0] + mots[1][0]).toUpperCase()
}

const LIBELLE_TAG: Record<string, string> = { quiz: 'Quiz', solo: 'Quiz', spin: 'Roue', tombola: 'Tombola', vote: 'Vote', sej: 'Super event' }

function dateFr(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Lot reel (table lots + cfg.lots pour le type) -> lot affiche. */
function lotReel(l: FlowinLot & { conditions?: string | null; note?: string | null }, cfgLot?: { type?: string }): LotAffiche {
  const imm = (cfgLot && cfgLot.type === 'instantane') || /instantan/i.test(String(l.note || ''))
  const nom = (l.titre || l.nom || 'Lot').trim()
  const val = Number(l.valeur) || 0
  const glyphe = val > 0 ? L('bon', String(val), '€') : L('produit', '1', 'lot')
  return { ...glyphe, nom, cond: (l.conditions || '').trim() || (imm ? 'Gain immédiat' : 'Tiré au sort parmi les tickets'), mode: imm ? 'imm' : 'tir' }
}

function questionsReelles(data: ParcoursPageData): VueMaster['questions'] {
  const cfg = (data.ev?.cfg ?? {}) as Record<string, unknown>
  const out: VueMaster['questions'] = []
  const custom = Array.isArray(cfg.customQuestions) ? (cfg.customQuestions as Array<Record<string, unknown>>) : []
  custom.forEach(q => {
    const opts = Array.isArray(q.options) ? (q.options as unknown[]).map(o => typeof o === 'string' ? o : String((o as { label?: string })?.label ?? '')) : []
    const txt = String(q.texte ?? q.label ?? '')
    if (txt && opts.length >= 2) out.push({ txt, opts, ok: Number(q.bonne) || 0, expl: String(q.explication ?? '') })
  })
  ;(data.banques || []).forEach(b => {
    ;(b.questions || []).forEach((q: QuizQuestion) => {
      if (q && q.type === 'qcm' && q.texte && Array.isArray(q.options) && q.options.length >= 2) out.push({ txt: q.texte, opts: q.options, ok: Number(q.bonne) || 0, expl: q.explication || '' })
    })
  })
  return out
}

function bonusReels(data: ParcoursPageData): VueMaster['bonus'] {
  const cfg = (data.ev?.cfg ?? {}) as Record<string, unknown>
  const ids = Array.isArray(cfg.bonusBanques) ? (cfg.bonusBanques as string[]) : []
  const out: VueMaster['bonus'] = []
  ;(data.banques || []).filter(b => ids.indexOf(b.id) >= 0).forEach(b => {
    ;((b.questions || []) as unknown as BonusQuestion[]).forEach(q => {
      if (q && (q.type === 'single' || q.type === 'multi') && q.label && Array.isArray(q.options)) out.push({ label: q.label, opts: q.options.map(o => o.label) })
    })
  })
  return out
}

function casesReelles(cfg: Record<string, unknown>): CaseRoue[] {
  const segs = Array.isArray(cfg.spinSegments) ? (cfg.spinSegments as Array<{ label?: string; color?: string; perdant?: boolean; stock?: number; mode?: string }>) : []
  return segs.filter(s => s && s.label).map(s => ({
    label: String(s.label), fond: s.color || '#EAEFFB', texte: '#1B3A5C',
    issue: s.perdant ? 'perdu' : (s.mode === 'tirage' ? 'tir' : 'imm'), stock: s.stock,
  }))
}

function candidatsReels(cfg: Record<string, unknown>): Candidat[] {
  const items = Array.isArray(cfg.voteItems) ? (cfg.voteItems as Array<{ nom?: string; desc?: string; photo?: string; image?: string }>) : []
  return items.filter(i => i && i.nom).map(i => ({ nom: String(i.nom), sous: i.desc || '', photo: i.photo || i.image || undefined }))
}

export interface OptionsVue {
  /** Valeurs du Super Admin (table jeux_masters), si disponibles. */
  base?: DefautsBase | null
  /** Force un master (apercu SA / demo). */
  masterId?: MasterId | null
  /** Personnalisations a appliquer en plus (apercu pendant la saisie). */
  perso?: ContenuMaster | null
  /** Pas d'event : les exemples du master sont montres (maquette navigable). */
  demo?: boolean
  superEvent?: VueMaster['superEvent']
}

/** Construit la vue d'un jeu master a partir des donnees de l'event. */
export function construireVue(data: ParcoursPageData | null, o: OptionsVue = {}): VueMaster {
  const ev = data?.ev ?? null
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const ref = referenceMaster(cfg)
  const id: MasterId = o.masterId || ref?.id || (ev && estMasterId(ev.module) ? ev.module : 'quiz')
  const def = MASTERS[id]
  const demo = o.demo !== undefined ? !!o.demo : !ev
  let c = contenuResolu(id, o.base, ref?.perso)
  if (o.perso) c = fusionner(c, o.perso)

  /* Niveau 4 : donnees reelles. */
  const nomReel = ev ? String(((cfg.front as Record<string, unknown> | undefined)?.titre as string) || cfg.nomCourt || ev.nom || '').trim() : ''
  const nom = (demo ? (c.commerce?.nom || nomReel) : (nomReel || c.commerce?.nom)) || '[nom du commerce à compléter]'
  const logo = (cfg.logoUrl as string) || (c.commerce?.logoUrl) || null
  const cfgLots = Array.isArray(cfg.lots) ? (cfg.lots as Array<{ nom?: string; type?: string }>) : []
  let lots: LotAffiche[] = c.lots || []
  if (data && data.lots && data.lots.length) {
    lots = data.lots.map(l => lotReel(l as FlowinLot & { conditions?: string | null }, cfgLots.find(x => (x.nom || '').trim() === (l.titre || l.nom || '').trim())))
  } else if (!demo && !(ref?.perso?.lots?.length || o.perso?.lots?.length)) {
    lots = [L('produit', '?', 'lot', '[lots à compléter]', 'Le commerce n\'a pas encore saisi ses lots', 'tir')]
  }
  const tirageReel = (cfg.tirageDate as string)
    || dateFr(((cfg.tirage as Record<string, unknown> | undefined)?.date as string) || (cfg.drawDate as string))
  const tirage = tirageReel || ((demo || ref?.perso?.tirageDate || o.perso?.tirageDate) ? (c.tirageDate || '') : '') || '[date du tirage à compléter]'
  const achatAvec = (cfg.achat && typeof cfg.achat === 'object' ? (cfg.achat as { obligatoire?: boolean }).obligatoire === true : c.achat === 'avec')
  const achatMin = (cfg.achat && typeof cfg.achat === 'object' ? String((cfg.achat as { montantMin?: string }).montantMin || '') : (c.achatMin || ''))
  const qReelles = data ? questionsReelles(data) : []
  const bReels = data ? bonusReels(data) : []
  const cReelles = casesReelles(cfg)
  const vReels = candidatsReels(cfg)
  const nbQ = Math.max(1, Number(cfg.quizNbQuestions) || 3)
  const questions = (qReelles.length ? qReelles : (c.questions || []).map(q => ({ txt: q.txt, opts: q.opts, ok: q.ok, expl: q.expl || '' }))).slice(0, def.cle === 'quiz' || def.cle === 'solo' ? Math.min(nbQ, 10) : 0)
  const billetLot = lots.find(l => l.mode === 'imm') || lots[0] || L('produit', '1', 'lot', 'Ton lot', '', 'tir')

  const partenaires: PartenaireAffiche[] = (data?.partenaires?.length ? data.partenaires.map(p => {
    const pp = p as unknown as Record<string, unknown>
    const plots = Array.isArray(pp.lots) ? (pp.lots as Array<{ nom?: string; titre?: string; valeur?: number; valeur_euros?: number }>) : []
    return {
      nom: String(pp.nom || ''), logo: (pp.image_url as string) || null, sponsor: !!pp.sponsor, distance: !!pp.distance,
      desc: String(pp.description || pp.promo_text || ''), site: (pp.site_web as string) || (pp.url as string) || null,
      instagram: (pp.instagram as string) || null, facebook: (pp.facebook as string) || null,
      lots: plots.filter(x => x.nom || x.titre).map(x => { const v = Number(x.valeur_euros || x.valeur) || 0; return { ...(v > 0 ? L('bon', String(v), '€') : L('produit', '1', 'lot')), nom: String(x.titre || x.nom), cond: 'Tiré au sort parmi les tickets', mode: 'tir' as const } }),
    }
  }) : (c.partenaires && c.partenaires.length ? c.partenaires : (demo ? PARTENAIRES_EXEMPLE : [])))

  const commerces: CommerceAffiche[] = [{ mono: monogramme(nom), nom, cat: c.commerce?.activite || '', enjeu: lots.slice(0, 2).map(l => l.nom).join(', '), adresse: (ev?.adresse as string) || c.commerce?.adresse || null }]
  if (demo) COMMERCES_EXEMPLE.forEach(x => commerces.push(x))
  ;(data?.partenaires || []).forEach(p => {
    const pp = p as unknown as Record<string, unknown>
    if (pp.jeu_event_id) commerces.push({ mono: monogramme(String(pp.nom || '')), nom: String(pp.nom || ''), cat: '', enjeu: '', adresse: (pp.adresse as string) || null, href: `/jouer?ev=${encodeURIComponent(String(pp.jeu_event_id))}` })
  })

  return {
    id, def, key: def.cle, theme: def.theme, label: def.nom, demo, evId: ev?.id ?? null,
    who: { mono: monogramme(nom), nom, tag: LIBELLE_TAG[def.cle] + ' · Jeu gratuit', logo },
    achat: achatAvec ? ('Avec obligation d\'achat' + (achatMin ? ' (minimum ' + achatMin + ')' : '')) : 'Sans obligation d\'achat',
    achatAvec,
    tirage,
    lots,
    billet: billetLot,
    billetChez: nom,
    how: c.how || [],
    accueilSous: c.accueilSous || (questions.length + ' questions, des tickets à gagner'),
    parrain: c.parrain || '',
    questions,
    bonus: def.cle === 'quiz' ? (bReels.length ? bReels : (c.bonus || [])).slice(0, 4) : [],
    cases: cReelles.length >= 2 ? cReelles : (c.cases || []),
    candidats: vReels.length ? vReels : (c.candidats || []),
    voteKicker: c.voteKicker || '',
    voteTitre: c.voteTitre || 'Vote pour ton préféré',
    vitrines: c.vitrines || [],
    sondage: c.sondage || [],
    vitrineAsso: c.vitrineAsso || '[association à compléter]',
    images: c.images || {},
    commerce: {
      activite: c.commerce?.activite || '',
      adresse: (ev?.adresse as string) || c.commerce?.adresse || '[Adresse à compléter]',
      horaires: c.commerce?.horaires || '[Horaires à compléter]',
      site: c.commerce?.site || '',
    },
    partenaires,
    commerces,
    superEvent: o.superEvent ?? (demo && def.cle !== 'sej' ? { id: '', nom: 'Marché de Noël Exemple', dates: '1er → 31 décembre 2026', nbStations: 12 } : null),
  }
}
