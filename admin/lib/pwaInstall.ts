/**
 * Raccourci « écran d'accueil » (PWA) : quand le proposer, quand le cacher.
 *
 * Probleme constate : l'entree « Installer le raccourci sur mon telephone »
 * s'affichait TOUT LE TEMPS, y compris dans l'application deja installee et
 * apres un refus. Aucune detection n'existait dans le code.
 *
 * Regles :
 *  1. Application deja installee -> on ne propose plus JAMAIS :
 *       - ouverte en mode application : display-mode standalone / fullscreen /
 *         minimal-ui (Android, bureau) ou navigator.standalone (iPhone) ;
 *       - evenement `appinstalled` (Android/Chrome) ;
 *       - ou le joueur a touche « C'est fait » (iPhone : aucun signal de Safari).
 *     Cette information est memorisee (localStorage) : elle survit au rechargement.
 *  2. Refus (« Plus tard ») -> on se tait 14 jours, puis 60 jours, puis 1 an
 *     (1er, 2e, 3e refus et suivants).
 *  3. Seuls les telephones sont concernes (iPhone / iPad / Android). Sur
 *     ordinateur, rien n'est propose. Dans un apercu (cadre, maquette), la
 *     proposition reste visible : c'est un ecran a montrer.
 *  4. Android : si le navigateur a fourni `beforeinstallprompt`, un bouton
 *     « Installer maintenant » lance l'installation native ; sinon on garde les
 *     etapes manuelles (menu Chrome). iPhone : etapes manuelles Safari.
 *
 * Aucun appel reseau, aucune donnee personnelle : uniquement 3 petites cles
 * locales, toutes en try/catch (stockage bloque = on propose, sans planter).
 */
export type Plateforme = 'ios' | 'android' | 'autre'

export const CLE_INSTALLEE = 'flowin_pwa_installee'
export const CLE_REFUS_N = 'flowin_pwa_refus_n'
export const CLE_REFUS_JUSQUA = 'flowin_pwa_refus_jusqua'
const JOURS_REFUS = [14, 60, 365]

function lire(cle: string): string | null { try { return window.localStorage.getItem(cle) } catch { return null } }
function ecrire(cle: string, v: string): void { try { window.localStorage.setItem(cle, v) } catch { /* stockage bloque */ } }

export function detecterPlateforme(ua: string, maxTouchPoints: number): Plateforme {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  /* iPadOS 13+ se presente comme un Mac : seul le tactile le distingue. */
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'autre'
}

/** Ouvert comme une application (et non dans un onglet de navigateur) ? */
export function estModeApplication(): boolean {
  try {
    const w = window as unknown as { matchMedia?: (q: string) => { matches: boolean }; navigator: { standalone?: boolean } }
    if (w.navigator && w.navigator.standalone === true) return true
    if (typeof w.matchMedia === 'function') {
      const modes = ['standalone', 'fullscreen', 'minimal-ui']
      for (let i = 0; i < modes.length; i++) if (w.matchMedia('(display-mode: ' + modes[i] + ')').matches) return true
    }
  } catch { /* ignore */ }
  return false
}

export function marquerInstallee(): void { ecrire(CLE_INSTALLEE, '1') }

/** Refus : repousse la prochaine proposition (14 j, puis 60 j, puis 1 an). */
export function refuserProposition(maintenant: number = Date.now()): void {
  const n = (parseInt(lire(CLE_REFUS_N) || '0', 10) || 0) + 1
  const jours = JOURS_REFUS[Math.min(n, JOURS_REFUS.length) - 1]
  ecrire(CLE_REFUS_N, String(n))
  ecrire(CLE_REFUS_JUSQUA, String(maintenant + jours * 86400000))
}

export function refusActif(maintenant: number = Date.now()): boolean {
  const j = parseInt(lire(CLE_REFUS_JUSQUA) || '0', 10) || 0
  return j > maintenant
}

export function dejaInstallee(): boolean {
  if (estModeApplication()) { marquerInstallee(); return true }
  return lire(CLE_INSTALLEE) === '1'
}

/** Faut-il montrer la proposition d'installation ? */
export function proposerInstallation(opts?: { apercu?: boolean }): boolean {
  if (opts && opts.apercu) return true
  if (typeof window === 'undefined') return false
  const p = detecterPlateforme(window.navigator.userAgent || '', window.navigator.maxTouchPoints || 0)
  if (p === 'autre') return false
  if (dejaInstallee()) return false
  if (refusActif()) return false
  return true
}

/* ── Installation native Android (beforeinstallprompt) ───────────────────
   L'evenement part tres tot (souvent avant l'hydratation de React) : on le
   capte des le chargement de ce module, pas dans un effet. */
interface EvenementInstall extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let differe: EvenementInstall | null = null
const abonnes: (() => void)[] = []
function prevenir() { abonnes.slice().forEach(f => { try { f() } catch { /* ignore */ } }) }
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => { e.preventDefault(); differe = e as EvenementInstall; prevenir() })
  window.addEventListener('appinstalled', () => { differe = null; marquerInstallee(); prevenir() })
}

/** Suit l'installation : `quandChange` est rappele a chaque evenement natif. Renvoie la fonction d'arret. */
export function ecouterInstallation(quandChange: () => void): () => void {
  abonnes.push(quandChange)
  return () => { const i = abonnes.indexOf(quandChange); if (i >= 0) abonnes.splice(i, 1) }
}

export function installationNativeDisponible(): boolean { return differe !== null }

export async function lancerInstallationNative(): Promise<'accepted' | 'dismissed' | 'indisponible'> {
  const e = differe
  if (!e) return 'indisponible'
  differe = null
  try {
    await e.prompt()
    const c = await e.userChoice
    if (c.outcome === 'accepted') marquerInstallee()
    return c.outcome
  } catch { return 'indisponible' }
}
