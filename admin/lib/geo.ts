/**
 * Ville a partir d un code postal -- API officielle du gouvernement francais
 * (geo.api.gouv.fr, donnee INSEE), jamais une ville inventee (regle CLAUDE.md :
 * aucune donnee fabriquee). Un code postal peut couvrir plusieurs communes :
 * on retient la premiere renvoyee (la plus peuplee en general). Lecture seule
 * -- n ecrit jamais dans la base, seulement un repli d affichage la ou une
 * ville est vide (Romain, 18/09 : "on ne peut pas rester avec une case vide").
 * Cache 24h (le decoupage communal ne change pas d une requete a l autre).
 */
export async function communeParCodePostal(codePostal: string | null | undefined): Promise<string | null> {
  const cp = (codePostal ?? '').trim()
  if (!/^\d{5}$/.test(cp)) return null
  try {
    const r = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom&format=json`, { next: { revalidate: 86400 } })
    if (!r.ok) return null
    const data = (await r.json()) as { nom?: string }[]
    return data[0]?.nom?.trim() || null
  } catch {
    return null
  }
}
