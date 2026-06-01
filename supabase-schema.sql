-- Användare/profiler
create table profiles (
  id uuid references auth.users on delete cascade,
  role text check (role in ('larare', 'elev', 'pending', 'admin')),
  namn text,
  email text,
  primary key (id)
);

-- Uppgifter som läraren skapar
create table uppgifter (
  id uuid default gen_random_uuid() primary key,
  larare_id uuid references profiles(id),
  titel text not null,
  beskrivning text,
  bedomningsparametrar text[],
  kurs_id   uuid references kurser(id) on delete set null,
  skapad_at timestamptz default now()
);

-- Storage bucket för bilduppladdningar
-- Skapas via: INSERT INTO storage.buckets (id, name, public) VALUES ('bilder', 'bilder', true)
-- Se supabase-migration-001.sql för fullständig setup inkl. RLS-policies.

-- Kurser som läraren skapar
create table kurser (
  id          uuid default gen_random_uuid() primary key,
  larare_id   uuid references profiles(id) on delete cascade not null,
  namn        text not null,
  kod         text not null unique,
  skapad_at   timestamptz default now()
);

-- Koppling elev ↔ kurs
create table kurs_elever (
  id          uuid default gen_random_uuid() primary key,
  kurs_id     uuid references kurser(id) on delete cascade not null,
  elev_id     uuid references profiles(id) on delete cascade not null,
  joined_at   timestamptz default now(),
  unique (kurs_id, elev_id)
);

-- Elevernas inlämningar
create table inlamningar (
  id uuid default gen_random_uuid() primary key,
  uppgift_id uuid references uppgifter(id),
  elev_id uuid references profiles(id),
  bild_url text,
  feedback_utkast text,
  feedback_godkand text,
  status text default 'inkommen' check (status in ('inkommen', 'feedback_genererad', 'feedback_godkand')),
  skapad_at timestamptz default now()
);
