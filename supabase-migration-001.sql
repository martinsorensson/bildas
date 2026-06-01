-- ============================================================
-- Migration 001
-- 1. Lägg till 'pending' och 'admin' i profiles.role
-- 2. RLS: admin kan läsa alla profiler
-- 3. RLS: lärare kan läsa inlämningar kopplade till sina uppgifter
-- 4. Skapa storage-bucket 'bilder' med RLS-policies
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Utöka role-constraint på profiles
-- ----------------------------------------------------------------
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('larare', 'elev', 'pending', 'admin'));


-- ----------------------------------------------------------------
-- 2. RLS: admin kan läsa alla profiler
-- ----------------------------------------------------------------
CREATE POLICY "Admin kan läsa alla profiler" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ----------------------------------------------------------------
-- 3. RLS: lärare kan läsa inlämningar kopplade till sina uppgifter
-- ----------------------------------------------------------------
CREATE POLICY "Larare kan läsa inlamningar for sina uppgifter" ON inlamningar
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM uppgifter u
      WHERE u.id = inlamningar.uppgift_id
        AND u.larare_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- 4. Storage bucket 'bilder'
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('bilder', 'bilder', true)
ON CONFLICT (id) DO NOTHING;

-- Inloggade användare får ladda upp i bucket 'bilder'
CREATE POLICY "Autentiserade kan ladda upp bilder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bilder'
    AND auth.role() = 'authenticated'
  );

-- Alla (även anonym) kan läsa/visa bilder (publika URL:er)
CREATE POLICY "Publikt läsbart bilder-bucket" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'bilder');

-- Användare kan ta bort sina egna uppladdade filer
-- Filsökväg: {uppgift_id}/{user_id}/{timestamp}.{ext}
CREATE POLICY "Ägare kan ta bort sina bilder" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'bilder'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
