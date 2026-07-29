import { supabase } from './supabase'

/**
 * Banques de questions -- table `banques` deja existante et deja utilisee en production
 * (verifie en base le 28/07/2026). ATTENTION : deux formats distincts cohabitent dans la
 * meme colonne `questions` jsonb, selon que la banque est un quiz ou un sondage bonus --
 * jamais un format unique invente ici, les deux formats reels sont repris a l'identique :
 *
 * - QUIZ (lu par app/parcours/quiz/QuizClient.tsx) :
 *   { id, type:'qcm', texte, options: string[], bonne: number (index reponse correcte),
 *     points, explication }
 * - BONUS / SONDAGE (lu par le rendu des questions bonus en jeu) :
 *   { id, type:'single'|'multi', label, options: [{val,label}] }
 *
 * Colonne `statut` ajoutee le 28/07/2026 (migration additive, defaut 'brouillon') pour le
 * bouton Valider demande par Romain.
 */

export interface QuestionQuiz {
  id: string
  type: 'qcm'
  texte: string
  options: string[]
  bonne: number
  points?: number
  explication?: string
}
export interface OptionBonus { val: string; label: string }
export interface QuestionBonus {
  id: string
  type: 'single' | 'multi'
  label: string
  options: OptionBonus[]
}
export type QuestionBanque = QuestionQuiz | QuestionBonus

export interface Banque {
  id: string
  nom: string
  description: string | null
  pro_id: string
  event_ids: string[]
  tags: string[]
  questions: QuestionBanque[]
  statut: 'brouillon' | 'valide'
  created_at: string
  updated_at: string
}

export async function fetchBanquesPro(proId: string): Promise<Banque[]> {
  if (!proId) return []
  const { data, error } = await supabase
    .from('banques')
    .select('*')
    .eq('pro_id', proId)
    .order('updated_at', { ascending: false })
  if (error) { console.error('[fetchBanquesPro]', error.message); return [] }
  return (data ?? []) as Banque[]
}

export async function fetchBanque(id: string): Promise<Banque | null> {
  const { data, error } = await supabase.from('banques').select('*').eq('id', id).maybeSingle()
  if (error) { console.error('[fetchBanque]', error.message); return null }
  return data as Banque | null
}

/** Cree une banque vide (nom + tags fournis par le pro), pret a etre remplie. */
export async function creerBanque(params: { proId: string; nom: string; tags: string[]; eventIds?: string[] }): Promise<Banque | null> {
  const id = 'bq-' + params.proId.replace(/^pro-/, '') + '-' + Math.random().toString(36).slice(2, 8)
  const { data, error } = await supabase
    .from('banques')
    .insert({ id, nom: params.nom, pro_id: params.proId, tags: params.tags, event_ids: params.eventIds ?? [], questions: [], statut: 'brouillon' })
    .select('*')
    .maybeSingle()
  if (error) { console.error('[creerBanque]', error.message); return null }
  return data as Banque | null
}

/** Enregistre le contenu des questions. `valider=true` passe le statut a 'valide' (bouton Valider). */
export async function enregistrerBanque(id: string, questions: QuestionBanque[], valider: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('banques')
    .update({ questions, statut: valider ? 'valide' : 'brouillon', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('[enregistrerBanque]', error.message); return false }
  return true
}

export function nouvelleQuestionQuiz(): QuestionQuiz {
  return { id: 'q_' + Math.random().toString(36).slice(2, 9), type: 'qcm', texte: '', options: ['', ''], bonne: 0, points: 1 }
}
export function nouvelleQuestionBonus(): QuestionBonus {
  return { id: 'q_' + Math.random().toString(36).slice(2, 9), type: 'single', label: '', options: [{ val: 'a', label: '' }, { val: 'b', label: '' }] }
}

/** Un bloc de 4 questions vierges, proposition de depart demandee par Romain. */
export function blocDeQuatre(bonus: boolean): QuestionBanque[] {
  const f = bonus ? nouvelleQuestionBonus : nouvelleQuestionQuiz
  return [f(), f(), f(), f()]
}

/**
 * Import texte colle par le pro -> questions. Format tolerant, pas de CSV strict exige :
 *   - blocs separes par une ligne vide (ou une ligne "---")
 *   - 1ere ligne du bloc = intitule de la question
 *   - lignes suivantes = les reponses, une par ligne
 *   - pour un quiz, prefixer la bonne reponse par "*" (sinon la 1ere reponse est prise par defaut)
 * Marche a l'identique pour quiz et bonus (seul le mapping de sortie change).
 */
export function parseImportQuestions(texte: string, bonus: boolean): QuestionBanque[] {
  const blocs = texte
    .split(/\r?\n\s*(?:---+\s*)?\r?\n/)
    .map(b => b.trim())
    .filter(Boolean)
  const out: QuestionBanque[] = []
  for (const bloc of blocs) {
    const lignes = bloc.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lignes.length < 3) continue // au moins 1 intitule + 2 reponses
    const [intitule, ...reponses] = lignes
    const propre = (s: string) => s.replace(/^[-*]\s*/, '').trim()
    if (bonus) {
      const q = nouvelleQuestionBonus()
      q.label = propre(intitule)
      q.type = reponses.some(r => /^\[x\]|^\*/.test(r)) ? 'multi' : 'single'
      q.options = reponses.map((r, i) => ({ val: String.fromCharCode(97 + i), label: propre(r) }))
      out.push(q)
    } else {
      const q = nouvelleQuestionQuiz()
      q.texte = propre(intitule)
      q.options = reponses.map(propre)
      const idx = reponses.findIndex(r => r.trim().startsWith('*'))
      q.bonne = idx >= 0 ? idx : 0
      out.push(q)
    }
  }
  return out
}

/** Reponse attendue de /api/pro/generer-questions, mappee vers les types internes. */
export function mapQuestionsIA(brut: any[], bonus: boolean): QuestionBanque[] {
  return brut.map(b => {
    if (bonus) {
      const q = nouvelleQuestionBonus()
      q.label = String(b.label ?? '').trim()
      q.type = b.type === 'multi' ? 'multi' : 'single'
      const opts: string[] = Array.isArray(b.options) ? b.options : []
      q.options = opts.map((o, i) => ({ val: String.fromCharCode(97 + i), label: String(o).trim() }))
      return q
    }
    const q = nouvelleQuestionQuiz()
    q.texte = String(b.texte ?? '').trim()
    const opts: string[] = Array.isArray(b.options) ? b.options : []
    q.options = opts.map(o => String(o).trim())
    const bonne = Number(b.bonne)
    q.bonne = Number.isFinite(bonne) && bonne >= 0 && bonne < q.options.length ? bonne : 0
    return q
  }).filter(q => bonus ? (q as QuestionBonus).label : (q as QuestionQuiz).texte)
}
