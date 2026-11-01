/**
 * Limitation de debit des scans de QR (anti-enumeration, anti-bot).
 *
 * Fenetre glissante en memoire, par adresse IP. Sur Vercel chaque instance serverless
 * a sa propre memoire : la limite est donc « au mieux » (elle freine un script qui
 * enchaine les essais sur une meme instance, pas un attaquant distribue). Le vrai
 * rempart est le code lui-meme : 12 caracteres aleatoires = 2^48 possibilites, soit des
 * millions d'annees a 60 essais par minute. Pour un plafond ferme, Vercel Firewall
 * (regle de debit sur /q/*) est la bonne couche ; voir le rapport d'audit.
 */
type Compteur = { n: number; debut: number }

export function creerLimiteur(max: number, fenetreMs: number) {
  const m = new Map<string, Compteur>()
  return {
    /** true = autorise. Compte l'essai. */
    essai(cle: string, maintenant: number = Date.now()): boolean {
      const c = m.get(cle)
      if (!c || maintenant - c.debut >= fenetreMs) {
        m.set(cle, { n: 1, debut: maintenant })
        /* menage : jamais plus de 5000 cles gardees */
        if (m.size > 5000) m.forEach((v, k) => { if (maintenant - v.debut >= fenetreMs) m.delete(k) })
        return true
      }
      c.n++
      return c.n <= max
    },
    /** Secondes avant la prochaine fenetre. */
    attente(cle: string, maintenant: number = Date.now()): number {
      const c = m.get(cle)
      return c ? Math.max(1, Math.ceil((c.debut + fenetreMs - maintenant) / 1000)) : 1
    },
  }
}

const lire = (v: string | undefined, defaut: number) => { const n = Number(v); return n > 0 && isFinite(n) ? Math.floor(n) : defaut }
/** 90 scans par minute et par IP (un magasin derriere une box : plusieurs joueurs). Reglable : FLOWIN_QR_LIMITE_SCANS. */
export const limiteScans = creerLimiteur(lire(process.env.FLOWIN_QR_LIMITE_SCANS, 90), 60_000)
/** 8 codes inconnus par 5 minutes et par IP : au-dela, c'est de l'enumeration. Reglable : FLOWIN_QR_LIMITE_INCONNUS. */
export const limiteInconnus = creerLimiteur(lire(process.env.FLOWIN_QR_LIMITE_INCONNUS, 8), 300_000)
