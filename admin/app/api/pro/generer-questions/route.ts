import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Generation de questions assistee par IA -- utilisee par BanqueEditor.tsx (banque de questions,
 * quiz ET bonus) et par l'etape 2 du wizard "Creer mon animation".
 *
 * Necessite la variable d'environnement ANTHROPIC_API_KEY sur Vercel (Project Settings >
 * Environment Variables). JAMAIS de cle en dur ici. Si absente : reponse 503 explicite,
 * jamais un crash silencieux -- le front affiche le message tel quel.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Génération IA non configurée côté serveur (variable ANTHROPIC_API_KEY absente sur Vercel).' },
      { status: 503 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête invalide.' }, { status: 400 })
  }

  const theme = String(body?.theme ?? '').trim().slice(0, 300)
  const nombre = Math.min(Math.max(Number(body?.nombre) || 4, 1), 12)
  const bonus = !!body?.bonus
  if (!theme) {
    return NextResponse.json({ ok: false, error: 'Merci de préciser un thème.' }, { status: 400 })
  }

  const consigne = bonus
    ? `Genere ${nombre} questions de type sondage (aucune bonne reponse -- choix unique ou multiple) sur le theme suivant, pour un jeu d'animation commerciale en France : "${theme}". Reponds UNIQUEMENT avec un JSON valide, un tableau d'objets de la forme {"label": string, "type": "single"|"multi", "options": string[]} (2 a 5 options par question, francais naturel, pas de numerotation). Aucun texte avant ou apres le JSON.`
    : `Genere ${nombre} questions de quiz (QCM avec une seule bonne reponse) sur le theme suivant, pour un jeu d'animation commerciale en France : "${theme}". Reponds UNIQUEMENT avec un JSON valide, un tableau d'objets de la forme {"texte": string, "options": string[], "bonne": number} (bonne = index de la bonne reponse dans options, 3 a 4 options par question, francais naturel). Aucun texte avant ou apres le JSON.`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2500,
        messages: [{ role: 'user', content: consigne }],
      }),
    })
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: `Échec de la génération IA (code ${r.status}).` }, { status: 502 })
    }
    const data = await r.json()
    const texte = (data.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
    const propre = texte.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(propre)
    if (!Array.isArray(parsed)) throw new Error('format inattendu')
    return NextResponse.json({ ok: true, questions: parsed })
  } catch {
    return NextResponse.json({ ok: false, error: 'Échec de génération ou de lecture de la réponse IA.' }, { status: 500 })
  }
}
