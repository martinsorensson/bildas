-- Aktivera RLS
alter table profiles enable row level security;
alter table uppgifter enable row level security;
alter table inlamningar enable row level security;

-- Profiler: användare kan läsa och skriva sin egen profil
create policy "Users can manage own profile" on profiles
  for all using (auth.uid() = id);

-- Profiler: admin kan läsa alla profiler
-- Använder SECURITY DEFINER-funktion för att undvika rekursion.
-- Kör: CREATE FUNCTION public.is_admin() ... SECURITY DEFINER
-- Se supabase-migration-002.sql för fullständig definition.
create policy "Admin kan läsa alla profiler" on profiles
  for select using (is_admin());

-- Uppgifter: lärare kan skapa och se sina egna
create policy "Larare can manage own uppgifter" on uppgifter
  for all using (auth.uid() = larare_id);

-- Kurser: lärare kan hantera sina egna
create policy "Larare kan hantera egna kurser" on kurser
  for all using (auth.uid() = larare_id) with check (auth.uid() = larare_id);

-- Kurser: alla inloggade kan söka via kod
create policy "Elever kan söka kurs via kod" on kurser
  for select using (auth.role() = 'authenticated');

-- Kurs_elever: elever kan se, joina och lämna
create policy "Elever kan se sina kurser" on kurs_elever
  for select using (auth.uid() = elev_id);
create policy "Elever kan joina kurs" on kurs_elever
  for insert with check (auth.uid() = elev_id);
create policy "Elever kan lämna kurs" on kurs_elever
  for delete using (auth.uid() = elev_id);

-- Kurs_elever: lärare kan se elever i sina kurser
create policy "Larare kan se elever i sina kurser" on kurs_elever
  for select using (
    exists (select 1 from kurser k where k.id = kurs_elever.kurs_id and k.larare_id = auth.uid())
  );

-- Uppgifter: elever kan se uppgifter för kurser de är med i
create policy "Elever kan se uppgifter i sina kurser" on uppgifter
  for select using (
    kurs_id is not null and
    exists (
      select 1 from kurs_elever ke
      where ke.kurs_id = uppgifter.kurs_id and ke.elev_id = auth.uid()
    )
  );

-- Inlämningar: elever kan skapa och se sina egna
create policy "Users can manage own inlamningar" on inlamningar
  for all using (auth.uid() = elev_id);

-- Inlämningar: lärare kan läsa inlämningar kopplade till sina uppgifter
create policy "Larare kan läsa inlamningar for sina uppgifter" on inlamningar
  for select using (
    exists (
      select 1 from uppgifter u
      where u.id = inlamningar.uppgift_id
        and u.larare_id = auth.uid()
    )
  );

-- Inlämningar: lärare kan uppdatera (t.ex. feedback_utkast, status) på sina uppgifters inlämningar
create policy "Larare kan uppdatera inlamningar for sina uppgifter" on inlamningar
  for update using (
    exists (
      select 1 from uppgifter u
      where u.id = inlamningar.uppgift_id
        and u.larare_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from uppgifter u
      where u.id = inlamningar.uppgift_id
        and u.larare_id = auth.uid()
    )
  );
