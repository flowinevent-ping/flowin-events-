/**
 * MODE DEMO (maquette cliquable, 10/11/2026) — cote React.
 *
 * Le mecanisme vit dans public/flowin-demo.js, charge en premier par app/layout.tsx et par les
 * pages statiques : ?demo=1 l'active pour l'onglet (?demo=0 en sort), il court-circuite toute
 * requete d'ecriture (rien n'est enregistre), remplit les champs vides de valeurs « Démo » et
 * affiche le bandeau. Ici : les petites aides pour les composants qui doivent ne jamais bloquer.
 * Cote serveur : jamais de demo (estDemo() vaut false).
 */
interface FlowinDemo {
  actif: boolean
  proDemo: string
  fetch: typeof fetch
  remplir: (racine?: ParentNode) => number
  objets: (table?: string) => { table: string; methode: string; ligne: Record<string, unknown>; quand: string }[]
}

function global_(): FlowinDemo | null {
  if (typeof window === 'undefined') return null
  const d = (window as unknown as { __flowinDemo?: FlowinDemo }).__flowinDemo
  return d && d.actif ? d : null
}

/** Vrai quand la page est ouverte en mode demo. */
export function estDemo(): boolean {
  return !!global_()
}

/** En demo, une valeur vide devient la valeur Démo (jamais de vraie coordonnee). */
export function valeurDemo(v: string | null | undefined, defaut = 'Démo'): string {
  const s = v ?? ''
  return estDemo() && !s.trim() ? defaut : s
}

/** Fetch qui court-circuite les ecritures (null hors demo). */
export function fetchDemo(): typeof fetch | null {
  const d = global_()
  return d && typeof d.fetch === 'function' ? d.fetch : null
}

/** Objets « crees » pendant la session de demo (table Supabase), du plus ancien au plus recent. */
export function objetsDemo(table?: string) {
  const d = global_()
  return d ? d.objets(table) : []
}
