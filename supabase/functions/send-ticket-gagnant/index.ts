// supabase/functions/send-ticket-gagnant/index.ts
//
// Envoie le ticket gagnant par email, via Resend (compte enregistre sur flowinevent@gmail.com).
//
// 28/07/2026 -- REECRITURE pour reprendre le texte EXACT, mot pour mot, de
// public/nds/mail-gagnant.js, la "source unique du message au gagnant" deja validee
// (commentaire du fichier : "ne jamais recopier ce texte ailleurs, le corriger ici, une seule
// fois"). Cette fonction edge est justement cette seule autre copie legitime -- le texte est
// porte fidelement depuis le JS navigateur vers Deno, aucun mot change. Avant cette reecriture,
// la fonction envoyait un texte invente qui ne correspondait pas a la reference -- corrige.
//
// Le lien du billet pointe desormais vers /nds/billets-partenaires.html?t=<retrait_token>
// (le vrai design de billet deja valide : QR genere en direct, logo, mise en page), et non plus
// vers un simple code texte.
//
// SECRETS REQUIS : RESEND_API_KEY (deja configure)
// Optionnels : NOTIFY_FROM_ADDR, NOTIFY_FROM_NAME, NOTIFY_TO, SITE_ORIGIN (defaut
// https://flowin-events.vercel.app)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_FROM_ADDR = Deno.env.get("NOTIFY_FROM_ADDR") || "onboarding@resend.dev";
const NOTIFY_FROM_DEFAULT_NAME = Deno.env.get("NOTIFY_FROM_NAME") || "NDS x Flowin";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "flowinevent@gmail.com";
const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") || "https://flowin-events.vercel.app";

function esc(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function prenomDe(nom: string): string {
  return String(nom || "").trim().split(/\s+/)[0] || "";
}
function lienBillet(retraitToken: string): string {
  if (!retraitToken) return "";
  return SITE_ORIGIN + "/nds/billets-partenaires.html?t=" + encodeURIComponent(retraitToken);
}
function puces(conditions: string): string[] {
  if (!conditions) return [];
  return conditions.split("\u00b7").map((c) => c.trim()).filter((c) => c.length > 5);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const gagnantEmail = String(body.gagnant_email || "").trim();
  const gagnantNom = String(body.gagnant_nom || "").trim();
  const partenaireNom = String(body.partenaire_nom || "");
  const partenaireAdresse = String(body.partenaire_adresse || "");
  const partenaireTel = String(body.partenaire_tel || "");
  const lotNom = String(body.lot_nom || "un lot");
  const conditions = String(body.conditions || "");
  const code = String(body.code || "");
  const retraitToken = String(body.retrait_token || "");

  const fromName = String(body.from_name || "").trim() || NOTIFY_FROM_DEFAULT_NAME;
  const from = `${fromName} <${NOTIFY_FROM_ADDR}>`;
  const replyTo = String(body.reply_to || "").trim() || NOTIFY_TO;

  if (!gagnantEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gagnantEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "email gagnant invalide" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY absent (configuration serveur)" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ---- Texte du corps, PORTE MOT POUR MOT depuis mail-gagnant.js (fonction corps(), branche "grand") ----
  const lien = lienBillet(retraitToken);
  const coord = [partenaireAdresse, partenaireTel].filter(Boolean).join(" \u2014 ");
  const prenom = prenomDe(gagnantNom);

  const lignes: string[] = [`Bonjour ${prenom},`, ""];
  lignes.push("Waouh, bravo ! Au grand tirage du jeu des Nuits du Sud 2026, tu as gagn\u00e9 :", "",
    "   " + lotNom);
  if (partenaireNom) lignes.push("   chez " + partenaireNom);
  if (coord) lignes.push("   " + coord);
  lignes.push("");
  if (lien) {
    lignes.push(">>> TON BILLET EST ICI <<<", "", "   " + lien, "",
      "Clique sur ce lien : tu peux l'imprimer ou le garder sur ton t\u00e9l\u00e9phone.",
      "C'est ce billet, avec son QR code, que tu pr\u00e9senteras en boutique.", "");
  }
  lignes.push("Merci d'avoir participé, et bravo encore : tu faisais partie de plus de 600 joueurs.", "",
    "COMMENT EN PROFITER, EN 3 \u00c9TAPES", "",
    "   1. Rends-toi chez " + (partenaireNom || "notre commer\u00e7ant partenaire"),
    "   2. Pr\u00e9sente ton billet, papier ou \u00e9cran",
    "   3. Le commer\u00e7ant scanne le QR code et valide \u2014 c'est tout", "");
  const c = puces(conditions);
  if (c.length) { lignes.push("\u00c0 SAVOIR", ""); c.forEach((x) => lignes.push("   - " + x)); lignes.push(""); }
  if (code) lignes.push("Ton num\u00e9ro de billet : " + code, "");
  lignes.push("Encore bravo, et \u00e0 bient\u00f4t chez notre partenaire.", "",
    "Les Nuits du Sud, la Ville de Vence et Flowin",
    "flowinevent@gmail.com \u00b7 06 16 35 49 36");

  const text = lignes.join("\n");
  const html = "<pre style=\"font-family:-apple-system,Segoe UI,Roboto,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16203A\">"
    + esc(text).replace(lien, `<a href="${esc(lien)}">${esc(lien)}</a>`) + "</pre>";

  const sujet = "Nuits du Sud & Flowin \u2014 Grand Jeu Concours \u2014 Vous avez gagn\u00e9 !";

  async function envoyer(to: string, subject: string) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html, text }),
    });
    const bodyTxt = await res.text();
    return { to, ok: res.ok, status: res.status, body: bodyTxt };
  }

  const results = [];
  results.push(await envoyer(gagnantEmail, sujet));
  results.push(await envoyer(NOTIFY_TO, "Copie ticket envoy\u00e9 \u2014 " + esc(gagnantNom) + " \u2014 " + lotNom));

  const anyFail = results.some((r) => r.ok === false);
  return new Response(JSON.stringify({ ok: !anyFail, results }), {
    status: anyFail ? 502 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
