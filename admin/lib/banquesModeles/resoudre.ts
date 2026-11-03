/**
 * Questions personnalisees : transformation d un modele (avec {variables}) en question
 * jouable, et controles. Module PUR (aucun import reseau) : utilise aussi par les scripts de
 * controle (admin/scripts/banques-modeles.mjs).
 *
 * Regle d or : une variable non renseignee ne s affiche JAMAIS au joueur. Une question
 * incomplete est ecartee (resoudreQuestion renvoie null) ; l editeur, lui, montre ce qui manque.
 */
import type { QuestionBanque, QuestionQuiz, VariableModele } from '../banques'

const RE_VAR = /\{([a-z0-9_]+)\}/gi
const RE_RESIDU = /\{[^{}]*\}/

export function anneeCourante(): number { return new Date().getFullYear() }

/** Petit hachage stable : meme question -> meme place de la bonne reponse (pas de hasard a l affichage). */
function graine(id: string): number {
  let h = 7
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003
  return h
}

export function remplacer(texte: string, vals: Record<string, string>): string {
  return texte.replace(RE_VAR, (m, cle: string) => (cle in vals ? vals[cle] : m))
}

function valeursDe(vars: VariableModele[]): Record<string, string> {
  const v: Record<string, string> = {}
  vars.forEach(x => { v[x.cle] = (x.valeur ?? '').trim() })
  return v
}

/** Trois mauvaises annees plausibles, jamais dans le futur, jamais egales a la bonne. */
export function leurresAnnee(y: number, max = anneeCourante()): string[] {
  const cand = [y - 3, y + 4, y - 7, y + 8, y - 12, y - 1, y + 2, y - 15, y - 20]
  const out: number[] = []
  cand.forEach(c => { if (c <= max && c >= 1500 && c !== y && out.indexOf(c) < 0 && out.length < 3) out.push(c) })
  return out.map(String)
}

/** Trois mauvais nombres : moitie, moitie en plus, double (ou +1/+2/+3 pour les petits nombres). */
export function leurresNombre(n: number): string[] {
  const cand = n >= 4 ? [Math.round(n / 2), Math.round(n * 1.5), n * 2, n * 3] : [n + 1, n + 2, n + 3, n + 4]
  const out: number[] = []
  cand.forEach(c => { if (c > 0 && c !== n && out.indexOf(c) < 0 && out.length < 3) out.push(c) })
  return out.map(String)
}

export interface DiagnosticQuestion {
  /** Vrai si la question est jouable telle quelle. */
  complet: boolean
  /** Variables encore vides. */
  manquants: VariableModele[]
  /** Probleme de contenu (annee invalide, doublon...). */
  probleme?: string
  /** Question prete a poser (si complet). */
  resolue?: QuestionQuiz
}

export function estModele(q: QuestionBanque): q is QuestionQuiz & { modele: NonNullable<QuestionQuiz['modele']> } {
  return !!(q as QuestionQuiz).modele
}

export function diagnostiquerModele(q: QuestionQuiz): DiagnosticQuestion {
  const m = q.modele
  if (!m) return { complet: true, manquants: [] }
  const manquants = m.variables.filter(v => !(v.valeur ?? '').trim())
  if (manquants.length) return { complet: false, manquants }
  const vals = valeursDe(m.variables)
  const reponse = vals['reponse'] ?? ''
  if (m.mode === 'annee') {
    const y = Number(reponse)
    if (!/^\d{4}$/.test(reponse) || y < 1500 || y > anneeCourante()) return { complet: false, manquants: [], probleme: 'Indiquez une année à 4 chiffres, pas dans le futur.' }
  }
  if (m.mode === 'nombre') {
    if (!/^\d{1,6}$/.test(reponse) || Number(reponse) < 1) return { complet: false, manquants: [], probleme: 'Indiquez un nombre entier supérieur à 0.' }
  }
  const texte = remplacer(q.texte, vals).trim()
  const explication = q.explication ? remplacer(q.explication, vals).trim() : undefined
  let bonneTxt: string
  let leurres: string[]
  if (m.mode === 'annee') { bonneTxt = reponse; leurres = leurresAnnee(Number(reponse)) }
  else if (m.mode === 'nombre') { bonneTxt = reponse; leurres = leurresNombre(Number(reponse)) }
  else {
    const opts = q.options.map(o => remplacer(o, vals).trim())
    bonneTxt = opts[q.bonne] ?? ''
    leurres = opts.filter((_, i) => i !== q.bonne)
  }
  if (leurres.some(l => !l) || !bonneTxt) return { complet: false, manquants: [], probleme: 'Une proposition est vide.' }
  const bas = leurres.concat([bonneTxt]).map(x => x.toLowerCase())
  if (bas.filter((x, i) => bas.indexOf(x) !== i).length) return { complet: false, manquants: [], probleme: 'Deux propositions sont identiques : changez une mauvaise réponse.' }
  if (leurres.length !== 3) return { complet: false, manquants: [], probleme: 'Il faut 1 bonne réponse et 3 mauvaises.' }
  const pos = graine(q.id) % 4
  const options = leurres.slice(0, pos).concat([bonneTxt], leurres.slice(pos))
  const resolue: QuestionQuiz = { ...q, texte, options, bonne: pos, explication }
  delete resolue.modele
  if (RE_RESIDU.test(texte + ' ' + options.join(' ') + ' ' + (explication ?? ''))) return { complet: false, manquants: [], probleme: 'Une {variable} n’est pas remplie.' }
  return { complet: true, manquants: [], resolue }
}

/** Question prete pour le joueur, ou null si elle ne doit pas etre posee. */
export function resoudreQuestion(q: QuestionBanque): QuestionBanque | null {
  if (estModele(q)) {
    const d = diagnostiquerModele(q)
    return d.complet && d.resolue ? d.resolue : null
  }
  const brut = q.type === 'qcm'
    ? [q.texte, q.explication ?? '', ...q.options].join(' ')
    : [(q as { label: string }).label, ...((q as { options: { label: string }[] }).options ?? []).map(o => o.label)].join(' ')
  return RE_RESIDU.test(brut) ? null : q
}

/** A appliquer au chargement des banques cote joueur : aucune {variable} ne doit jamais s afficher. */
export function preparerBanquesJoueur<T extends { questions?: unknown }>(banques: T[]): T[] {
  return banques.map(b => {
    const qs = Array.isArray(b.questions) ? (b.questions as QuestionBanque[]) : null
    if (!qs) return b
    return { ...b, questions: qs.map(resoudreQuestion).filter((x): x is QuestionBanque => x !== null) }
  })
}

/** Nombre de questions jouables / a completer d une liste (affichage editeur et choix du jeu). */
export function compterJouables(qs: QuestionBanque[] | null | undefined): { jouables: number; aCompleter: number } {
  let jouables = 0, aCompleter = 0
  ;(qs ?? []).forEach(q => { if (resoudreQuestion(q)) jouables++; else aCompleter++ })
  return { jouables, aCompleter }
}
