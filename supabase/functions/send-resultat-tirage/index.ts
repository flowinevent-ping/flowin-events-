// supabase/functions/send-resultat-tirage/index.ts
//
// NEUTRALISEE le 20/11/2026 (regle de Romain : aucun email aux participants hors relances).
// Le resultat d'un tirage (« Pas de lot cette fois ») est desormais un message dans l'application :
// notification palier 'resultat', ecrite par la base (sql/2026-11-20-resultats-tirage-inapp.sql,
// _notifier_resultats_tirage) et lue par mes_notifications dans /moi.
//
// Cette fonction n'est PAS deployee en production et ne doit pas l'etre. Elle est gardee uniquement parce que
// sql/10-resultats-tirage.sql la reference dans son historique : si un jour elle est appelee, elle repond
// ok sans rien envoyer a personne (aucun import de mailer, aucun secret, aucun acces base).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req: Request): Response => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  return new Response(
    JSON.stringify({ ok: true, envoyes: 0, info: "no-op : resultat de tirage dans l'application, aucun email" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
