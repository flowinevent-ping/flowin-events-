// supabase/functions/notify-commande-animation/index.ts
//
// Email à Flowin (et copie au client à la création) pour les commandes « Flowin Animation magasin »
// (table commandes_animation, alimentée par admin/public/bon-commande-animation.html).
//
// Déclenchement : triggers SQL trg_notify_commande_animation_insert / _statut (net.http_post),
// voir sql/2026-11-01-commandes-animation.sql (NON appliqué à la date d'écriture).
// Payload : { type: 'nouvelle_commande' | 'statut', ancien_statut, record } (logo retiré).
//
// Secrets projet (déjà configurés pour notify-bon-commande, AUCUNE valeur ici) :
//   RESEND_API_KEY, NOTIFY_TO (défaut flowinevent@gmail.com), NOTIFY_FROM.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "flowinevent@gmail.com";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "Flowin <onboarding@resend.dev>";
const IBAN = "FR76 1460 7003 3470 2211 6462 345";
const BIC = "CCBPFRPPMAR";
const CGV_URL = "https://flowin-events.vercel.app/cgv-animation-magasin.html";

const STATUTS: Record<string, string> = {
  en_attente_paiement: "En attente de paiement",
  mandat_en_cours: "Mandat SEPA en cours",
  mandat_actif: "Mandat SEPA actif",
  payee: "Payée",
  mandat_echoue: "Mandat refusé ou annulé",
  paiement_echoue: "Prélèvement échoué",
  annulee: "Annulée",
};

