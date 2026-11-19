/**
 * THEMES DES QUESTIONS BONUS (audit promesse L4, 19/11/2026) : promesse Super Event
 * « recueillir des infos RSE, mobilité, centres d'intérêt ». Les réponses bonus sont
 * rangées par thème, d'après la clé de la question (rse_*, bv_*, …). Rien d'inventé :
 * une clé inconnue va dans « Centres d'intérêt ».
 */
export type ThemeBonus = 'Mobilité' | 'RSE' | 'Centres d’intérêt'
export const THEMES_BONUS: ThemeBonus[] = ['RSE', 'Mobilité', 'Centres d’intérêt']

export function themeBonus(cle: string): ThemeBonus {
  const k = cle.toLowerCase()
  if (/mobil|covoit|venir|venue|acces|transport|_alt$|velo|bus/.test(k)) return 'Mobilité'
  if (/^rse|^bv|dechet|conso|environ|eco/.test(k)) return 'RSE'
  return 'Centres d’intérêt'
}

export function grouperParTheme<T>(tally: Record<string, T>): { theme: ThemeBonus; questions: [string, T][] }[] {
  return THEMES_BONUS
    .map(theme => ({ theme, questions: Object.entries(tally).filter(([k]) => themeBonus(k) === theme) }))
    .filter(g => g.questions.length > 0)
}
