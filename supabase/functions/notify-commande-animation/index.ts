// supabase/functions/notify-commande-animation/index.ts
//
// Chaîne « Flowin, jeu d'animation » : souscription -> accusé de réception -> paiement validé ->
// contrat signé + facture acquittée -> statut documents_envoyes. Déployée le 10/11/2026 (verify_jwt false).
//
// Appels (voir sql/03-commandes-animation.sql, NON appliqué) :
//   { type: 'nouvelle_commande', record }   trigger après insert  -> email Flowin + ACCUSÉ au client
//                                            (bon de commande PDF + coordonnées de virement, PAS de facture)
//   { type: 'statut', ancien_statut, record } changement de statut -> email Flowin
//   { type: 'paiement_valide', record }      statut -> payee (webhook GoCardless ou SA « virement reçu ») :
//                                            la base a déjà émis la facture ; envoi contrat + facture, UNE fois
//   { type: 'renvoi_documents', commande_id } bouton SA « Renvoyer les documents » (journalisé en base)
//   { type: 'facture_mensualite', commande_id, facture_numero } route webhook (mois 2 et suivants)
//   { type: 'en_attente', jours, commandes: [{id, raison_sociale, montant_ttc, jours}] }  alerte quotidienne
//                                            « commandes en attente de paiement depuis plus de X jours »
//                                            (SQL alerte_commandes_en_attente, a planifier) -> email Flowin
//   { type: 'paiement_declare', commande_id, event_id }  Lot A (10/11/2026) : le pro déclare son virement depuis le bon
//                                            (publication de l'animation) -> email au pro « Paiement déclaré, contrôle
//                                            sous 3 à 5 jours » + email Flowin « paiement à vérifier ». Commande RELUE en
//                                            base ; envoi seulement si elle est encore en attente de paiement.
//
// Secrets (AUCUNE valeur ici) : RESEND_API_KEY, NOTIFY_TO (défaut flowinevent@gmail.com), NOTIFY_FROM.
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase aux fonctions edge.
// Déploiement : supabase functions deploy notify-commande-animation --no-verify-jwt
// (les triggers appellent avec la clé anon ; aucune donnée n'est renvoyée à l'appelant).

