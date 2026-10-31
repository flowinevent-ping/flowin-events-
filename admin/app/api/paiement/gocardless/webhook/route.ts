import { NextRequest, NextResponse } from 'next/server'
import { PRIX_AM, goCardless, lireCommande, majCommandes, supabaseServeurConfigure, verifierSignatureGoCardless } from '@/lib/animationMagasin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Webhook GoCardless -> statut des commandes Flowin Animation magasin.
 *
 * URL a declarer dans GoCardless (Developers > Webhooks) :
 *   https://flowin-events.vercel.app/api/paiement/gocardless/webhook
 * Signature : en-tete « Webhook-Signature » = HMAC-SHA256 (hex) du corps brut avec
 * GOCARDLESS_WEBHOOK_SECRET. Signature invalide -> 498 (convention GoCardless).
 *
 * Evenements traites :
 *   billing_requests.fulfilled  -> enregistre mandat + paiement lies a la commande ; offre mensuelle :
 *                                  cree l'abonnement GoCardless mensuel (a partir du 2e mois)
 *   mandates.active             -> statut « mandat_actif »
 *   mandates.failed/cancelled/expired -> « mandat_echoue »
 *   payments.confirmed/paid_out -> « payee »
 *   payments.failed/cancelled/charged_back -> « paiement_echoue »
 * Une erreur base renvoie 500 : GoCardless renvoie alors l'evenement plus tard.
 */

type GcEvent = {
  id: string
  resource_type: string
  action: string
  links?: Record<string, string>
  details?: { cause?: string; description?: string }
}

/** Offre mensuelle : abonnement GoCardless de 110 € HT (prélevé TTC) par mois, à partir du mois suivant. */
async function abonnementMensuel(brId: string, mandat: string): Promise<void> {
  const c = await lireCommande(brId, 'gc_billing_request_id')
  if (!c || c.offre !== 'mensuelle') return
  const ht = Math.round(PRIX_AM.mensuelleHt * 100)
  const montant = ht + Math.round(ht * PRIX_AM.tva)
  const debut = new Date()
  debut.setUTCMonth(debut.getUTCMonth() + 1)
  const sub = await goCardless(
    '/subscriptions',
    {
      subscriptions: {
        amount: montant,
        currency: 'EUR',
        name: `Flowin Animation - offre mensuelle - ${c.id}`.slice(0, 100),
        interval_unit: 'monthly',
        start_date: debut.toISOString().slice(0, 10),
        metadata: { commande_id: c.id },
        links: { mandate: mandat },
      },
    },
    `${c.id}-sub`
  )
  const subId = sub?.subscriptions?.id
  if (subId) await majCommandes({ id: 'eq.' + c.id }, { gc_subscription_id: subId })
}

async function traiter(ev: GcEvent): Promise<void> {
  const l = ev.links || {}
  const trace = { gc_dernier_evenement: `${ev.resource_type}.${ev.action}:${ev.id}`.slice(0, 200) }

  if (ev.resource_type === 'billing_requests' && ev.action === 'fulfilled' && l.billing_request) {
    const patch: Record<string, unknown> = { ...trace }
    if (l.mandate_request_mandate) patch.gc_mandate_id = l.mandate_request_mandate
    if (l.payment_request_payment) patch.gc_payment_id = l.payment_request_payment
    await majCommandes({ gc_billing_request_id: 'eq.' + l.billing_request }, patch)
    if (l.mandate_request_mandate) await abonnementMensuel(l.billing_request, l.mandate_request_mandate)
    return
  }

  if (ev.resource_type === 'mandates' && l.mandate) {
    if (ev.action === 'active') {
      await majCommandes({ gc_mandate_id: 'eq.' + l.mandate, statut: 'not.in.(payee,annulee)' }, { ...trace, statut: 'mandat_actif' })
    } else if (['failed', 'cancelled', 'expired'].indexOf(ev.action) >= 0) {
      await majCommandes({ gc_mandate_id: 'eq.' + l.mandate, statut: 'not.in.(payee,annulee)' }, { ...trace, statut: 'mandat_echoue' })
    } else {
      await majCommandes({ gc_mandate_id: 'eq.' + l.mandate }, trace)
    }
    return
  }

  if (ev.resource_type === 'payments' && l.payment) {
    if (ev.action === 'confirmed' || ev.action === 'paid_out') {
      await majCommandes({ gc_payment_id: 'eq.' + l.payment, statut: 'neq.annulee' }, { ...trace, statut: 'payee' })
    } else if (['failed', 'cancelled', 'charged_back', 'late_failure_settled'].indexOf(ev.action) >= 0) {
      await majCommandes({ gc_payment_id: 'eq.' + l.payment, statut: 'neq.annulee' }, { ...trace, statut: 'paiement_echoue' })
    } else {
      await majCommandes({ gc_payment_id: 'eq.' + l.payment }, trace)
    }
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.GOCARDLESS_WEBHOOK_SECRET || ''
  const corps = await req.text()
  if (!secret) return NextResponse.json({ ok: false, error: 'webhook non configuré' }, { status: 503 })
  if (!verifierSignatureGoCardless(corps, req.headers.get('webhook-signature'), secret)) {
    return NextResponse.json({ ok: false, error: 'signature invalide' }, { status: 498 })
  }

  let events: GcEvent[] = []
  try {
    events = (JSON.parse(corps)?.events ?? []) as GcEvent[]
  } catch {
    return NextResponse.json({ ok: false, error: 'json invalide' }, { status: 400 })
  }
  if (!supabaseServeurConfigure()) {
    return NextResponse.json({ ok: false, error: 'base non configurée' }, { status: 500 })
  }

  try {
    for (const ev of events) await traiter(ev)
  } catch (e: any) {
    console.error('[gocardless] webhook', e?.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true, traites: events.length })
}
