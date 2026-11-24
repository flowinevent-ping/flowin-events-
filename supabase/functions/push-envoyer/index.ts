// supabase/functions/push-envoyer/index.ts
//
// RAPPELS WEB PUSH DU JOUEUR (24/11/2026). NON DÉPLOYÉE. Prérequis : sql/2026-11-24-push-abonnements.sql appliquée.
// Trois usages, un par « mode » (corps JSON {"mode": ...}) :
//   gain       : lot prêt (billet gagnant créé il y a 2 min à 24 h, non retiré).
//   rappel     : rappel d'expiration 1 mois / 15 jours / 48 h (notifications créées par tickets_rappels_du_jour).
//   lendemain  : « reviens jouer » à un joueur qui a joué hier et pas encore aujourd'hui.
// Garde-fous : appel réservé au cron (en-tête x-flowin-cron vérifié par la RPC rappel_cron_verifier, comme
// rappel-tickets) ; aucun destinataire pris dans la requête (tout vient de la base) ; 2 messages par joueur et par
// jour au plus (RPC) ; jamais deux fois le même message (push_envois) ; silence de 21 h à 8 h (heure de Paris) ;
// 200 messages par appel. {"dry": true} compte sans rien envoyer. Aucun e-mail, aucun SMS.
//
// Secrets (aucune valeur ici) : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (à poser dans les secrets Supabase par Romain),
// VAPID_SUBJECT (optionnel ; sinon mailto: GMAIL_USER, sinon l'adresse du site). SUPABASE_URL et
// SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase. GMAIL_USER et SITE_ORIGIN : déjà existants.
// Déploiement (une fois relu, sur ordre de Romain) : supabase functions deploy push-envoyer --no-verify-jwt
// Planification (sur ordre) : pg_cron + net.http_post avec x-flowin-cron, comme tickets-rappels.

import webpush from "npm:web-push@3.6.7";

const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") || "https://flowin-events.vercel.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const GMAIL_USER = Deno.env.get("GMAIL_USER") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || (GMAIL_USER ? `mailto:${GMAIL_USER}` : SITE_ORIGIN);
const LIMITE = 200;

type Mode = "gain" | "rappel" | "lendemain";
interface Ligne { abo_id: string; joueur_id: string; endpoint: string; p256dh: string; auth: string; ref: string; detail: string }

function json(b: unknown, status = 200): Response {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
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
async function cronAutorise(req: Request): Promise<boolean> {
  const recu = req.headers.get("x-flowin-cron") || "";
  if (!recu) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/rappel_cron_verifier`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: recu }),
    });
    return r.ok && (await r.json().catch(() => false)) === true;
  } catch { return false; }
}
function heureParis(): number {
  return Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Paris" }).format(new Date()));
}

// Textes courts, tutoiement, sans emoji ; jamais le mot « tirage » (gain immédiat).
function texte(mode: Mode, detail: string): { titre: string; corps: string; tag: string } {
  if (mode === "gain") {
    return { titre: "Ton lot est prêt", corps: detail ? `${detail} : montre ton billet en caisse.` : "Montre ton billet en caisse.", tag: "flowin-gain" };
  }
  if (mode === "rappel") {
    const [palier, lot] = detail.split("|");
    const delai = palier === "48h" ? "dans 2 jours" : palier === "15j" ? "dans 15 jours" : "dans 1 mois";
    return { titre: `Ton lot expire ${delai}`, corps: lot ? `${lot} : pense à l'utiliser ou à l'offrir à un ami.` : "Pense à l'utiliser ou à l'offrir à un ami.", tag: "flowin-rappel" };
  }
  return { titre: "Une partie t'attend", corps: "Rejoue aujourd'hui : une partie par jour et par commerce.", tag: "flowin-lendemain" };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "configuration" }, 500);
  if (!(await cronAutorise(req))) { console.warn("push-envoyer : appel refuse (en-tete x-flowin-cron absent ou invalide)"); return json({ ok: false, error: "interdit" }, 403); }

  const corps = await req.json().catch(() => ({})) as { mode?: string; dry?: boolean };
  const mode = corps.mode as Mode;
  if (mode !== "gain" && mode !== "rappel" && mode !== "lendemain") return json({ ok: false, error: "mode" }, 400);
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ ok: false, error: "cles VAPID absentes" }, 409);

  const h = heureParis();
  if (h < 8 || h >= 21) return json({ ok: true, mode, silence: true, envoyes: 0 });

  let lignes: Ligne[] = [];
  try { lignes = ((await rpc("push_a_envoyer", { p_type: mode, p_limite: LIMITE })) || []) as Ligne[]; }
  catch (e) { return json({ ok: false, error: String(e) }, 500); }
  if (corps.dry === true) return json({ ok: true, mode, dry: true, a_envoyer: lignes.length });

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  let envoyes = 0, morts = 0, erreurs = 0;
  const marques = new Set<string>();
  for (const l of lignes) {
    const t = texte(mode, l.detail || "");
    try {
      await webpush.sendNotification(
        { endpoint: l.endpoint, keys: { p256dh: l.p256dh, auth: l.auth } },
        JSON.stringify({ titre: t.titre, corps: t.corps, tag: t.tag, url: "/moi" }),
        { TTL: 6 * 3600, urgency: "normal" },
      );
      envoyes++;
      const cle = `${l.joueur_id}|${l.ref}`;
      if (!marques.has(cle)) { marques.add(cle); await rpc("push_marquer", { p_type: mode, p_ref: l.ref, p_joueur_id: l.joueur_id }); }
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { morts++; await rpc("push_desactiver", { p_abo_id: l.abo_id }).catch(() => {}); }
      else { erreurs++; console.warn("push-envoyer : echec", code || "?"); }
    }
  }
  return json({ ok: true, mode, envoyes, abonnements_morts: morts, erreurs });
});