import { jsPDF } from "npm:jspdf@2.5.1";
// Modèle unique du bon de commande (identique au navigateur) : pose FlowinBonPDF sur globalThis. Copie de public/bon-commande-pdf.js (MD5 identique, scripts/verifier-bon-commande-pdf.sh).
import "../_shared/flowin-config.js"; // interrupteur central (GARANTIE_ACTIVE) : pose FLOWIN_CONFIG sur globalThis, AVANT le modèle PDF
import "../_shared/bon-commande-pdf.js";
import { emailAccuse, emailDocuments, emailFlowin, emailMensualite, esc, eur, pdfContrat, pdfFacture, type Commande, type Facture } from "./documents.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "flowinevent@gmail.com";
// Règle de Romain (10/11/2026) : bon de commande édité depuis le SUPER ADMIN (champ « commercial » rempli,
// vente assistée) -> envoyé au pro. Rempli depuis la PLAQUETTE (pas de commercial) -> envoyé à Flowin, objet
// au nom du commerce, Flowin le transmet ensuite depuis le super admin. ENVOI_CLIENT=oui : toujours au pro.
const ENVOI_CLIENT = (Deno.env.get("ENVOI_CLIENT") || "") === "oui";
const DEST_FLOWIN = Array.from(new Set([NOTIFY_TO, "flowinevent@gmail.com"]));
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "Flowin <onboarding@resend.dev>";
const SUPA_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const COLS = "id,statut,type_commande,offre,enseigne,prelevement_inclut_reste,engagement_mois,engagement_accepte,raison_sociale,siret,adresse,cp,ville,contact_nom,contact_fonction,email,tel,nb_boutiques,commercial,kit,opt_quiz_qte,opt_bonus_qte,montant_abonnement_ht,montant_kit_ht,montant_options_ht,montant_ht,montant_tva,montant_ttc,mode_paiement,garantie,garantie_clients_objectif,garantie_certifiee_le,garantie_certifiee_par,panier_moyen,flux_journalier,cgv_version,signataire_nom,signataire_qualite,signature_horodatage,signature_ip,facture_numero,documents_envoyes_le,activite,lots_proposes,conditions_lots";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" } });
}
const H = () => ({ apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" });
async function rest(path: string, init: RequestInit = {}): Promise<any> {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { ...init, headers: { ...H(), ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${path.split("?")[0]} ${r.status}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
const rpc = (nom: string, args: Record<string, unknown>) => rest(`rpc/${nom}`, { method: "POST", body: JSON.stringify(args) });
async function commande(id: string): Promise<Commande | null> {
  const rows = await rest(`commandes_animation?id=eq.${encodeURIComponent(id)}&select=${COLS}`); return rows?.[0] ?? null;
}
async function facture(filtre: string): Promise<Facture | null> {
  const rows = await rest(`factures_animation?${filtre}&select=*`); return rows?.[0] ?? null;
}
function b64(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
}
async function envoyer(to: string, m: { sujet: string; html: string }, pj: Array<{ filename: string; content: string }> = [], r?: Commande): Promise<string> {
  let dest = [to];
  if (to === NOTIFY_TO) dest = DEST_FLOWIN;
  else if (!ENVOI_CLIENT && !(r && r.commercial)) { dest = DEST_FLOWIN; m = { sujet: `[${(r && (r.enseigne || r.raison_sociale)) || to}] ${m.sujet} (à transmettre au pro : ${to})`, html: m.html }; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: NOTIFY_FROM, to: dest, subject: m.sujet, html: m.html, attachments: pj.length ? pj : undefined }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`resend ${res.status} ${JSON.stringify(j).slice(0, 200)}`);
  return String(j.id ?? "");
}

/** Paiement validé ou renvoi : contrat signé + facture acquittée, une seule fois (sauf renvoi SA). */
async function documents(id: string, force: boolean): Promise<Response> {
  if (force) {
    // Renvoi : uniquement si le SA l'a demandé il y a moins de 2 minutes (journal en base)
    const depuis = new Date(Date.now() - 120000).toISOString();
    const j = await rest(`commandes_animation_journal?commande_id=eq.${encodeURIComponent(id)}&action=eq.renvoi_documents&le=gte.${depuis}&select=id&limit=1`);
    if (!j?.length) return json({ ok: false, error: "renvoi non demandé par le SA" }, 403);
  }
  const reserve = await rpc("reserver_envoi_documents", { p_commande: id, p_force: force });
  if (reserve !== true) return json({ ok: true, skipped: "déjà envoyé, envoi en cours ou paiement non validé" });
  try {
    const r = await commande(id); if (!r) throw new Error("commande introuvable");
    const f = await facture(`commande_id=eq.${encodeURIComponent(id)}&objet=eq.commande`); if (!f) throw new Error("facture absente");
    const resend = await envoyer(String(r.email), emailDocuments(r, f), [
      { filename: `contrat-flowin-${r.id}.pdf`, content: b64(pdfContrat(jsPDF, r)) },
      { filename: `facture-${f.numero}.pdf`, content: b64(pdfFacture(jsPDF, f)) },
    ], r);
    await rpc("terminer_envoi_documents", { p_commande: id, p_ok: true, p_details: { resend, facture: f.numero, renvoi: force } });
    return json({ ok: true, facture: f.numero });
  } catch (e) {
    await rpc("terminer_envoi_documents", { p_commande: id, p_ok: false, p_details: { erreur: String(e).slice(0, 300) } }).catch(() => null);
    return json({ ok: false, error: String(e) }, 502);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let p: Record<string, any> = {};
  try { p = await req.json(); } catch { return json({ error: "invalid json" }, 400); }
  if (!RESEND_API_KEY) return json({ skipped: true, reason: "RESEND_API_KEY absent" });
  if (!SUPA_URL || !SERVICE) return json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absents" }, 500);
  const type = String(p.type ?? "");
  try {
    if (type === "en_attente") {
      const liste: Array<Record<string, unknown>> = Array.isArray(p.commandes) ? p.commandes : [];
      if (!liste.length) return json({ ok: true, skipped: "rien en attente" });
      const lignes = liste.map((c) => `<tr><td style="padding:7px 14px;font-size:13px;white-space:nowrap">${esc(c.id)}</td><td style="padding:7px 14px;font-size:14px;font-weight:600;color:#1B3A5C">${esc(c.raison_sociale)}</td><td style="padding:7px 14px;font-size:13px">${esc(eur(c.montant_ttc))} TTC</td><td style="padding:7px 14px;font-size:13px;font-weight:700;color:#C62F2F">${esc(c.jours)} j</td></tr>`).join("");
      const sujet = `${liste.length} commande${liste.length > 1 ? "s" : ""} Animation en attente de paiement depuis plus de ${esc(p.jours)} jours`;
      const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;margin:0 auto"><div style="background:#1B3A5C;border-radius:14px 14px 0 0;padding:18px 20px;color:#fff;font-size:17px;font-weight:800">${sujet}</div><table style="width:100%;border-collapse:collapse;background:#F4F6F9;border:1px solid #DCE3EC;border-top:none">${lignes}</table><div style="color:#5a6b80;font-size:12px;padding:14px 4px">Dès réception du virement : page Super Admin des commandes Animation, « Marquer le virement reçu ». La facture est émise et l'espace pro du client s'ouvre automatiquement.</div></div>`;
      await envoyer(NOTIFY_TO, { sujet, html });
      return json({ ok: true });
    }
    if (type === "nouvelle_commande" || type === "statut") {
      const id = String(p.record?.id ?? ""); if (!id) return json({ error: "no record" }, 422);
      const r = await commande(id); if (!r) return json({ error: "commande introuvable" }, 404);   // relue en base : on n'envoie pas ce que l'appelant affirme
      await envoyer(NOTIFY_TO, emailFlowin(r, type, p.ancien_statut));
      if (type === "nouvelle_commande" && r.commercial) {
        const deja = await rest(`commandes_animation?id=eq.${encodeURIComponent(id)}&accuse_envoye_le=is.null&select=id`, {
          method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ accuse_envoye_le: new Date().toISOString() }),
        });
        if (deja?.length) {
          await envoyer(String(r.email), emailAccuse(r), [{ filename: `bon-commande-flowin-${r.id}.pdf`, content: b64(pdfContrat(jsPDF, r)) }], r);
          await rest("commandes_animation_journal", { method: "POST", body: JSON.stringify({ commande_id: id, par: "fonction notify-commande-animation", action: "accuse_envoye" }) });
        }
      }
      return json({ ok: true });
    }
    if (type === "paiement_declare") {
      const id = String(p.commande_id ?? ""); if (!/^AM-[0-9]{8}-[A-Z0-9]{8}$/.test(id)) return json({ error: "commande_id invalide" }, 422);
      const r = await commande(id); if (!r) return json({ error: "commande introuvable" }, 404);
      if (String((r as any).statut) !== "en_attente_paiement") return json({ ok: true, skipped: "commande deja traitee" });
      const ev = String(p.event_id ?? "").slice(0, 100);
      await envoyer(NOTIFY_TO, { sujet: `Paiement à vérifier : ${(r as any).raison_sociale ?? ""} (${r.id}) · ${eur((r as any).montant_ttc)} TTC`, html: `<div style="font-family:sans-serif;font-size:14px;color:#1B3A5C"><b>Virement déclaré, à contrôler à la main.</b><br>Commande <b>${esc(r.id)}</b> · ${esc((r as any).raison_sociale)} · ${esc((r as any).contact_nom)} · ${esc((r as any).email)} · ${esc((r as any).tel)}<br>Montant : <b>${esc(eur((r as any).montant_ttc))} TTC</b>, référence du virement : <b>${esc(r.id)}</b>${ev ? `<br>Animation : ${esc(ev)} (déjà en ligne)` : ""}<br><br>Dès le virement vu sur le compte : « Marquer le virement reçu » dans https://flowin-events.vercel.app/admin-commandes-animation.html</div>` });
      return json({ ok: true });
    }
    if (type === "paiement_valide") return await documents(String(p.record?.id ?? ""), false);
    if (type === "renvoi_documents") return await documents(String(p.commande_id ?? ""), true);
    if (type === "facture_mensualite") {
      const id = String(p.commande_id ?? ""), num = String(p.facture_numero ?? "");
      const r = await commande(id); const f = await facture(`numero=eq.${encodeURIComponent(num)}&commande_id=eq.${encodeURIComponent(id)}`);
      if (!r || !f) return json({ error: "introuvable" }, 404);
      await envoyer(String(r.email), emailMensualite(r, f), [{ filename: `facture-${f.numero}.pdf`, content: b64(pdfFacture(jsPDF, f)) }], r);
      return json({ ok: true });
    }
    return json({ error: "type inconnu" }, 422);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