function esc(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function eur(v: unknown): string {
  const n = Number(v);
  if (!isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { return json({ error: "invalid json" }, 400); }
  const r = (payload.record ?? {}) as Record<string, unknown>;
  const type = String(payload.type ?? "nouvelle_commande");
  if (!r || !r.id) return json({ error: "no record" }, 422);
  if (!RESEND_API_KEY) return json({ skipped: true, reason: "RESEND_API_KEY absent" });

  const kit = r.kit === "physique" ? `Kit physique × ${r.nb_boutiques}` : "Kit digital";
  const options: string[] = [];
  if (Number(r.opt_quiz_qte) > 0) options.push(`Quiz personnalisé × ${r.opt_quiz_qte}`);
  if (Number(r.opt_bonus_qte) > 0) options.push(`Questions bonus × ${r.opt_bonus_qte}`);
  const paiement = r.mode_paiement === "prelevement_sepa"
    ? "Prélèvement SEPA (GoCardless)" + (r.prelevement_inclut_reste ? ", tout inclus" : ", kit et options par virement")
    : "Virement bancaire";

  const rows: Array<[string, string]> = [
    ["Commande", esc(r.id)],
    ["Statut", esc(STATUTS[String(r.statut)] ?? r.statut)],
    ["Établissement", esc(r.raison_sociale)],
    ["SIRET", esc(r.siret)],
    ["Adresse", esc([r.adresse, [r.cp, r.ville].filter(Boolean).join(" ")].filter(Boolean).join(", "))],
    ["Contact", esc(r.contact_nom) + (r.contact_fonction ? " (" + esc(r.contact_fonction) + ")" : "")],
    ["Email", esc(r.email)],
    ["Téléphone", esc(r.tel)],
    ["Boutiques", esc(r.nb_boutiques)],
    ["Panier moyen déclaré", r.panier_moyen == null ? "—" : esc(eur(r.panier_moyen))],
    ["Formule", "Abonnement annuel · " + esc(kit) + (options.length ? " · " + esc(options.join(" · ")) : "")],
    ["Montant HT", esc(eur(r.montant_ht))],
    ["Montant TTC", esc(eur(r.montant_ttc))],
    ["Paiement", esc(paiement)],
    ["Commercial", esc(r.commercial)],
    ["Logo fourni", r.a_un_logo ? "Oui" : "Non"],
    ["Signataire", esc(r.signataire_nom) + (r.signataire_qualite ? " (" + esc(r.signataire_qualite) + ")" : "")],
    ["Signé le", esc(r.signature_horodatage ? new Date(String(r.signature_horodatage)).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : null)],
    ["IP de signature", esc(r.signature_ip)],
    ["CGV", esc(r.cgv_version)],
  ];
  let trs = "";
  for (const [k, v] of rows) {
    trs += '<tr><td style="padding:7px 14px;color:#655a70;font-size:13px;white-space:nowrap">' + k +
      '</td><td style="padding:7px 14px;color:#150C1C;font-size:14px;font-weight:600">' + v + "</td></tr>";
  }
  const titre = type === "statut"
    ? `Commande Animation ${r.id} : ${STATUTS[String(r.statut)] ?? r.statut}`
    : `Nouvelle commande Animation magasin — ${r.raison_sociale}`;
  const html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:580px;margin:0 auto">' +
    '<div style="background:#00B4A0;border-radius:14px 14px 0 0;padding:18px 20px;color:#fff;font-size:17px;font-weight:800">' + esc(titre) + "</div>" +
    '<table style="width:100%;border-collapse:collapse;background:#F6F7F5;border:1px solid #E1E7E4;border-top:none">' + trs + "</table>" +
    '<div style="color:#958aa0;font-size:12px;padding:14px 4px">Table commandes_animation (Supabase). Statut mis à jour automatiquement par GoCardless pour le prélèvement ; à passer en « payee » à la main à réception d\'un virement.</div></div>';
  const text = titre + "\n\n" + rows.map(([k, v]) => k + " : " + v.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")).join("\n");

  const clientEmail = String(r.email ?? "").trim();
  const emailValide = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail);

  async function envoyer(to: string, subject: string, htmlBody: string, textBody: string) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: NOTIFY_FROM, to: [to], reply_to: emailValide ? clientEmail : undefined, subject, html: htmlBody, text: textBody }),
    });
    return { to, ok: res.ok, status: res.status };
  }

  const results: Array<Record<string, unknown>> = [];
  results.push(await envoyer(NOTIFY_TO, titre, html, text));

  // Copie client : seulement à la création
  if (type === "nouvelle_commande" && emailValide) {
    const reglement = r.mode_paiement === "prelevement_sepa"
      ? "Prélèvement SEPA : signez votre mandat sur la page sécurisée GoCardless si ce n'est pas déjà fait." +
        (r.prelevement_inclut_reste ? "" : "<br>Kit et options à régler par virement : IBAN " + IBAN + " · BIC " + BIC + " · référence " + esc(r.id))
      : "Virement de " + esc(eur(r.montant_ttc)) + " TTC à l'ordre de BAITA EURL<br>IBAN " + IBAN + " · BIC " + BIC + "<br>Référence à rappeler : " + esc(r.id);
    const htmlClient =
      '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:580px;margin:0 auto">' +
      '<div style="background:#D9F2EA;border-radius:14px 14px 0 0;padding:18px 20px;color:#150C1C;font-size:17px;font-weight:800">Votre commande Flowin Animation est enregistrée</div>' +
      '<table style="width:100%;border-collapse:collapse;background:#F6F7F5;border:1px solid #E1E7E4;border-top:none">' + trs + "</table>" +
      '<div style="background:#fff;border:1px solid #ece6dc;border-radius:10px;padding:14px 16px;margin:16px 4px;font-size:13px;color:#3a2f45"><b>Règlement</b><br>' + reglement + "</div>" +
      '<div style="padding:4px"><a href="' + CGV_URL + '" style="color:#00897B;font-weight:700;font-size:12px">Conditions générales de vente</a></div>' +
      '<div style="color:#958aa0;font-size:12px;padding:16px 4px">Merci pour votre confiance. Flowin vous contacte pour préparer votre animation. BAITA EURL · Flowin · 40 rue des Arcs, 06140 Vence.</div></div>';
    results.push(await envoyer(clientEmail, "Votre commande Flowin Animation " + String(r.id), htmlClient, text));
  }

  const anyFail = results.some((x) => x.ok === false);
  return json({ ok: !anyFail, results }, anyFail ? 502 : 200);
});
