-- Aktivera RLS
alter table profiles enable row level security;
alter table uppgifter enable row level security;
alter table inlamningar enable row level security;

-- Profiler: användare kan läsa och skriva sin egen profil
create policy "Users can manage own profile" on profiles
  for all using (auth.uid() = id);

-- Uppgifter: lärare kan skapa och se sina egna
create policy "Larare can manage own uppgifter" on uppgifter
  for all using (auth.uid() = larare_id);

-- Inlämningar: elever kan skapa, lärare kan se sina
create policy "Users can manage own inlamningar" on inlamningar
  for all using (auth.uid() = elev_id);
