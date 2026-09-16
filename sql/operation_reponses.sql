-- LOT 5 — referentiel 23 : reponses aux questions, par question ET par participant,
-- pour une operation (ses stations).
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- Source : se_reponses (ecrite par tous les jeux, lib/parcours.ts writeSeReponses) :
--   quiz_reponses  = [{qid, texte, reponse, correct, ...}]
--   bonus_reponses = {cle: valeur | [valeurs]}
-- p_events : les stations de l operation (bornees au pro par l appelant).
-- Participants : les 300 plus recents (detail dans le bloc, export complet par le CRM).

create or replace function public.operation_reponses(p_events text[])
returns jsonb
language sql stable security definer
set search_path to 'public'
as $function$
with r as (
  select * from se_reponses where event_id = any(p_events)
),
q as (
  select coalesce(x->>'qid', x->>'texte') qid, max(x->>'texte') texte,
         count(*) n, count(*) filter (where (x->>'correct')::boolean) justes
    from r cross join lateral jsonb_array_elements(case when jsonb_typeof(r.quiz_reponses) = 'array' then r.quiz_reponses else '[]'::jsonb end) x
   group by 1
),
b as (
  select kv.key cle, coalesce(v.val, kv.value #>> '{}') valeur, count(*) n
    from r
    cross join lateral jsonb_each(case when jsonb_typeof(r.bonus_reponses) = 'object' then r.bonus_reponses else '{}'::jsonb end) kv
    left join lateral (select e #>> '{}' val from jsonb_array_elements(case when jsonb_typeof(kv.value) = 'array' then kv.value else '[]'::jsonb end) e) v on true
   where coalesce(v.val, kv.value #>> '{}') is not null and coalesce(v.val, kv.value #>> '{}') <> ''
   group by 1, 2
),
p as (
  select r.ts, r.event_id, r.score, r.quiz_reponses, r.bonus_reponses,
         coalesce(nullif(btrim(coalesce(j.prenom, '') || ' ' || coalesce(j.nom, '')), ''), j.email, '—') joueur
    from r left join joueurs j on j.id = r.joueur_id
   order by r.ts desc nulls last
   limit 300
)
select jsonb_build_object(
  'total', (select count(*) from r),
  'questions', coalesce((select jsonb_agg(jsonb_build_object('qid', qid, 'texte', texte, 'reponses', n, 'justes', justes)
                                          order by n desc, texte) from q), '[]'::jsonb),
  'bonus', coalesce((select jsonb_agg(jsonb_build_object('cle', cle, 'valeurs', vals) order by cle)
                       from (select cle, jsonb_agg(jsonb_build_object('valeur', valeur, 'n', n) order by n desc) vals
                               from b group by cle) bb), '[]'::jsonb),
  'participants', coalesce((select jsonb_agg(jsonb_build_object(
                     'joueur', joueur, 'ts', ts, 'event_id', event_id, 'score', score,
                     'quiz', case when jsonb_typeof(quiz_reponses) = 'array' then quiz_reponses else '[]'::jsonb end,
                     'bonus', case when jsonb_typeof(bonus_reponses) = 'object' then bonus_reponses else '{}'::jsonb end)
                     order by ts desc nulls last) from p), '[]'::jsonb)
);
$function$;
grant execute on function public.operation_reponses(text[]) to public, anon, authenticated;

notify pgrst, 'reload schema';
