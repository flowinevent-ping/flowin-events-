-- 19/09/2026 — Accès public en lecture seule à UN bon de commande / UNE
-- facture, par jeton, sans session admin.
-- APPLIQUÉ EN PROD le 19/09/2026 (projet flowin-events, ywcqtupgoxfzkddqkztk)
-- via Supabase MCP -- confirmé : 0 bon/facture sans jeton, les deux RPC
-- existent. Le code (ListeFactures.tsx + gate facture-nds.html/
-- bon-commande-nds.html) était déjà en prod et attendait cette migration ;
-- il est désormais actif de bout en bout.
--
-- CE QUE ROMAIN A REPÉRÉ (19/09) : « la facture est modifiable et renvoie
-- vers accès SA ». Diagnostic réel après lecture du code (pas une supposition) :
-- ce n'est PAS un problème d'édition (la lecture seule ajoutée le 18/09
-- fonctionne : verrouillerLecture() retire les droits d'écriture sur les
-- champs). Le vrai bug est AVANT ça : facture-nds.html ET bon-commande-nds.html
-- ont, tout en haut, une garde INCONDITIONNELLE --
--   if(!_S||!_S.access_token){ location.replace('/admin-connexion.html?...'); }
-- -- qui redirige TOUT visiteur sans session admin vers la connexion SA,
-- AVANT même d'atteindre la version lecture seule. Un vrai pro (ou n'importe
-- qui sans session SA active dans son navigateur) ne voit donc JAMAIS le bon
-- ni la facture : il atterrit sur un écran de connexion SA. D'où « pas de bon
-- de commande » et « renvoie vers accès SA » -- Romain, testant depuis un
-- navigateur où IL a une session SA active, ne reproduit pas ce symptôme lui-même
-- mais l'a bien identifié comme bloquant pour un vrai pro.
--
-- SOLUTION : même principe déjà utilisé et éprouvé dans ce projet pour les
-- billets de gagnants (tirages.retrait_token + RPC consulter_lot(token),
-- SECURITY DEFINER, sans session) -- un jeton aléatoire par document, une RPC
-- dédiée qui contourne la RLS UNIQUEMENT pour ce document précis, sans jamais
-- ouvrir les tables bons_commande/factures en lecture publique générale.

alter table bons_commande add column if not exists jeton_public text default encode(gen_random_bytes(16), 'hex');
update bons_commande set jeton_public = encode(gen_random_bytes(16), 'hex') where jeton_public is null;
alter table bons_commande alter column jeton_public set not null;

alter table factures add column if not exists jeton_public text default encode(gen_random_bytes(16), 'hex');
update factures set jeton_public = encode(gen_random_bytes(16), 'hex') where jeton_public is null;
alter table factures alter column jeton_public set not null;

create or replace function public.bon_commande_public(p_id text, p_jeton text)
 returns setof bons_commande
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select * from bons_commande where id = p_id and jeton_public = p_jeton
$function$;

create or replace function public.facture_publique(p_numero text, p_jeton text)
 returns setof factures
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select * from factures where numero = p_numero and jeton_public = p_jeton
$function$;

-- PUBLIC obligatoire : ce projet tourne sur la clé anon, sans session Supabase
-- Auth (même raison que documentée dans sql/2026-09-02-crm-participants.sql).
grant execute on function public.bon_commande_public(text, text) to public, anon, authenticated, service_role;
grant execute on function public.facture_publique(text, text) to public, anon, authenticated, service_role;
