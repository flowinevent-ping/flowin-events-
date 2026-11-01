/**
 * QR PERMANENTS (permaliens) — audit QR du 01/11.
 *
 * Un QR imprime encode  <domaine>/q/<code court>  et RIEN d'autre : ni le jeu, ni
 * l'identifiant de l'animation, ni le slug. Le serveur (app/q/[code]/route.ts)
 * retrouve la station (qr_stations.code_court) et envoie le joueur vers le jeu
 * ACTUEL de l'animation par une redirection 302. On peut donc changer de quiz,
 * de jeu, de lots ou de dates sans reimprimer.
 *
 * Domaine : fige ici. Un futur domaine se change par la variable
 * NEXT_PUBLIC_FLOWIN_BASE_URL (https://… sans chemin) ; une valeur invalide ou qui
 * ressemble a un apercu Vercel est IGNOREE (on garde la production) : aucune URL
 * de preview ne peut finir dans un QR imprime.
 */
import { estModuleMaster } from '@/lib/masters/apercu'

export const BASE_PROD_DEFAUT = 'https://flowin-events.vercel.app'

/** Hote d'apercu / local / adresse IP : interdit dans un QR. */
export function estUrlNonImprimable(base: string): boolean {
  let h = ''
  try { h = new URL(base).hostname.toLowerCase() } catch { return true }
  if (h === 'localhost' || /^[0-9.]+$/.test(h) || h.indexOf(':') >= 0) return true
  /* Apercus Vercel : <projet>-<hash>-<equipe>.vercel.app ou <projet>-git-<branche>-<equipe>.vercel.app.
     Seul le domaine de production (sans -git- ni hash) est accepte. */
  if (/\.vercel\.app$/.test(h) && (h.indexOf('-git-') >= 0 || /-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/.test(h))) return true
  return false
}

/** Domaine canonique : la variable si elle est propre, sinon la production. */
export function baseCanonique(env?: string | null): string {
  const v = (env ?? '').trim().replace(/\/+$/, '')
  if (!v) return BASE_PROD_DEFAUT
  try {
    const u = new URL(v)
    if (u.protocol !== 'https:' || (u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) return BASE_PROD_DEFAUT
    if (estUrlNonImprimable(v)) return BASE_PROD_DEFAUT
    return u.origin
  } catch { return BASE_PROD_DEFAUT }
}

/** Lu une fois (NEXT_PUBLIC_* est fige au build). */
export const BASE_CANONIQUE = baseCanonique(process.env.NEXT_PUBLIC_FLOWIN_BASE_URL)

/** Format d'un code court : 8 a 32 caracteres minuscules / chiffres. */
export const FORMAT_CODE = /^[a-z0-9]{8,32}$/
export const estCodeValide = (c: string | null | undefined): boolean => !!c && FORMAT_CODE.test(c)

/** Lien PERMANENT d'un QR : c'est celui qu'on imprime, qu'on copie et qu'on encode. */
export const lienPermanent = (code: string, base: string = BASE_CANONIQUE): string => `${base}/q/${code}`

/** Ancien format (le jeu est dans l'URL) : garde pour les QR deja imprimes et
 *  pour les stations sans code (SQL 08 non applique). */
export const lienAncien = (eventId: string, module: string | null | undefined, source?: string | null, base: string = BASE_CANONIQUE): string =>
  `${base}/parcours/${module || 'nds2026'}?ev=${encodeURIComponent(eventId)}${source ? `&source=${encodeURIComponent(source)}` : ''}`

/** Jeux sur lesquels un QR peut etre redirige (module d'une animation). */
const MODULE_SUR = /^[a-z0-9]{2,24}$/

export interface EvenementCible { id: string; module?: string | null; cfg?: unknown }

/**
 * Adresse de jeu ACTUELLE d'une animation, pour une source (slug du QR).
 * Meme regle que les anciennes routes : un jeu « master » va sur /jouer (sauf
 * choix explicite de l'ancienne presentation, cfg.masterOff), les autres
 * (Quiz Master, Nuits du Sud) sur /parcours/<module>.
 * Chemin RELATIF : la redirection reste sur le domaine qui a recu le scan.
 */
export function cibleJeu(ev: EvenementCible, source?: string | null): string {
  const cfg = (ev.cfg && typeof ev.cfg === 'object' ? ev.cfg : {}) as Record<string, unknown>
  const mod = typeof ev.module === 'string' && MODULE_SUR.test(ev.module) ? ev.module : 'quiz'
  const q = 'ev=' + encodeURIComponent(ev.id) + (source ? '&source=' + encodeURIComponent(source) : '')
  if (cfg.masterOff !== true && estModuleMaster(mod)) return '/jouer?' + q
  return '/parcours/' + mod + '?' + q
}

/** Morceau de nom de fichier / d'affiche : sans accent ni espace. */
export function morceauFichier(s: string | null | undefined, max = 40): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, max)
}

/** Nom de fichier d'un support QR : animation, QR, support et code, lisibles et uniques.
 *  Ex. qr-boulangerie-dupont-vitrine-entree-vitrine-a1b2c3d4e5f6.png */
export function nomFichierQr(p: { titre: string; qr?: string | null; support?: string | null; code?: string | null }, ext: string): string {
  const morceaux = [morceauFichier(p.titre), morceauFichier(p.qr), morceauFichier(p.support), morceauFichier(p.code, 32)].filter(Boolean)
  const vus: string[] = []
  morceaux.forEach(m => { if (vus.indexOf(m) < 0) vus.push(m) })
  return 'qr-' + (vus.join('-') || 'qr') + '.' + ext
}
