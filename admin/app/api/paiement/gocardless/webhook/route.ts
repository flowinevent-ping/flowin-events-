import { NextRequest, NextResponse } from 'next/server'
import { majCommandes, supabaseServeurConfigure, verifierSignatureGoCardless } from '@/lib/animationMagasin'

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
 *   billing_requests.fulfilled  -> enregistre mandat + paiement lies a la commande
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

async function traiter(ev: GcEvent): Promise<void> {
  const l = ev.links || {}
  const trace = { gc_dernier_evenement: `${ev.resource_type}.${ev.action}:${ev.id}`.slice(0, 200) }

  if (ev.resource_type === 'billing_requests' && ev.action === 'fulfilled' && l.billing_request) {
    const patch: Record<string, unknown> = { ...trace }
    if (l.mandate_request_mandate) patch.gc_mandate_id = l.mandate_request_mandate
    if (l.payment_request_payment) patch.gc_payment_id = l.payment_request_payment
    await majCommandes({ gc_billing_request_id: 'eq.' + l.billing_request }, patch)
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
