// supabase/functions/notify-bon-commande/index.ts
//
// Email a flowinevent@gmail.com des qu'un partenaire signe un bon de commande
// (insert dans la table bons_commande depuis bon-commande-nds.html).
// Le mail contient un LIEN DIRECT vers le doc rempli+signe : ?id=<id>.
//
// Declenchement : trigger SQL trg_notify_bon_commande (net.http_post) sur INSERT bons_commande.
// Secret projet partage : RESEND_API_KEY (deja configure).

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "flowinevent@gmail.com";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "NDS x Flowin <onboarding@resend.dev>";
const DOC_BASE = Deno.env.get("BON_COMMANDE_URL") || "https://flowin-events.vercel.app/bon-commande-nds.html";

function esc(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function eur(v: unknown): string {
  const n = Number(v);
  if (!isFinite(n) || n === 0) return "—";
  return n.toLocaleString("fr-FR") + " €";
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const r = (payload.record ?? payload) as Record<string, unknown>;
  if (!r || !r.id) {
    return new Response(JSON.stringify({ error: "no record" }), { status: 422, headers: { "Content-Type": "application/json" } });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ skipped: true, reason: "RESEND_API_KEY absent" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const link = DOC_BASE + "?id=" + encodeURIComponent(String(r.id));
  const rows: Array<[string, string]> = [
    ["Etablissement", esc(r.raison_sociale)],
    ["Offre signee", esc(r.offre_label ?? r.offre)],
    ["Montant TTC", esc(eur(r.montant_ttc))],
    ["Contact", esc(r.contact)],
    ["Email", esc(r.email)],
    ["Telephone", esc(r.tel)],
    ["SIRET", esc(r.siret)],
    ["Signataire", esc(r.signataire)],
    ["Date", esc(r.date_signature)],
  ];
  let trs = "";
  for (let i = 0; i < rows.length; i++) {
    trs += '<tr><td style="padding:8px 14px;color:#7a708a;font-size:13px;white-space:nowrap">' + rows[i][0] +
      '</td><td style="padding:8px 14px;color:#1a1226;font-size:14px;font-weight:600">' + rows[i][1] + "</td></tr>";
  }
  const html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto">' +
    '<div style="background:#16203A;border-radius:14px 14px 0 0;padding:18px 20px;color:#fff;font-size:17px;font-weight:800">Bon de commande signe — Nuits du Sud 2026</div>' +
    '<table style="width:100%;border-collapse:collapse;background:#f7f8fc;border:1px solid #e7e9f2;border-top:none">' + trs + "</table>" +
    '<div style="padding:18px 4px"><a href="' + link + '" style="display:inline-block;background:#3B5CC4;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;font-size:14px">Ouvrir le bon de commande signe</a></div>' +
    '<div style="color:#8A90A8;font-size:12px;padding:6px 4px 18px">Document rempli et signe par le partenaire. En attente de reglement (virement).</div>' +
    "</div>";
  const text = "Bon de commande signe NDS 2026\n\n" +
    rows.map((x) => x[0] + " : " + x[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")).join("\n") +
    "\n\nLien : " + link;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: NOTIFY_FROM, to: [NOTIFY_TO],
      reply_to: (r.email ?? undefined) as string | undefined,
      subject: "✍️ Bon de commande signe — " + (r.raison_sociale ?? "Partenaire") + " (" + (r.offre_label ?? r.offre ?? "") + ")",
      html, text,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "resend failed", status: res.status, body }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true, resend: body }), { status: 200, headers: { "Content-Type": "application/json" } });
});
