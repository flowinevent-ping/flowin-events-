/**
 * Catalogue des BANQUES MODELES (restauration, boulanger, boucher, libraire) -- donnees en code,
 * au format exact de la table `banques` (voir lib/banques.ts). Deux usages :
 *  1. « Ajouter a mes banques » (copie dans la table `banques` du pro, par le pro lui-meme) ;
 *  2. sql/12-banques-quiz.sql, genere par admin/scripts/banques-modeles.mjs et NON applique.
 */
import { BANQUES_RESTAURATION_QUIZ } from './restaurationQuiz'
import { BANQUES_RESTAURATION_BONUS } from './restaurationBonus'
import { BANQUES_METIERS } from './metiers'
import { BANQUES_PERSONNALISEES } from './personnalises'
import type { BanqueModele, Metier } from './outils'

export { METIERS } from './outils'
export type { BanqueModele, Metier } from './outils'

export const BANQUES_MODELES: BanqueModele[] = [
  ...BANQUES_RESTAURATION_QUIZ,
  ...BANQUES_RESTAURATION_BONUS,
  ...BANQUES_PERSONNALISEES.slice(0, 2),
  ...BANQUES_METIERS.slice(0, 2),
  BANQUES_PERSONNALISEES[2],
  ...BANQUES_METIERS.slice(2, 4),
  BANQUES_PERSONNALISEES[3],
  ...BANQUES_METIERS.slice(4, 6),
  BANQUES_PERSONNALISEES[4],
]

export function modelesDuMetier(m: Metier | 'tous'): BanqueModele[] {
  return m === 'tous' ? BANQUES_MODELES : BANQUES_MODELES.filter(b => b.metiers.indexOf(m) >= 0)
}

/** Tags ecrits en base : genre + metiers + marqueur « modele » (+ « a-completer » si variables). */
export function tagsDe(b: BanqueModele): string[] {
  const t: string[] = [b.genre]
  return t.concat(b.metiers, ['modele'], b.personnalisable ? ['a-completer'] : [])
}
