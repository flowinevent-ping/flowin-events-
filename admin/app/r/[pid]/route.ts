import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Redirection trackée des liens partenaires.
// Format : /r/<partenaire_id>?k=<lien_key>
// L'URL cible est résolue CÔTÉ SERVEUR depuis partenaires.liens (jamais depuis
// la query string) -> aucun open-redirect possible. Chaque clic résolu est
// enregistré dans partenaire_clics (best-effort, ne bloque jamais la redirection).

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Lien = { key?: string; label?: string; url?: string }

export async function GET(
  req: NextRequest,
  { params }: { params: { pid: string } }
) {
  const pid = params?.pid || ''
  const key = req.nextUrl.searchParams.get('k') || ''
  const fallback = new URL('/', req.url)

  if (!pid || !key) return NextResponse.redirect(fallback, 302)

  let url: string | null = null
  let eventId: string | null = null

  try {
    const { data } = await supabase
      .from('partenaires')
      .select('event_id, liens')
      .eq('id', pid)
      .maybeSingle()

    if (data) {
      eventId = (data as { event_id?: string | null }).event_id ?? null
      const raw = (data as { liens?: unknown }).liens
      const liens: Lien[] = Array.isArray(raw) ? (raw as Lien[]) : []
      for (let i = 0; i < liens.length; i++) {
        const l = liens[i]
        if (l && l.key === key && typeof l.url === 'string' && l.url) {
          url = l.url
          break
        }
      }
    }
  } catch {
    /* résolution impossible -> fallback */
  }

  // Sécurité : seules les URL http(s) absolues stockées par le partenaire
  // sont suivies. Tout le reste (relatif, javascript:, data:, etc.) -> fallback.
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.redirect(fallback, 302)
  }

  // Enregistrement du clic : best-effort, n'empêche jamais la redirection.
  try {
    await supabase.from('partenaire_clics').insert({
      partenaire_id: pid,
      event_id: eventId,
      lien_key: key,
      url,
    })
  } catch {
    /* best-effort */
  }

  return NextResponse.redirect(url, 302)
}
