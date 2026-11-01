// supabase/functions/send-resultat-tirage/index.ts
//
// NON DEPLOYEE (01/11/2026). A deployer a la main apres validation de Romain :
//   supabase functions deploy send-resultat-tirage
//
// MESSAGE DE SERVICE : « le tirage a eu lieu, tu n'as pas ete tire ». Envoye aux
// participants d'un tirage qui n'ont pas gagne ET qui ont une adresse e-mail.
// Ton sobre, aucune promotion commerciale : il informe du resultat d'une
// participation que la personne a elle-meme faite. Lien vers l'application.
// (Les gagnants recoivent leur billet par send-ticket-gagnant, inchange.)
//
// Declenchement : sql/08-resultats-tirage.sql (_notifier_resultats_tirage, pg_net)
// a la fin d'un tirage, manuel comme programme.
//
// REGLAGE DU COMMERCE : events.cfg.tirage.notifierPerdants (defaut oui). Si
// false, la fonction ne fait rien (le SQL n'appelle meme pas la fonction).
//
// IDEMPOTENCE : un seul envoi par participant et par tirage. Chaque ligne de
// tirage_resultats est RESERVEE (notifie_le) AVANT l'envoi, en une seule requete
// conditionnelle (notifie_le is null) : deux appels en parallele ne reservent
// jamais la meme ligne. Si l'envoi echoue, la reservation est levee pour un
// nouvel essai. Un rejeu complet n'envoie donc rien de plus.
//
// SECRETS : RESEND_API_KEY (deja configure) ; SUPABASE_URL et
// SUPABASE_SERVICE_ROLE_KEY (fournis par Supabase aux fonctions edge).
// Optionnels : NOTIFY_FROM_ADDR, NOTIFY_FROM_NAME, NOTIFY_TO, SITE_ORIGIN.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const NOTIFY_FROM_ADDR = Deno.env.get("NOTIFY_FROM_ADDR") || "onboarding@resend.dev";
const NOTIFY_FROM_NAME = Deno.env.get("NOTIFY_FROM_NAME") || "Flowin";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "flowinevent@gmail.com";
const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") || "https://flowin-events.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const emailValide = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const txt = await res.text();
  let data: unknown = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  return { ok: res.ok, status: res.status, data };
}

