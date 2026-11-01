/**
 * Bascule vers le parcours master (/jouer) de TOUTES les animations dont le
 * jeu est un master (Quiz + bonus, Quiz solo, Roue, Tombola, Vote), y compris
 * celles creees avant les masters : les anciens QR /parcours/<module>?ev=…
 * restent valables et arrivent sur /jouer (decision du 01/11 : « une seule
 * presentation partout »). Seule une animation qui a explicitement choisi
 * « Ancienne presentation » (events.cfg.masterOff = true) garde l'ancien
 * parcours. Nuits du Sud (/parcours/nds2026) et Quiz Master n'appellent
 * jamais ceci.
 */
import { redirect } from 'next/navigation'
import { estModuleMaster } from './apercu'

export function versMasterSiBesoin(evId: string, cfg: unknown, sp: Record<string, string | undefined>, module?: string | null): void {
  if (!evId) return
  const c = (cfg && typeof cfg === 'object' ? cfg : {}) as Record<string, unknown>
  if (c.masterOff === true) return
  const m = c.master && typeof c.master === 'object' ? (c.master as { id?: string }).id : null
  if (!m && !estModuleMaster(module)) return
  const q = new URLSearchParams()
  q.set('ev', evId)
  ;['source', 'ref', 'etab', 'ch', 'apercu', 'token'].forEach(k => { if (sp[k]) q.set(k, String(sp[k])) })
  if (sp.preview !== undefined) q.set('preview', '1')
  if (sp.bar === '0' || sp.sb === '1') q.set('sb', sp.bar === '0' ? '0' : '1')
  redirect('/jouer?' + q.toString())
}

/**
 * Ancien QR dont l'URL contient le jeu (/parcours/<jeu>?ev=...) alors que l'animation a
 * CHANGE de jeu depuis l'impression (audit QR du 01/11). Sans ceci, /parcours/spin?ev=X
 * affichait la roue pour une animation devenue Quiz Master (ou Nuits du Sud) : mauvais jeu,
 * mauvaises regles. Ici on renvoie vers le parcours du jeu ACTUEL, en gardant source & co
 * (l'attribution au QR est conservee). Les jeux « masters » n'ont pas besoin de ce renvoi :
 * versMasterSiBesoin les envoie deja sur /jouer, qui lit le jeu actuel. Jamais en apercu.
 */
const PARCOURS_CONNUS = ['quiz', 'quizsolo', 'quizmaster', 'spin', 'tombola', 'vote', 'nds2026']
export function versBonJeuSiAutre(routeModule: string, evId: string, module: string | null | undefined, sp: Record<string, string | undefined>): void {
  if (!evId || !module || module === routeModule) return
  if (sp.preview !== undefined || sp.apercu) return
  if (PARCOURS_CONNUS.indexOf(module) < 0) return
  if (routeModule !== 'quizmaster' && estModuleMaster(module)) return
  const q = new URLSearchParams()
  q.set('ev', evId)
  ;['source', 'ref', 'etab', 'ch', 'token'].forEach(k => { if (sp[k]) q.set(k, String(sp[k])) })
  redirect('/parcours/' + module + '?' + q.toString())
}
