// supabase/functions/rappel-tickets/index.ts
//
// RAPPELS DES TICKETS GAGNANTS (1 mois / 15 jours / 48 h avant expiration) — 10/11/2026.
// Règle Romain : tout passe par l'application ; l'e-mail sert UNIQUEMENT de relance.
//
//   1. Rappels DANS L'APPLICATION : rpc tickets_rappels_du_jour() (notifications
//      joueur_notifications, affichées dans /moi). Toujours en premier.
//   2. Relance e-mail : seulement les billets à 48 h dont le rappel in-app n'a pas été vu,
//      jamais relancés (rpc tickets_relances_email), puis marquer_relance_email.
//
// Déployée (verify_jwt false) ; version Gmail (_shared/mailer.ts) déployée le 20/11/2026. Prérequis : sql/2026-11-10-tickets-animation.sql appliqué.
// Déploiement (une fois relu) : supabase functions deploy rappel-tickets --no-verify-jwt
// Appelée chaque jour par pg_cron (job « tickets-rappels », même SQL).
//
// Secrets (aucune valeur ici) : RAPPEL_CRON_SECRET (obligatoire, mode normal), GMAIL_USER + GMAIL_APP_PASSWORD (prioritaires, _shared/mailer.ts) ou RESEND_API_KEY, NOTIFY_FROM (optionnel),
// SITE_ORIGIN (optionnel). SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.

import { canal, envoyerEmail } from "../_shared/mailer.ts";

// Envoi test (20/11/2026) : POST {"test_email":true} + en-tête x-flowin-test dont le SHA-256 vaut TEST_HASH.
// Destinataire FIXE = GMAIL_USER (la boîte Flowin elle-même), message fixe, aucune RPC, aucune donnée client,
// le lot de relances n'est PAS lancé. Jeton à usage ponctuel (non stocké) : seule son empreinte est ici.
const TEST_HASH = "86a6e161155c2a26c6de04e563a72d4373b5f0751c0e626a3695fddc94cc165c";
async function sha256(t: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));
  return Array.from(h).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") || "https://flowin-events.vercel.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Lot de relances (mode normal) : exige l'en-tête x-flowin-cron égal au secret RAPPEL_CRON_SECRET (21/11/2026).
// Comparaison à temps constant (empreintes SHA-256 comparées octet par octet). Secret absent : refus (fail-closed).
const CRON_SECRET = Deno.env.get("RAPPEL_CRON_SECRET") || "";
async function cronAutorise(req: Request): Promise<boolean> {
  const recu = req.headers.get("x-flowin-cron") || "";
  if (!CRON_SECRET || !recu) return false;
  const enc = new TextEncoder();
  const a = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(recu)));
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(CRON_SECRET)));
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function rpc(nom: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nom}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${nom} : ${r.status}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
function json(b: unknown, status = 200): Response {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}

interface Relance { tirage_id: number; email: string; prenom: string | null; lot_nom: string | null; retrait_token: string; valable_jusqu_au: string }

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "configuration" }, 500);

  // Envoi test : traité AVANT tout, ne touche ni aux rappels ni aux relances.
  const corps = await req.json().catch(() => ({})) as { test_email?: boolean };
  if (corps && corps.test_email === true) {
    const jeton = req.headers.get("x-flowin-test") || "";
    if (!jeton || (await sha256(jeton)) !== TEST_HASH) return json({ ok: false, error: "interdit" }, 403);
    const moi = Deno.env.get("GMAIL_USER") || "";
    if (canal() !== "gmail" || !moi) return json({ ok: false, error: "canal gmail absent", canal: canal() }, 409);
    const res = await envoyerEmail({ to: [moi], subject: "Flowin : test d'envoi Gmail",
      html: "<p>Test d'envoi depuis la fonction rappel-tickets (Gmail SMTP). Aucune action requise.</p>" });
    return json({ ok: res.ok, test: true, via: res.via, skipped: !!res.skipped, error: res.error ? "voir journaux" : undefined });
  }

  // Mode normal : réservé au cron (en-tête secret). Sans lui, rien n'est lancé.
  if (!(await cronAutorise(req))) { console.warn("rappel-tickets : appel refuse (en-tete x-flowin-cron absent ou invalide)"); return json({ ok: false, error: "interdit" }, 403); }

  // 1. In-app d'abord.
  let inApp = 0;
  try { inApp = Number(await rpc("tickets_rappels_du_jour")) || 0; } catch (e) { return json({ ok: false, error: String(e) }, 500); }

  // 2. Relance e-mail (48 h, rappel non vu).
  let envoyes = 0;
  if (canal() !== "aucun") {
    const relances = ((await rpc("tickets_relances_email")) || []) as Relance[];
    for (const r of relances) {
      const lien = `${SITE_ORIGIN}/nds/billets-partenaires.html?t=${encodeURIComponent(r.retrait_token)}`;
      const date = new Date(r.valable_jusqu_au + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const html = `<p>Bonjour ${esc(r.prenom || "")},</p>`
        + `<p>Ton lot « ${esc(r.lot_nom || "")} » expire le ${esc(date)}.</p>`
        + `<p><a href="${esc(lien)}">Voir mon billet</a></p>`
        + `<p>Tu ne peux pas y aller ? Offre-le à un ami depuis ton billet.</p>`;
      const res = await envoyerEmail({ to: [r.email], subject: "Ton lot expire bientôt", html });
      if (res.ok) { await rpc("marquer_relance_email", { p_tirage_id: r.tirage_id }); envoyes++; }
      else if (res.skipped) break; // plafond du jour : on reprend demain (non marqué)
    }
  }
  return json({ ok: true, in_app: inApp, emails: envoyes });
});
