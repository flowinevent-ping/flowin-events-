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
// NON DÉPLOYÉE. Prérequis : sql/2026-11-10-tickets-animation.sql appliqué.
// Déploiement (une fois relu) : supabase functions deploy rappel-tickets --no-verify-jwt
// Appelée chaque jour par pg_cron (job « tickets-rappels », même SQL).
//
// Secrets (aucune valeur ici) : RESEND_API_KEY (déjà configuré), NOTIFY_FROM (optionnel),
// SITE_ORIGIN (optionnel). SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "Flowin <onboarding@resend.dev>";
const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") || "https://flowin-events.vercel.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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

  // 1. In-app d'abord.
  let inApp = 0;
  try { inApp = Number(await rpc("tickets_rappels_du_jour")) || 0; } catch (e) { return json({ ok: false, error: String(e) }, 500); }

  // 2. Relance e-mail (48 h, rappel non vu).
  let envoyes = 0;
  if (RESEND_API_KEY) {
    const relances = ((await rpc("tickets_relances_email")) || []) as Relance[];
    for (const r of relances) {
      const lien = `${SITE_ORIGIN}/nds/billets-partenaires.html?t=${encodeURIComponent(r.retrait_token)}`;
      const date = new Date(r.valable_jusqu_au + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const html = `<p>Bonjour ${esc(r.prenom || "")},</p>`
        + `<p>Ton lot « ${esc(r.lot_nom || "")} » expire le ${esc(date)}.</p>`
        + `<p><a href="${esc(lien)}">Voir mon billet</a></p>`
        + `<p>Tu ne peux pas y aller ? Offre-le à un ami depuis ton billet.</p>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: NOTIFY_FROM, to: [r.email], subject: "Ton lot expire bientôt", html }),
      });
      if (res.ok) { await rpc("marquer_relance_email", { p_tirage_id: r.tirage_id }); envoyes++; }
    }
  }
  return json({ ok: true, in_app: inApp, emails: envoyes });
});
