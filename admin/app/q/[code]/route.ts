import { NextRequest, NextResponse } from 'next/server'
import { supabaseVivant } from '@/lib/supabase'
import { cibleJeu, estCodeValide } from '@/lib/qrPermalien'
import { limiteScans, limiteInconnus } from '@/lib/limiteDebit'

/**
 * /q/<code> — RESOLUTION DES QR PERMANENTS (audit QR du 01/11).
 *
 * Le QR imprime ne contient que ce lien. Ici, COTE SERVEUR :
 *   code court -> station (qr_stations) -> animation (events) -> jeu ACTUEL -> 302.
 * Changer de jeu, de quiz, de lots ou de dates ne touche donc jamais au QR.
 *
 *  - Redirection 302 (temporaire), JAMAIS 301 : un navigateur ou un relais qui
 *    memoriserait la cible empecherait de la changer. En-tete no-store en plus.
 *  - L'adresse cible est CONSTRUITE ici (chemin relatif, parametres encodes) :
 *    rien de ce qui est dans l'URL du scan n'est recopie dans la redirection
 *    (pas d'open-redirect) ; seul le code sert, et il est valide par expression
 *    reguliere avant tout acces a la base.
 *  - Code inconnu / mal forme / QR masque : page claire, aucun jeu, aucune ecriture.
 *  - Animation terminee, pas commencee, brouillon : la page de jeu cible affiche son
 *    message habituel (lib/etatAnimation) -- meme comportement que les anciens QR.
 *  - Limitation de debit par IP (lib/limiteDebit) contre l'enumeration.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ENTETES = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

function ip(req: NextRequest): string {
  const f = req.headers.get('x-forwarded-for')
  return (f ? f.split(',')[0] : req.headers.get('x-real-ip') || 'inconnue').trim()
}

/** 302 avec adresse RELATIVE : le joueur reste sur le domaine qu'il a scanne (jamais d'hote reconstruit
 *  a partir d'en-tetes), et la cible est toujours un chemin de CE site. */
function aller(_req: NextRequest, chemin: string): NextResponse {
  return new NextResponse(null, { status: 302, headers: { ...ENTETES, Location: chemin } })
}

function trop(secondes: number): NextResponse {
  return new NextResponse('Trop de scans en peu de temps. Réessayez dans quelques instants.', {
    status: 429,
    headers: { ...ENTETES, 'Retry-After': String(secondes), 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const client = ip(req)
  if (!limiteScans.essai(client)) return trop(limiteScans.attente(client))

  const code = String(params?.code || '').trim().toLowerCase()
  const inconnu = () => {
    if (!limiteInconnus.essai(client)) return trop(limiteInconnus.attente(client))
    return aller(req, '/q/indisponible?m=inconnu')
  }
  if (!estCodeValide(code)) return inconnu()

  let st: { event_id: string; source_qr: string; publie: boolean | null } | null = null
  try {
    const { data, error } = await supabaseVivant.from('qr_stations').select('event_id,source_qr,publie').eq('code_court', code).maybeSingle()
    if (!error) st = data as typeof st
  } catch { /* lecture impossible : traite comme inconnu */ }
  if (!st) return inconnu()
  if (st.publie === false) return aller(req, '/q/indisponible?m=desactive')

  let ev: { id: string; module: string | null; cfg: unknown } | null = null
  try {
    const { data } = await supabaseVivant.from('events').select('id,module,cfg').eq('id', st.event_id).maybeSingle()
    ev = data as typeof ev
  } catch { /* idem */ }
  if (!ev) return inconnu()

  return aller(req, cibleJeu(ev, st.source_qr))
}
