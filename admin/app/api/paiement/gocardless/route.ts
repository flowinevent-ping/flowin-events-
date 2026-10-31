import { NextRequest, NextResponse } from 'next/server'
import { calculerMontants, goCardless, goCardlessConfigure, lireCommande, majCommandes } from '@/lib/animationMagasin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Prelevement SEPA GoCardless pour le bon de commande Flowin Animation magasin
 * (admin/public/bon-commande-animation.html).
 *
 * GET  -> { disponible } : le bouton « Prelevement » s'affiche seulement si les variables
 *         GOCARDLESS_ACCESS_TOKEN, GOCARDLESS_WEBHOOK_SECRET et SUPABASE_SERVICE_ROLE_KEY
 *         existent sur Vercel. Sinon le front affiche « Bientot disponible » et propose le virement.
 * POST { commande_id } -> { url } : cree un « billing request » (mandat SEPA + paiement de la
 *         premiere annee) puis un « billing request flow », et renvoie l'URL de la page hebergee
 *         GoCardless. Le client y saisit son IBAN et signe le mandat : l'app ne voit JAMAIS l'IBAN.
 *
 * Le montant est recalcule ici a partir de la commande lue en base (cle service_role),
 * jamais a partir de ce que le navigateur envoie.
 */

export async function GET() {
  return NextResponse.json({ disponible: goCardlessConfigure(), env: process.env.GOCARDLESS_ENV === 'live' ? 'live' : 'sandbox' })
}

function decouperNom(nom: string): { given_name?: string; family_name?: string } {
  const p = (nom || '').trim().split(/\s+/)
  if (!p[0]) return {}
  if (p.length === 1) return { family_name: p[0] }
  return { given_name: p[0], family_name: p.slice(1).join(' ') }
}

export async function POST(req: NextRequest) {
  if (!goCardlessConfigure()) {
    return NextResponse.json(
      { ok: false, disponible: false, error: 'Prélèvement bientôt disponible. Merci de régler par virement.' },
      { status: 503 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête invalide.' }, { status: 400 })
  }
  const id = String(body?.commande_id ?? '').trim()
  if (!/^AM-\d{8}-[A-Z0-9]{8}$/.test(id)) {
    return NextResponse.json({ ok: false, error: 'Numéro de commande invalide.' }, { status: 400 })
  }

  try {
    const c = await lireCommande(id)
    if (!c) return NextResponse.json({ ok: false, error: 'Commande introuvable.' }, { status: 404 })
    if (c.mode_paiement !== 'prelevement_sepa') {
      return NextResponse.json({ ok: false, error: 'Cette commande est réglée par virement.' }, { status: 409 })
    }
    if (['mandat_actif', 'payee', 'annulee'].indexOf(c.statut) >= 0) {
      return NextResponse.json({ ok: false, error: 'Cette commande ne peut plus être modifiée.' }, { status: 409 })
    }

    const m = calculerMontants(c)
    const montantCents = c.prelevement_inclut_reste ? m.ttcCents : m.aboTtcCents
    const origine = (process.env.FLOWIN_BASE_URL || req.headers.get('origin') || `https://${req.headers.get('host')}`).replace(/\/+$/, '')
    const base = `${origine}/bon-commande-animation.html`
    const meta = { commande_id: id }

    // 1) Billing request : mandat SEPA + paiement de la premiere annee (idempotent par commande).
    //    Si le client revient (page quittee, nouvel essai), on reutilise la billing request existante :
    //    GoCardless accepte plusieurs flows pour une meme billing request.
    let brId: string | null = c.gc_billing_request_id
    if (!brId) {
      const br = await goCardless(
        '/billing_requests',
        {
          billing_requests: {
            mandate_request: { scheme: 'sepa_core', currency: 'EUR', metadata: meta },
            payment_request: {
              amount: montantCents,
              currency: 'EUR',
              description: (c.prelevement_inclut_reste
                ? `Flowin Animation - commande ${id}`
                : `Flowin Animation - abonnement annuel - ${id}`
              ).slice(0, 100),
              metadata: meta,
            },
            metadata: meta,
          },
        },
        `${id}-br-${montantCents}`
      )
      brId = br?.billing_requests?.id || null
      if (!brId) throw new Error('billing request sans identifiant')
    }

    // 2) Flow heberge : le client y saisit son IBAN et signe le mandat
    const flow = await goCardless('/billing_request_flows', {
      billing_request_flows: {
        redirect_uri: `${base}?retour=gocardless&commande=${encodeURIComponent(id)}`,
        exit_uri: `${base}?retour=gocardless-annule&commande=${encodeURIComponent(id)}`,
        language: 'fr',
        links: { billing_request: brId },
        prefilled_customer: {
          company_name: c.raison_sociale || undefined,
          email: c.email || undefined,
          ...decouperNom(c.contact_nom || ''),
          address_line1: c.adresse || undefined,
          postal_code: c.cp || undefined,
          city: c.ville || undefined,
          country_code: 'FR',
        },
      },
    })
    const url: string = flow?.billing_request_flows?.authorisation_url
    if (!url) throw new Error('flow sans URL')

    await majCommandes(
      { id: 'eq.' + id },
      { statut: 'mandat_en_cours', gc_billing_request_id: brId, montant_preleve_ttc: montantCents / 100, gc_dernier_evenement: 'billing_request_created' }
    )

    return NextResponse.json({ ok: true, url })
  } catch (e: any) {
    console.error('[gocardless] creation flow', id, e?.message, e?.gc ? JSON.stringify(e.gc) : '')
    return NextResponse.json(
      { ok: false, error: 'Le prélèvement est momentanément indisponible. Votre commande est enregistrée : vous pouvez régler par virement.' },
      { status: 502 }
    )
  }
}
