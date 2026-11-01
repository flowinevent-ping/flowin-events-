-- SUPPLEMENT DE TEST : colonnes qui existent en prod (lues dans le code) mais dont le DDL n'est pas dans sql/.
alter table public.pros add column if not exists auth_id uuid;
-- La prod connait aussi les statuts pending / draft / archived (lus par lib/etatAnimation.ts).
alter table public.events drop constraint if exists events_status_check;
alter table public.events add column if not exists lat double precision;
alter table public.events add column if not exists lng double precision;
alter table public.participations add column if not exists source_qr text;
alter table public.participations add column if not exists created_at timestamptz not null default now();
alter table public.participations add column if not exists played_date date default current_date;
alter table public.participations add column if not exists tickets int default 1;
create table if not exists public.visites (
  id uuid primary key default gen_random_uuid(),
  event_id text, source text, etape text, created_at timestamptz not null default now()
);

-- En prod l'espace pro et le dashboard ecrivent avec la cle publique : on reproduit ce regime (RLS permissive).
do $$ declare t text; p record; begin
  /* Les politiques d'exemple du depot (profiles) se rappellent en boucle : on les retire, comme la prod les a remplacees. */
  for p in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
  foreach t in array array['events','participations','pros','joueurs','lots','partenaires'] loop
    execute format('drop policy if exists test_permissif on public.%I', t);
    execute format('create policy test_permissif on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
