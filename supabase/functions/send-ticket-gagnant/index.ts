// supabase/functions/send-ticket-gagnant/index.ts
//
// Envoie le ticket gagnant (lot attribue manuellement) par email au gagnant,
// via la meme passerelle Resend deja utilisee par notify-bon-commande / notify-souscription.
// Appelee directement depuis le dashboard (client-side) avec la cle publishable.
//
// SECRETS REQUIS : RESEND_API_KEY (deja configure sur le projet)
// Optionnels : NOTIFY_FROM (defaut "NDS x Flowin <onboarding@resend.dev>"), NOTIFY_TO (copie interne, defaut flowinevent@gmail.com)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "NDS x Flowin <onboarding@resend.dev>";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "flowinevent@gmail.com";

function esc(v: unknown): string {
  if (v === null || v === undefined || v === "") return "\u2014";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  const lotNom = String(body.lot_nom || "Lot");
  const lotDescription = String(body.lot_description || "");
  const conditions = String(body.conditions || "").trim() ||
    "Lot \u00e0 retirer sur pr\u00e9sentation de ce ticket, dans les conditions du festival Nuits du Sud 2026 (9 \u2192 18 juillet, Vence). Non \u00e9changeable, non remboursable, non cumulable.";
  const code = String(body.code || "");
  const valide = String(body.valide_jusqu_au || "");

  if (!gagnantEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gagnantEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "email gagnant invalide" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY absent (configuration serveur)" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto">' +
    '<div style="background:linear-gradient(160deg,#2a1036,#160820);border-radius:16px 16px 0 0;padding:22px 22px 26px;color:#fff;text-align:center">' +
    '<div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(255,255,255,.5);text-transform:uppercase;margin-bottom:8px">Flowin \u00d7 Nuits du Sud 2026</div>' +
    '<div style="font-size:20px;font-weight:800;margin-bottom:4px">\ud83c\udf89 F\u00e9licitations ' + esc(gagnantNom) + ' !</div>' +
    '<div style="font-size:13.5px;color:rgba(255,255,255,.75)">Tu as gagn\u00e9 : <b style="color:#F5B544">' + esc(lotNom) + '</b></div>' +
    (lotDescription ? '<div style="font-size:12.5px;color:rgba(255,255,255,.6);margin-top:6px">' + esc(lotDescription) + '</div>' : '') +
    (partenaireNom ? '<div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:10px">Offert par ' + esc(partenaireNom) + '</div>' : '') +
    '</div>' +
    '<div style="background:#f7f8fc;border:1px solid #e7e9f2;border-top:none;padding:20px 22px">' +
    '<div style="text-align:center;background:#fff;border:1px dashed #d8d4e0;border-radius:12px;padding:14px;margin-bottom:16px">' +
    '<div style="font-size:10px;color:#8A90A8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Code de ton ticket</div>' +
    '<div style="font-family:monospace;font-size:18px;font-weight:800;color:#16203A;letter-spacing:.05em">' + esc(code) + '</div>' +
    (valide ? '<div style="font-size:11px;color:#8A90A8;margin-top:4px">Valable jusqu\u2019au ' + esc(valide) + '</div>' : '') +
    '</div>' +
    '<div style="font-size:11.5px;color:#5b6577;line-height:1.6">' +
    '<b style="color:#16203A">Conditions d\u2019utilisation</b><br>' + esc(conditions) +
    '</div>' +
    '<div style="color:#8A90A8;font-size:11px;padding-top:16px;margin-top:16px;border-top:1px dashed #e0e3ee">Pr\u00e9sente ce code (ou l\u2019email) directement au commer\u00e7ant partenaire pour r\u00e9cup\u00e9rer ton lot. BAITA EURL \u00b7 OPConsult \u00b7 info@opconsult.co.</div>' +
    '</div></div>';

  const text = `Felicitations ${gagnantNom} !\n\nTu as gagne : ${lotNom}${partenaireNom ? ' (offert par ' + partenaireNom + ')' : ''}\n\nCode de ton ticket : ${code}${valide ? '\nValable jusqu\'au ' + valide : ''}\n\nConditions d'utilisation :\n${conditions}\n\nPresente ce code au commercant partenaire pour recuperer ton lot.`;

  async function envoyer(to: string, subject: string) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: NOTIFY_FROM, to: [to], reply_to: NOTIFY_TO, subject, html, text }),
    });
    const bodyTxt = await res.text();
    return { to, ok: res.ok, status: res.status, body: bodyTxt };
  }

  const results = [];
  results.push(await envoyer(gagnantEmail, "\ud83c\udf89 Ton ticket gagnant \u2014 " + lotNom + " \u2014 Nuits du Sud 2026"));
  results.push(await envoyer(NOTIFY_TO, "Copie ticket envoy\u00e9 \u2014 " + esc(gagnantNom) + " \u2014 " + lotNom));

  const anyFail = results.some((r) => r.ok === false);
  return new Response(JSON.stringify({ ok: !anyFail, results }), {
    status: anyFail ? 502 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
