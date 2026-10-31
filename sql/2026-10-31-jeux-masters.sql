-- MASTERS DE JEUX (31/10/2026) — valeurs par defaut des gabarits, modifiables
-- par le Super Admin (ecran « Masters de jeux » de dashboard.html).
--
-- A APPLIQUER A LA MAIN (non applique par l'agent). Tant que la table n'existe
-- pas, le code tombe proprement en mode degrade : les valeurs du code
-- (admin/lib/masters/defs.ts) s'appliquent, et l'ecran SA affiche
-- « table absente : enregistrement indisponible ».
--
-- Regle (a confirmer par Romain) : modifier un master met a jour toutes les
-- animations qui l'utilisent, SAUF les champs que l'animation a personnalises
-- (events.cfg.master.perso). Aucune donnee n'est copiee dans les events :
-- la fusion se fait a l'affichage (admin/lib/masters/resolve.ts).
--
-- Cote events : AUCUNE colonne nouvelle. Une animation sur master porte
--   cfg.master = { "id": "quiz|quizsolo|spin|tombola|vote", "perso": { ... } }
--   cfg.achat  = { "obligatoire": true|false, "montantMin": "10 €" }

create table if not exists public.jeux_masters (
  id          text primary key check (id in ('quiz','quizsolo','spin','tombola','vote','super')),
  nom         text not null,
  defauts     jsonb not null default '{}'::jsonb,   -- meme forme que ContenuMaster (lib/masters/types.ts)
  version     integer not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

comment on table public.jeux_masters is
  'Masters de jeux (31/10/2026) : surcharges SA des valeurs par defaut des gabarits. Vide = valeurs du code.';

alter table public.jeux_masters enable row level security;

-- Meme regle que les autres tables du projet (cf. 2026-08-31-event-modeles.sql) :
-- pas de session Supabase Auth cote dashboard, tout passe par la cle anon.
drop policy if exists flowin_anon_all_jeux_masters on public.jeux_masters;
create policy flowin_anon_all_jeux_masters
  on public.jeux_masters for all to public
  using (true) with check (true);

-- Une ligne par master (defauts vides = valeurs du code).
insert into public.jeux_masters (id, nom) values
  ('quiz','Quiz + bonus'), ('quizsolo','Quiz solo'), ('spin','Roue'),
  ('tombola','Tombola'), ('vote','Vote'), ('super','Super event')
on conflict (id) do nothing;
