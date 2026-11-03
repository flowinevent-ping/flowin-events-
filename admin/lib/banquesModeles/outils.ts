/**
 * Constructeurs compacts pour ecrire les banques modeles sans repetition.
 * Formats identiques a ceux de la table `banques` (voir lib/banques.ts) : aucun format invente.
 */
import type { Difficulte, ModeReponseModele, OptionBonus, QuestionBonus, QuestionQuiz, VariableModele } from '../banques'

export type Metier = 'restaurateur' | 'pizzeria' | 'boulanger' | 'boucher' | 'libraire'
export const METIERS: { id: Metier; nom: string }[] = [
  { id: 'restaurateur', nom: 'Restaurateur' },
  { id: 'pizzeria', nom: 'Pizzeria' },
  { id: 'boulanger', nom: 'Boulanger' },
  { id: 'boucher', nom: 'Boucher' },
  { id: 'libraire', nom: 'Libraire' },
]

/** Une banque modele : meme forme que la table `banques`, plus le(s) metier(s). */
export interface BanqueModele {
  id: string
  nom: string
  description: string
  metiers: Metier[]
  genre: 'quiz' | 'bonus'
  /** Contient des questions a variables : copie obligatoire + completion par le commercant. */
  personnalisable: boolean
  questions: (QuestionQuiz | QuestionBonus)[]
}

/** Quiz : la bonne reponse est placee a une position qui tourne (pas toujours la meme). */
export function creerQuiz(prefixe: string) {
  let n = 0
  return (theme: string, difficulte: Difficulte, texte: string, bonne: string, leurres: [string, string, string], explication: string): QuestionQuiz => {
    n++
    const pos = (n + Math.floor(n / 4)) % 4
    const options = leurres.slice(0, pos).concat([bonne], leurres.slice(pos))
    return { id: `${prefixe}-${String(n).padStart(2, '0')}`, type: 'qcm', texte, options, bonne: pos, points: 1, explication, theme, difficulte }
  }
}

/** Sondage bonus : pas de bonne reponse. */
export function creerBonus(prefixe: string) {
  let n = 0
  return (theme: string, label: string, options: string[], multi = false): QuestionBonus => {
    n++
    const opts: OptionBonus[] = options.map((o, i) => ({ val: String.fromCharCode(97 + i), label: o }))
    return { id: `${prefixe}-${String(n).padStart(2, '0')}`, type: multi ? 'multi' : 'single', label, options: opts, theme }
  }
}

/** Raccourci : variable a completer. */
export function V(cle: string, label: string, placeholder: string): VariableModele {
  return { cle, label, placeholder, valeur: '' }
}

/** Question a variables. Pour 'saisie' : les 3 mauvaises reponses sont aussi saisies par le pro. */
export function creerPerso(prefixe: string) {
  let n = 0
  return (theme: string, difficulte: Difficulte, texte: string, mode: ModeReponseModele, variables: VariableModele[], explication: string, leursDefaut?: [string, string, string]): QuestionQuiz => {
    n++
    let options: string[]
    if (mode === 'saisie') options = ['{reponse}', '{leurre1}', '{leurre2}', '{leurre3}']
    else if (mode === 'choix') options = ['{reponse}'].concat(leursDefaut ?? ['', '', ''])
    else options = ['{reponse}', '', '', '']
    return { id: `${prefixe}-${String(n).padStart(2, '0')}`, type: 'qcm', texte, options, bonne: 0, points: 1, explication, theme, difficulte, modele: { mode, variables } }
  }
}

export const LEURRES3 = (v: string): VariableModele[] => [
  V('leurre1', 'Mauvaise réponse n° 1', `[${v} à compléter : une autre proposition, fausse]`),
  V('leurre2', 'Mauvaise réponse n° 2', `[${v} à compléter : une autre proposition, fausse]`),
  V('leurre3', 'Mauvaise réponse n° 3', `[${v} à compléter : une autre proposition, fausse]`),
]
