import { NextRequest, NextResponse } from 'next/server'
import { chiffres, natureRecherche, versEntreprise, type ResultatApi } from '@/lib/entreprise'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * RECHERCHE D'ENTREPRISE (SIRET, SIREN ou nom) pour le parcours « Ma premiere fois ».
 *
 * Interroge cote serveur l'API publique gratuite et sans cle « Recherche
 * d'entreprises » (https://recherche-entreprises.api.gouv.fr, donnees INSEE /
 * RNE) : pas d'appel direct depuis le navigateur, pas de dependance au CORS.
 *
 * MODE DEGRADE : si l'API ne repond pas (reseau, quota 7 req/s, panne), la
 * route repond { ok: false, indisponible: true } et l'ecran propose la saisie
 * manuelle. Aucune donnee n'est jamais inventee : ce qui n'est pas dans la
 * reponse reste vide.
 */
const API = 'https://recherche-entreprises.api.gouv.fr/search'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 120)
  const nature = natureRecherche(q)
  if (nature === 'invalide') {
    return NextResponse.json({ ok: false, erreur: 'Saisissez un SIRET (14 chiffres), un SIREN (9 chiffres) ou au moins 3 lettres du nom.' }, { status: 400 })
  }
  const terme = nature === 'nom' ? q : chiffres(q)
  const url = `${API}?q=${encodeURIComponent(terme)}&per_page=${nature === 'nom' ? 6 : 1}&page=1`

  const ctrl = new AbortController()
  const minuteur = setTimeout(() => ctrl.abort(), 8000)
  try {
    const rep = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal, cache: 'no-store' })
    if (!rep.ok) {
      return NextResponse.json({ ok: false, indisponible: true, erreur: `Service public indisponible (code ${rep.status}).` }, { status: 200 })
    }
    const json = (await rep.json()) as { results?: ResultatApi[] }
    const resultats = (json.results ?? []).map(r => versEntreprise(r, nature === 'siret' ? terme : undefined))
    return NextResponse.json({ ok: true, nature, resultats })
  } catch (e) {
    const raison = e instanceof Error && e.name === 'AbortError' ? 'Le service public met trop de temps à répondre.' : 'Le service public ne répond pas.'
    return NextResponse.json({ ok: false, indisponible: true, erreur: raison }, { status: 200 })
  } finally {
    clearTimeout(minuteur)
  }
}
