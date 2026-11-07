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
// Fournies automatiquement par Supabase aux fonctions edge (jamais dans le depot).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

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

  // ---- SECURITE 07/11/2026 ------------------------------------------------------------
  // Avant : destinataire, expediteur (from_name) et reply-to venaient du corps de la requete,
  // fonction sans verify_jwt -> relais d'email ouvert a n'importe qui, au nom de Flowin.
  // Apres :
  //   * mode NORMAL : `retrait_token` obligatoire ; le destinataire, le nom, le lot, le code et
  //     le commerce sont relus EN BASE (cle service, jamais exposee) depuis le tirage lie a ce
  //     jeton. L'email du corps est ignore.
  //   * mode ADMIN : sans jeton, accepte seulement si l'appelant presente le jeton d'un
  //     super admin (RPC est_super_admin lue avec SON jeton) -- dashboard.html (se_gains).
  //   * expediteur et reply-to : fixes cote serveur (NOTIFY_FROM_*, NOTIFY_TO), from_name /
  //     reply_to du corps ignores.
  const retraitToken = String(body.retrait_token || "").trim();
  let gagnantEmail = "", gagnantNom = "", partenaireNom = "", partenaireAdresse = "", partenaireTel = "";
  let lotNom = "un lot", conditions = "", code = "";

  const json = (o: unknown, status: number) =>
    new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (retraitToken) {
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "configuration serveur incomplete" }, 500);
    const hSrv = { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "Content-Type": "application/json" };
    const rT = await fetch(SUPABASE_URL + "/rest/v1/tirages?select=joueur_email,joueur_nom,ticket_code,lot_nom&retrait_token=eq." + encodeURIComponent(retraitToken) + "&limit=1", { headers: hSrv });
    const lignes = rT.ok ? (await rT.json().catch(() => [])) as Array<Record<string, string | null>> : [];
    const t = lignes && lignes[0];
    if (!t) return json({ ok: false, error: "jeton de retrait inconnu" }, 404);
    gagnantEmail = String(t.joueur_email || "").trim();
    gagnantNom = String(t.joueur_nom || "").trim();
    lotNom = String(t.lot_nom || "") || "un lot";
    code = String(t.ticket_code || "");
    const rL = await fetch(SUPABASE_URL + "/rest/v1/rpc/consulter_lot", { method: "POST", headers: hSrv, body: JSON.stringify({ p_token: retraitToken }) });
    const l = rL.ok ? (await rL.json().catch(() => null)) as Record<string, string | null> | null : null;
    if (l) {
      partenaireNom = String(l.partenaire_nom || "");
      partenaireAdresse = String(l.partenaire_adresse || "");
      partenaireTel = String(l.partenaire_tel || "");
      conditions = String(l.conditions || "");
    }
  } else {
    const auth = req.headers.get("authorization") || "";
    let admin = false;
    if (SUPABASE_URL && ANON_KEY && /^Bearer\s+\S+/.test(auth)) {
      const rA = await fetch(SUPABASE_URL + "/rest/v1/rpc/est_super_admin", { method: "POST", headers: { apikey: ANON_KEY, Authorization: auth, "Content-Type": "application/json" }, body: "{}" });
      admin = rA.ok && (await rA.json().catch(() => false)) === true;
    }
    if (!admin) return json({ ok: false, error: "retrait_token requis (ou session super admin)" }, 403);
    gagnantEmail = String(body.gagnant_email || "").trim();
    gagnantNom = String(body.gagnant_nom || "").trim();
    partenaireNom = String(body.partenaire_nom || "");
    partenaireAdresse = String(body.partenaire_adresse || "");
    partenaireTel = String(body.partenaire_tel || "");
    lotNom = String(body.lot_nom || "un lot");
    conditions = String(body.conditions || "");
    code = String(body.code || "");
  }

  const from = `${NOTIFY_FROM_DEFAULT_NAME} <${NOTIFY_FROM_ADDR}>`;
  const replyTo = NOTIFY_TO;

  if (!gagnantEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gagnantEmail)) {
    return json({ ok: false, error: "email gagnant invalide ou absent pour ce tirage" }, 422);
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