/** Texte du message (tutoiement, sobre). */
export function texteResultat(p: { prenom: string; commerce: string; animation: string; dateTirage: string; tickets: number; lien: string }): string {
  const lignes = [
    p.prenom ? `Bonjour ${p.prenom},` : "Bonjour,",
    "",
    `Le tirage de « ${p.animation} » chez ${p.commerce} a eu lieu${p.dateTirage ? " le " + p.dateTirage : ""}.`,
    `Tu y participais avec ${p.tickets} ticket${p.tickets > 1 ? "s" : ""}.`,
    "",
    "Malheureusement, tu n'as pas été tiré. Reste attentif : d'autres tirages sont en cours et d'autres animations aussi.",
    "",
    "Tu peux les retrouver dans l'application :",
    p.lien,
    "",
    "Ce message t'informe du résultat d'une participation que tu as faite avec cette adresse e-mail. Ce n'est pas une offre commerciale.",
    "",
    "Flowin",
  ];
  return lignes.join("\n");
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalid json" }, 400); }

  const eventId = String(body.event_id || "").trim();
  const superId = String(body.super_event_id || "").trim();
  const ref = String(body.tirage_ref || "").trim();
  if ((!eventId && !superId) || !ref) return json({ ok: false, error: "event_id (ou super_event_id) et tirage_ref requis" }, 422);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "configuration serveur absente (SUPABASE_URL / SERVICE_ROLE)" }, 200);
  if (!RESEND_API_KEY) return json({ ok: false, error: "RESEND_API_KEY absent (configuration serveur)" }, 200);

  // Reglage du commerce : cfg.tirage.notifierPerdants (defaut oui).
  let commerce = "", animation = "";
  if (eventId) {
    const ev = await rest(`events?id=eq.${encodeURIComponent(eventId)}&select=nom,cfg,pro_id&limit=1`);
    const row = ((ev.data as Array<Record<string, any>>) || [])[0];
    if (!row) return json({ ok: false, error: "animation introuvable" }, 200);
    if (row.cfg?.tirage?.notifierPerdants === false) return json({ ok: true, skipped: "notifierPerdants=false", envoyes: 0 });
    animation = row.cfg?.front?.titre || row.nom || "l'animation";
    commerce = animation;
    if (row.pro_id) {
      const pr = await rest(`pros?id=eq.${encodeURIComponent(row.pro_id)}&select=nom&limit=1`);
      const p0 = ((pr.data as Array<Record<string, any>>) || [])[0];
      if (p0?.nom) commerce = p0.nom;
    }
  } else {
    const se = await rest(`super_events?id=eq.${encodeURIComponent(superId)}&select=nom&limit=1`);
    animation = ((se.data as Array<Record<string, any>>) || [])[0]?.nom || "le super event";
    commerce = animation;
  }

  // RESERVATION atomique des lignes « perdu » pas encore notifiees.
  const filtre = (eventId ? `event_id=eq.${encodeURIComponent(eventId)}` : `super_event_id=eq.${encodeURIComponent(superId)}`)
    + `&tirage_ref=eq.${encodeURIComponent(ref)}&statut=eq.perdu&notifie_le=is.null`;
  const reserve = await rest(`tirage_resultats?${filtre}&select=id,joueur_id,tickets,tirage_le`, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ notifie_le: new Date().toISOString() }),
  });
  const lignes = (reserve.data as Array<{ id: string; joueur_id: string; tickets: number; tirage_le: string }>) || [];
  if (!reserve.ok || !lignes.length) return json({ ok: true, envoyes: 0, a_notifier: 0 });

  const ids = lignes.map((l) => l.joueur_id);
  const js = await rest(`joueurs?id=in.(${ids.join(",")})&select=id,prenom,email`);
  const joueurs = new Map(((js.data as Array<{ id: string; prenom: string | null; email: string | null }>) || []).map((j) => [j.id, j]));

  const from = `${NOTIFY_FROM_NAME} <${NOTIFY_FROM_ADDR}>`;
  const lien = SITE_ORIGIN + "/jouer?" + (eventId ? "ev=" + encodeURIComponent(eventId) + "&s=c-profil" : "se=" + encodeURIComponent(superId));
  let envoyes = 0, sansEmail = 0, echecs = 0;
  for (const l of lignes) {
    const j = joueurs.get(l.joueur_id);
    const email = String(j?.email || "").trim();
    if (!email || !emailValide(email)) { sansEmail++; continue; }   // reste « notifie » : rien a envoyer
    const dateTirage = l.tirage_le ? new Date(l.tirage_le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
    const text = texteResultat({ prenom: String(j?.prenom || "").trim(), commerce, animation, dateTirage, tickets: l.tickets || 1, lien });
    const html = "<pre style=\"font-family:-apple-system,Segoe UI,Roboto,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1B3A5C\">"
      + esc(text).replace(esc(lien), `<a href="${esc(lien)}">${esc(lien)}</a>`) + "</pre>";
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], reply_to: NOTIFY_TO, subject: `Résultat du tirage — ${commerce}`, html, text }),
    });
    if (r.ok) envoyes++;
    else {
      echecs++;
      // Envoi raté : on leve la reservation pour permettre un nouvel essai.
      await rest(`tirage_resultats?id=eq.${l.id}`, { method: "PATCH", body: JSON.stringify({ notifie_le: null }) });
    }
  }
  return json({ ok: true, a_notifier: lignes.length, envoyes, sans_email: sansEmail, echecs });
});
