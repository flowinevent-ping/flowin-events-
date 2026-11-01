/**
 * Canal d'origine (?src=) des liens commerciaux.
 *
 * Un lien commercial peut porter `?src=<canal>` (whatsapp, email, qr-affiche, video-commerce…).
 * Le canal est retenu à la PREMIÈRE visite (localStorage, jamais écrasé) puis écrit dans la
 * fiche pro à l'inscription : tag `src:<canal>` de `pros.tags` (colonne existante, aucun SQL).
 * Ne pas confondre avec `?source=` (stations de jeu des QR traces, lib/qrTraces.ts).
 */

export const CLE_SRC = 'flowin_src'

export const CANAUX: { v: string; label: string }[] = [
  { v: 'direct', label: 'Lien direct (sans canal)' },
  { v: 'whatsapp', label: 'WhatsApp' },
  { v: 'email', label: 'Email' },
  { v: 'qr-affiche', label: 'QR sur affiche / vitrine' },
  { v: 'video-commerce', label: 'Vidéo commerces' },
  { v: 'video-partenaire-se', label: 'Vidéo partenaires / super-event' },
  { v: 'video-organisateur', label: 'Vidéo organisateurs' },
  { v: 'salon', label: 'Salon / rencontre' },
  { v: 'reseaux', label: 'Réseaux sociaux' },
]

/** Nettoie un canal : minuscules, a-z 0-9 _ -, 40 caractères max. Vide si invalide. */
export function nettoyerSrc(v: string | null | undefined): string {
  const s = (v ?? '').toLowerCase().trim()
  return /^[a-z0-9_-]{1,40}$/.test(s) ? s : ''
}

/** Ajoute `?src=` (ou `&src=`) à un lien ; `direct` / vide = lien inchangé. */
export function avecSource(url: string, canal: string): string {
  const c = nettoyerSrc(canal)
  if (!c || c === 'direct') return url
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'src=' + c
}

/** À appeler au chargement d'une page d'arrivée : retient le canal de la 1re visite et le renvoie. */
export function capturerSource(): string {
  if (typeof window === 'undefined') return ''
  let v = ''
  try { v = nettoyerSrc(new URLSearchParams(window.location.search).get('src')) } catch { /* ignore */ }
  try {
    const deja = window.localStorage.getItem(CLE_SRC) ?? ''
    if (v && !deja) window.localStorage.setItem(CLE_SRC, v)
    return deja || v
  } catch { return v }
}

/** Tag à ajouter à `pros.tags` (ou null quand aucun canal). */
export function tagSource(canal: string): string | null {
  const c = nettoyerSrc(canal)
  return c ? `src:${c}` : null
}
