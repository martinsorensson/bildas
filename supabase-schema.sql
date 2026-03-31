-- Användare/profiler
create table profiles (
  id uuid references auth.users on delete cascade,
  role text check (role in ('larare', 'elev')),
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
  skapad_at timestamptz default now()
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
