-- ============================================================
-- Migration 003
-- Kurssystem: tabellerna 'kurser' och 'kurs_elever' med RLS
-- ============================================================

-- ----------------------------------------------------------------
-- Tabeller
-- ----------------------------------------------------------------

create table kurser (
  id          uuid default gen_random_uuid() primary key,
  larare_id   uuid references profiles(id) on delete cascade not null,
  namn        text not null,
  kod         text not null unique,
  skapad_at   timestamptz default now()
);

create table kurs_elever (
  id          uuid default gen_random_uuid() primary key,
  kurs_id     uuid references kurser(id) on delete cascade not null,
  elev_id     uuid references profiles(id) on delete cascade not null,
  joined_at   timestamptz default now(),
  unique (kurs_id, elev_id)
);

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------

alter table kurser enable row level security;
alter table kurs_elever enable row level security;

-- Lärare kan skapa och hantera sina egna kurser
create policy "Larare kan hantera egna kurser" on kurser
  for all
  using (auth.uid() = larare_id)
  with check (auth.uid() = larare_id);

-- Alla inloggade elever kan söka upp en kurs via kod (SELECT)
-- Behövs för att eleven ska kunna hitta kursen innan de joinat.
create policy "Elever kan söka kurs via kod" on kurser
  for select
  using (auth.role() = 'authenticated');

-- Elever kan se kurser de är inskrivna i
create policy "Elever kan se sina kurser" on kurs_elever
  for select
  using (auth.uid() = elev_id);

-- Elever kan joina en kurs (INSERT av egen rad)
create policy "Elever kan joina kurs" on kurs_elever
  for insert
  with check (auth.uid() = elev_id);

-- Elever kan lämna en kurs (DELETE av egen rad)
create policy "Elever kan lämna kurs" on kurs_elever
  for delete
  using (auth.uid() = elev_id);

-- Lärare kan se vilka elever som är inskrivna i sina kurser
create policy "Larare kan se elever i sina kurser" on kurs_elever
  for select
  using (
    exists (
      select 1 from kurser k
      where k.id = kurs_elever.kurs_id
        and k.larare_id = auth.uid()
    )
  );
