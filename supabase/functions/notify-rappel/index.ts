// supabase/functions/notify-rappel/index.ts
//
// Formulaire « Être rappelé » de la plaquette Flowin Animation magasin
// (admin/public/plaquette-animation-magasin.html, page #rappel).
// Envoie un email « Demande de prise de rendez-vous » avec toutes les infos saisies.
//
// NON DÉPLOYÉE à la date d'écriture. Déploiement (une fois relu) :
//   supabase functions deploy notify-rappel --no-verify-jwt
// --no-verify-jwt : la page appelle la fonction avec la clé publishable (qui n'est pas un JWT) ;
// la fonction fait elle-même la validation, l'anti-spam (champ piège, délai minimal) et la limite de taille.
//
// Secrets projet (aucune valeur ici) :
//   RESEND_API_KEY   déjà configuré pour notify-bon-commande / notify-souscription
//   RAPPEL_TO        destinataire (défaut : flowinevents@gmail.com, adresse donnée dans la consigne)
//   NOTIFY_FROM      expéditeur Resend (défaut onboarding@resend.dev : sans domaine vérifié,
//                    Resend n'envoie qu'à l'adresse du compte, voir README notify-souscription)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RAPPEL_TO = Deno.env.get("RAPPEL_TO") || "flowinevents@gmail.com";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "Flowin <onboarding@resend.dev>";
const ORIGINES = ["https://flowin-events.vercel.app", "http://localhost:3000"];

function cors(origin: string | null): Record<string, string> {
  const o = origin && (ORIGINES.indexOf(origin) >= 0 || /\.vercel\.app$/.test(origin)) ? origin : ORIGINES[0];
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });
}
function txt(v: unknown, max: number): string {
  return String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405, origin);
  const raw = await req.text();
  if (raw.length > 8000) return json({ ok: false, error: "trop long" }, 413, origin);
  let b: Record<string, unknown> = {};
  try { b = JSON.parse(raw); } catch { return json({ ok: false, error: "json invalide" }, 400, origin); }

  // Anti-spam : champ piège rempli ou envoi trop rapide -> on répond OK sans rien envoyer
  if (txt(b.site_web, 200) !== "" || Number(b.duree_ms) < 3000) return json({ ok: true }, 200, origin);

  const d = {
    prenom: txt(b.prenom, 80), nom: txt(b.nom, 80), entreprise: txt(b.entreprise, 160), ville: txt(b.ville, 120),
    tel: txt(b.tel, 40), email: txt(b.email, 200), creneau: txt(b.creneau, 60), message: txt(b.message, 1000),
    commercial: txt(b.commercial, 60), origine: txt(b.origine, 60),
  };
  const manque: string[] = [];
  if (d.prenom.length < 2) manque.push("prenom");
  if (d.nom.length < 2) manque.push("nom");
  if (d.entreprise.length < 2) manque.push("entreprise");
  if (d.ville.length < 2) manque.push("ville");
  if (d.tel.replace(/[^0-9+]/g, "").length < 8) manque.push("tel");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) manque.push("email");
  if (b.consentement !== true) manque.push("consentement");
  if (manque.length) return json({ ok: false, error: "champs invalides", champs: manque }, 422, origin);
  if (!RESEND_API_KEY) return json({ ok: false, error: "RESEND_API_KEY absent" }, 503, origin);

  const rows: Array<[string, string]> = [
    ["Prénom", d.prenom], ["Nom", d.nom], ["Entreprise", d.entreprise], ["Ville", d.ville],
    ["Téléphone", d.tel], ["Email", d.email], ["Créneau préféré", d.creneau || "Indifférent"],
    ["Message", d.message || "—"], ["Consentement", "Oui, accepte d'être recontacté"],
    ["Commercial", d.commercial || "—"], ["Origine", d.origine || "—"],
    ["Reçu le", new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })],
  ];
  let trs = "";
  for (const [k, v] of rows) {
    trs += '<tr><td style="padding:7px 14px;color:#5a6b80;font-size:13px;white-space:nowrap;vertical-align:top">' + k +
      '</td><td style="padding:7px 14px;color:#1B3A5C;font-size:14px;font-weight:600;white-space:pre-wrap">' + esc(v) + "</td></tr>";
  }
  const html = '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto">' +
    '<div style="background:#3B5CC4;border-radius:14px 14px 0 0;padding:16px 20px;color:#fff;font-size:17px;font-weight:800">Demande de prise de rendez-vous</div>' +
    '<table style="width:100%;border-collapse:collapse;background:#F4F6F9;border:1px solid #DCE3EC;border-top:none">' + trs + "</table></div>";
  const text = "Demande de prise de rendez-vous\n\n" + rows.map(([k, v]) => k + " : " + v).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: NOTIFY_FROM, to: [RAPPEL_TO], reply_to: d.email, subject: "Demande de prise de rendez-vous", html, text }),
  });
  if (!res.ok) return json({ ok: false, error: "envoi email " + res.status }, 502, origin);
  return json({ ok: true }, 200, origin);
});
