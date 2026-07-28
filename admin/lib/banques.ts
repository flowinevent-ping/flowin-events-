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
