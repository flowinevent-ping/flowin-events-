/**
 * Retour apres connexion / creation de compte (03/11/2026) : le parcours « rejoindre un super event » envoie le visiteur
 * creer son compte ou se connecter, puis le ramene a sa demande. Seuls des chemins INTERNES du site sont acceptes
 * (jamais une adresse externe : pas de redirection ouverte).
 */
export function retourSur(v: string | null | undefined): string | null {
  const s = (v ?? '').trim()
  if (!s || s.length > 300) return null
  if (s.charAt(0) !== '/' || s.charAt(1) === '/' || s.indexOf('\\') >= 0 || /^\/[a-z]+:/i.test(s)) return null
  if (!(s === '/rejoindre' || s.indexOf('/rejoindre?') === 0 || s.indexOf('/rejoindre/') === 0 || s.indexOf('/pro/') === 0 || s === '/pro')) return null
  return s
}
