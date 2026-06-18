// supabase/functions/notify-souscription/index.ts
//
// Notifie flowinevent@gmail.com a chaque nouvelle souscription partenaire NDS 2026.
//
// DECLENCHEMENT (au choix, recommande : Database Webhook) :
//   Supabase Dashboard > Database > Webhooks > Create
//     - Table : partenaires
//     - Events : INSERT
//     - Type : Supabase Edge Functions > notify-souscription
//   => recoit le payload standard { type, table, record, old_record }
//
// Peut aussi etre appelee en POST direct avec { record: {...} } ou directement {...}.
//
// SECRETS REQUIS (Dashboard > Edge Functions > notify-souscription > Secrets,
// ou `supabase secrets set ...`) :
//   RESEND_API_KEY   (obligatoire) cle API Resend
//   NOTIFY_TO        (optionnel) destinataire, defaut flowinevent@gmail.com
//   NOTIFY_FROM      (optionnel) expediteur verifie Resend, defaut onboarding@resend.dev
//   DASHBOARD_URL    (optionnel) lien dashboard, defaut https://flowin-events.vercel.app/dashboard.html
//   PROFORMA_URL     (optionnel) lien proforma / bon de commande si dispo
//
// Sans RESEND_API_KEY la fonction renvoie 200 + skipped:true (no-op sur).

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "flowinevent@gmail.com";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "NDS x Flowin <onboarding@resend.dev>";
const DASHBOARD_URL = Deno.env.get("DASHBOARD_URL") || "https://flowin-events.vercel.app/dashboard.html";
const PROFORMA_URL = Deno.env.get("PROFORMA_URL") || "";

function esc(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function eur(v: unknown): string {
  const n = Number(v);
  if (!isFinite(n) || n === 0) return "—";
  return n.toLocaleString("fr-FR") + " € HT";
}

function buildEmail(r: Record<string, unknown>): { subject: string; html: string; text: string } {
  const nom = (r.nom ?? r.entreprise ?? "Etablissement") as string;
  const pack = (r.offre ?? r.pack ?? "—") as string;
  const montant = eur(r.montant_sponsoring ?? r.montant);
  const contact = (r.contact_nom ?? r.contact ?? "—") as string;
  const email = (r.contact_email ?? r.email ?? "—") as string;
  const tel = (r.contact_tel ?? r.tel ?? "—") as string;
  const adresse = (r.adresse ?? "—") as string;
  const ville = (r.ville ?? "—") as string;
  const statut = (r.statut_paiement ?? "en_attente_reglement") as string;

  const subject = "🤝 Nouvelle souscription NDS — " + nom + " (" + pack + ")";

  const rows: Array<[string, string]> = [
    ["Etablissement", esc(nom)],
    ["Pack", esc(pack)],
    ["Montant", esc(montant)],
    ["Contact", esc(contact)],
    ["Email", esc(email)],
    ["Telephone", esc(tel)],
    ["Adresse", esc(adresse) + (ville && ville !== "—" ? ", " + esc(ville) : "")],
    ["Statut paiement", esc(statut)],
  ];

  let trs = "";
  for (let i = 0; i < rows.length; i++) {
    trs +=
      '<tr><td style="padding:8px 14px;color:#7a708a;font-size:13px;white-space:nowrap">' +
      rows[i][0] +
      '</td><td style="padding:8px 14px;color:#1a1226;font-size:14px;font-weight:600">' +
      rows[i][1] +
      "</td></tr>";
  }

  let cta =
    '<a href="' +
    DASHBOARD_URL +
    '" style="display:inline-block;background:#E0218A;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:10px;font-size:14px">Ouvrir le dashboard</a>';
  if (PROFORMA_URL) {
    cta +=
      '&nbsp;&nbsp;<a href="' +
      PROFORMA_URL +
      '" style="display:inline-block;background:#3B5CC4;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:10px;font-size:14px">Bon de commande / proforma</a>';
  }

  const html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto">' +
    '<div style="background:#190a25;border-radius:14px 14px 0 0;padding:18px 20px;color:#fff;font-size:17px;font-weight:800">Nouvelle souscription partenaire — Nuits du Sud 2026</div>' +
    '<table style="width:100%;border-collapse:collapse;background:#faf7fd;border:1px solid #ece7f2;border-top:none">' +
    trs +
    "</table>" +
    '<div style="padding:18px 4px">' +
    cta +
    "</div>" +
    '<div style="color:#9a8fa6;font-size:12px;padding:6px 4px 18px">Lead capture en attente de reglement. Activez le partenaire (statut paye) une fois le virement recu.</div>' +
    "</div>";

  const unesc = (s: string) =>
    s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const text =
    "Nouvelle souscription NDS 2026\n\n" +
    rows.map((x) => x[0] + " : " + unesc(x[1])).join("\n") +
    "\n\nDashboard : " + DASHBOARD_URL +
    (PROFORMA_URL ? "\nProforma : " + PROFORMA_URL : "");

  return { subject, html, text };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Webhook Supabase => { record }, sinon objet direct
  const record = (payload.record ?? payload) as Record<string, unknown>;
  if (!record || (!record.contact_email && !record.email && !record.nom)) {
    return new Response(JSON.stringify({ error: "no record" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    // Deploiement sans secret : ne casse rien, signale juste.
    return new Response(JSON.stringify({ skipped: true, reason: "RESEND_API_KEY absent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const mail = buildEmail(record);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      reply_to: (record.contact_email ?? record.email ?? undefined) as string | undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "resend failed", status: res.status, body }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, resend: body }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
