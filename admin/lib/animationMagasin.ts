/**
 * Flowin Animation magasin -- tarifs et acces serveur aux commandes.
 *
 * Utilise UNIQUEMENT par les routes serveur admin/app/api/paiement/gocardless/*.
 * Les memes prix sont recopies (volontairement) dans :
 *   - admin/public/plaquette-animation-magasin.html (simulateur)
 *   - admin/public/bon-commande-animation.html (bon de commande)
 *   - sql/2026-11-01-commandes-animation.sql (recalcul en base, source de verite)
 * Toute modification de prix doit etre faite aux quatre endroits.
 *
 * Aucun secret ici : la cle service_role est lue dans process.env (Vercel).
 */

import { createHmac, timingSafeEqual } from 'crypto'

export const PRIX_AM = {
  abonnementHt: 990,
  kitPhysiqueHt: 149, // par boutique
  optQuizHt: 180, // par evenement
  optBonusHt: 180, // par sondage
  tva: 0.2,
} as const

export type CommandeAnimation = {
  id: string
  statut: string
  raison_sociale: string
  siret: string | null
  adresse: string | null
  cp: string | null
  ville: string | null
  contact_nom: string | null
  email: string | null
  tel: string | null
  nb_boutiques: number
  kit: 'digital' | 'physique'
  opt_quiz_qte: number
  opt_bonus_qte: number
  mode_paiement: 'virement' | 'prelevement_sepa'
  prelevement_inclut_reste: boolean
  gc_billing_request_id: string | null
}

const cents = (eur: number) => Math.round(eur * 100)

/** Recalcule les montants a partir des choix (on ne fait jamais confiance aux montants envoyes). */
export function calculerMontants(c: Pick<CommandeAnimation, 'nb_boutiques' | 'kit' | 'opt_quiz_qte' | 'opt_bonus_qte'>) {
  const nb = Math.max(1, Math.min(200, Math.floor(Number(c.nb_boutiques) || 1)))
  const quiz = Math.max(0, Math.min(20, Math.floor(Number(c.opt_quiz_qte) || 0)))
  const bonus = Math.max(0, Math.min(20, Math.floor(Number(c.opt_bonus_qte) || 0)))
  const kitHt = c.kit === 'physique' ? PRIX_AM.kitPhysiqueHt * nb : 0
  const optHt = PRIX_AM.optQuizHt * quiz + PRIX_AM.optBonusHt * bonus
  const ht = PRIX_AM.abonnementHt + kitHt + optHt
  const ttcCents = cents(ht) + Math.round(cents(ht) * PRIX_AM.tva)
  const aboTtcCents = cents(PRIX_AM.abonnementHt) + Math.round(cents(PRIX_AM.abonnementHt) * PRIX_AM.tva)
  return { nb, quiz, bonus, kitHt, optHt, ht, ttcCents, aboTtcCents, resteTtcCents: ttcCents - aboTtcCents }
}

/* ---------- Supabase (PostgREST) cote serveur, cle service_role ---------- */

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ywcqtupgoxfzkddqkztk.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { url, key }
}

export function supabaseServeurConfigure(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

function entetes(key: string, extra?: Record<string, string>): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(extra || {}) }
}

const COLONNES =
  'id,statut,raison_sociale,siret,adresse,cp,ville,contact_nom,email,tel,nb_boutiques,kit,opt_quiz_qte,opt_bonus_qte,mode_paiement,prelevement_inclut_reste,gc_billing_request_id'

export async function lireCommande(id: string): Promise<CommandeAnimation | null> {
  const { url, key } = supa()
  const r = await fetch(`${url}/rest/v1/commandes_animation?id=eq.${encodeURIComponent(id)}&select=${COLONNES}`, {
    headers: entetes(key),
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`lecture commande ${r.status}`)
  const rows = (await r.json()) as CommandeAnimation[]
  return rows && rows[0] ? rows[0] : null
}

/** PATCH filtre, valeurs au format PostgREST (ex. { gc_mandate_id: 'eq.MD123', statut: 'not.in.(payee,annulee)' }).
 *  Renvoie le nombre de lignes modifiees. */
export async function majCommandes(filtre: Record<string, string>, patch: Record<string, unknown>): Promise<number> {
  const { url, key } = supa()
  const q = Object.keys(filtre)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(filtre[k]).replace(/%2C/g, ',').replace(/%28/g, '(').replace(/%29/g, ')')}`)
    .join('&')
  const r = await fetch(`${url}/rest/v1/commandes_animation?${q}`, {
    method: 'PATCH',
    headers: entetes(key, { Prefer: 'return=representation' }),
    body: JSON.stringify({ ...patch, paiement_maj_at: new Date().toISOString() }),
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`maj commande ${r.status}`)
  const rows = (await r.json()) as unknown[]
  return Array.isArray(rows) ? rows.length : 0
}

/* ---------- GoCardless (API REST) ---------- */

/** Signature webhook : HMAC-SHA256 (hex) du corps brut avec le secret du endpoint. */
export function verifierSignatureGoCardless(corps: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const attendu = createHmac('sha256', secret).update(corps, 'utf8').digest('hex')
  const a = Buffer.from(attendu, 'utf8')
  const b = Buffer.from(signature.trim(), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function goCardlessConfigure(): boolean {
  return !!(process.env.GOCARDLESS_ACCESS_TOKEN && process.env.GOCARDLESS_WEBHOOK_SECRET && supabaseServeurConfigure())
}

export function goCardlessBase(): string {
  return process.env.GOCARDLESS_ENV === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com'
}

export async function goCardless(path: string, body: unknown, idempotencyKey?: string) {
  const h: Record<string, string> = {
    Authorization: `Bearer ${process.env.GOCARDLESS_ACCESS_TOKEN}`,
    'GoCardless-Version': '2015-07-06',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey
  const r = await fetch(goCardlessBase() + path, { method: 'POST', headers: h, body: JSON.stringify(body), cache: 'no-store' })
  const json = (await r.json().catch(() => ({}))) as any
  if (!r.ok) {
    const msg = json?.error?.message || `GoCardless ${r.status}`
    const err = new Error(msg) as Error & { status?: number; gc?: unknown }
    err.status = r.status
    err.gc = json?.error
    throw err
  }
  return json
}
