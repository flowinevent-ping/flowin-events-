// supabase/functions/_shared/mailer.ts — envoi d'emails commun aux fonctions edge (19/11/2026).
//
// 1. Si les secrets GMAIL_USER et GMAIL_APP_PASSWORD existent : Gmail SMTP (smtp.gmail.com:465, TLS direct),
//    expéditeur « Flowin Event <GMAIL_USER> » (GMAIL_FROM pour le changer).
// 2. Sinon : chemin Resend inchangé (RESEND_API_KEY, NOTIFY_FROM).
// 3. Sinon : rien n'est envoyé, { ok:false, skipped:true }.
//
// Bibliothèque : npm:nodemailer (spécifieur npm:, pris en charge par le runtime Supabase Edge). Le port 465
// est utilisé car Supabase bloque les ports sortants 25 et 587. Pas de denomailer (non maintenu, soucis TLS).
// Garde-fou Gmail (~500/jour) : au-delà de 450 envois du jour, l'envoi est sauté et journalisé.
// Le compteur vit dans la table emails_compteur_jour (sql/2026-11-19-emails-compteur-jour.sql) ; si elle
// n'existe pas, compteur en mémoire de l'instance (approximatif). Petite pause entre deux envois Gmail.
// Aucun secret dans ce fichier.

import nodemailer from "npm:nodemailer@6.9.16";

export interface PieceJointe { filename: string; content: string } // content en base64 (format Resend)
export interface Message { to: string[]; subject: string; html: string; attachments?: PieceJointe[]; replyTo?: string }
export interface Resultat { ok: boolean; via: "gmail" | "resend" | "aucun"; id?: string; skipped?: boolean; error?: string }

const GMAIL_USER = Deno.env.get("GMAIL_USER") || "";
const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD") || "";
const GMAIL_FROM = Deno.env.get("GMAIL_FROM") || `Flowin Event <${GMAIL_USER || "flowinevent@gmail.com"}>`;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") || "Flowin <onboarding@resend.dev>";
const SUPA_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export const PLAFOND_JOUR = 450;
const PAUSE_MS = 400;

export function canal(): "gmail" | "resend" | "aucun" {
  if (GMAIL_USER && GMAIL_PASS) return "gmail";
  if (RESEND_API_KEY) return "resend";
  return "aucun";
}

// deno-lint-ignore no-explicit-any
let transport: any = null;
function smtp() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS.replace(/\s+/g, "") }, // Google affiche le mot de passe par blocs de 4
      connectionTimeout: 15000, greetingTimeout: 10000, socketTimeout: 20000,
    });
  }
  return transport;
}

let memJour = "", memN = 0, dernier = 0;
function jourParis(): string { return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }); }

/** Réserve n envois du jour. true = autorisé. */
async function reserver(n: number): Promise<boolean> {
  if (SUPA_URL && SERVICE) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/rpc/emails_reserver`, {
        method: "POST",
        headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_n: n, p_max: PLAFOND_JOUR }),
      });
      if (r.ok) return Number(await r.json()) >= 0;
      console.warn(`[mailer] compteur SQL indisponible (${r.status}), compteur mémoire`);
    } catch (e) { console.warn("[mailer] compteur SQL en erreur, compteur mémoire", String(e)); }
  }
  const j = jourParis();
  if (j !== memJour) { memJour = j; memN = 0; }
  if (memN + n > PLAFOND_JOUR) return false;
  memN += n; return true;
}

async function viaGmail(m: Message): Promise<Resultat> {
  if (!(await reserver(m.to.length))) {
    console.warn(`[mailer] plafond Gmail ${PLAFOND_JOUR}/jour atteint, envoi sauté : ${m.subject} -> ${m.to.join(",")}`);
    return { ok: false, via: "gmail", skipped: true, error: "plafond_jour" };
  }
  const attente = dernier + PAUSE_MS - Date.now();
  if (attente > 0) await new Promise((r) => setTimeout(r, attente));
  dernier = Date.now();
  try {
    const info = await smtp().sendMail({
      from: GMAIL_FROM, to: m.to.join(", "), subject: m.subject, html: m.html, replyTo: m.replyTo || undefined,
      attachments: (m.attachments || []).map((a) => ({ filename: a.filename, content: a.content, encoding: "base64" })),
    });
    console.log(`[mailer] gmail ok ${info.messageId} : ${m.subject}`);
    return { ok: true, via: "gmail", id: String(info.messageId || "") };
  } catch (e) {
    console.error(`[mailer] gmail erreur : ${m.subject}`, String(e));
    return { ok: false, via: "gmail", error: String(e).slice(0, 300) };
  }
}

async function viaResend(m: Message): Promise<Resultat> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: NOTIFY_FROM, to: m.to, subject: m.subject, html: m.html, reply_to: m.replyTo || undefined, attachments: m.attachments && m.attachments.length ? m.attachments : undefined }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { console.error(`[mailer] resend ${res.status}`, JSON.stringify(j).slice(0, 200)); return { ok: false, via: "resend", error: `resend ${res.status} ${JSON.stringify(j).slice(0, 200)}` }; }
    return { ok: true, via: "resend", id: String((j as { id?: string }).id ?? "") };
  } catch (e) {
    console.error("[mailer] resend erreur", String(e));
    return { ok: false, via: "resend", error: String(e).slice(0, 300) };
  }
}

/** Envoie un email par le canal disponible. Ne lève jamais d'exception. */
export async function envoyerEmail(m: Message): Promise<Resultat> {
  const c = canal();
  if (c === "gmail") return await viaGmail(m);
  if (c === "resend") return await viaResend(m);
  console.warn(`[mailer] aucun canal configuré, non envoyé : ${m.subject}`);
  return { ok: false, via: "aucun", skipped: true, error: "aucun canal" };
}
