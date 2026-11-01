/**
 * COORDONNEES BANCAIRES DU PRO (RIB) — validation et affichage.
 *
 * A QUOI ELLES SERVENT : rembourser le pro (garantie « Flowin vous rembourse
 * la difference ») et lui faire des virements. JAMAIS pour prelever
 * l'abonnement : le mandat de prelevement est gere par GoCardless, Flowin ne
 * collecte pas d'IBAN pour cela.
 *
 * Stockage : table dediee `pros_rib` (sql/04-pros-rib.sql), RLS stricte (le pro
 * proprietaire et le SA). Jamais dans un jsonb public.
 */

export function compacterIban(v: string): string {
  return (v || '').replace(/[\s-]/g, '').toUpperCase()
}

/** Longueur officielle de l'IBAN des pays de la zone SEPA les plus courants (registre SWIFT). */
const LONGUEURS: Record<string, number> = {
  FR: 27, MC: 27, BE: 16, LU: 20, DE: 22, ES: 24, IT: 27, PT: 25, NL: 18, CH: 21, AT: 20, IE: 22, GB: 22,
  AD: 24, SM: 27, VA: 22, DK: 18, FI: 18, SE: 24, NO: 15, PL: 28, GR: 27, CZ: 24, SK: 24, SI: 19, HR: 21,
  EE: 20, LV: 21, LT: 20, HU: 28, RO: 24, BG: 22, CY: 28, MT: 31, IS: 26, LI: 21, GI: 23,
}

/** Controle modulo 97 (ISO 13616) : renvoie true si la cle de l'IBAN est juste. */
export function ibanMod97Ok(iban: string): boolean {
  const s = compacterIban(iban)
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false
  const r = s.slice(4) + s.slice(0, 4)
  let reste = 0
  for (let i = 0; i < r.length; i++) {
    const c = r.charCodeAt(i)
    const val = c >= 65 && c <= 90 ? String(c - 55) : r[i]
    for (let j = 0; j < val.length; j++) reste = (reste * 10 + Number(val[j])) % 97
  }
  return reste === 1
}

/** Message d'erreur clair, ou undefined si l'IBAN est valide. */
export function erreurIban(v: string): string | undefined {
  const s = compacterIban(v)
  if (!s) return 'Saisissez votre IBAN.'
  if (!/^[A-Z]{2}/.test(s)) return 'Un IBAN commence par le code pays (ex. FR76…).'
  const attendu = LONGUEURS[s.slice(0, 2)]
  if (attendu && s.length !== attendu) return `Un IBAN ${s.slice(0, 2)} compte ${attendu} caractères (vous en avez saisi ${s.length}).`
  if (!ibanMod97Ok(s)) return 'Cet IBAN ne semble pas valide (clé de contrôle). Vérifiez chaque caractère.'
  return undefined
}

/** BIC / SWIFT : 4 lettres banque, 2 lettres pays, 2 car. localisation, 3 car. agence facultatifs. */
export function erreurBic(v: string): string | undefined {
  const s = (v || '').replace(/\s/g, '').toUpperCase()
  if (!s) return 'Saisissez le BIC (8 ou 11 caractères).'
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s)) return 'Le BIC compte 8 ou 11 caractères (ex. BNPAFRPPXXX).'
  return undefined
}

/** Le BIC doit etre du meme pays que l'IBAN (5e et 6e lettres). */
export function bicCoherent(iban: string, bic: string): boolean {
  const i = compacterIban(iban), b = (bic || '').replace(/\s/g, '').toUpperCase()
  if (i.length < 2 || b.length < 6) return true
  const pi = i.slice(0, 2), pb = b.slice(4, 6)
  /* Monaco utilise des BIC francais et inversement : on ne bloque pas ce cas. */
  if ((pi === 'MC' && pb === 'FR') || (pi === 'FR' && pb === 'MC')) return true
  return pi === pb
}

/** Groupes de 4 pour la saisie : « FR76 3000 6000 01… ». */
export function formaterIban(v: string): string {
  return compacterIban(v).replace(/(.{4})/g, '$1 ').trim()
}

/** Affichage masque : « FR76 •••• •••• 345 » (pays + cle, puis les 3 derniers caracteres). */
export function masquerIban(v: string): string {
  const s = compacterIban(v)
  if (s.length < 8) return '••••'
  return `${s.slice(0, 4)} •••• •••• ${s.slice(-3)}`
}
