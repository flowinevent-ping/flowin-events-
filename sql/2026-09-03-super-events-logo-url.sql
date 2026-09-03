-- Le logo de l'operation, affiche en tete du parcours joueur.
-- Additif : colonne nullable, aucune ligne existante n'est touchee, et le
-- parcours retombe sur son comportement actuel quand elle est vide.
alter table public.super_events add column if not exists logo_url text;

comment on column public.super_events.logo_url is
  'URL du logo de l''operation, affiche dans le bandeau d''accueil du parcours joueur (gabarit Quiz + bonus). Vide = emplacement laisse libre.';
