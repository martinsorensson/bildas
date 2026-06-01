-- ============================================================
-- Migration 002
-- Fixa rekursiv admin-policy på profiles
--
-- Problemet: policyn körde SELECT på profiles inne i en policy
-- på profiles → oändlig rekursion → tyst fel, tom data.
--
-- Lösningen: SECURITY DEFINER-funktion kör utan RLS och bryter
-- rekursionen.
-- ============================================================

-- Steg 1: Ta bort den trasiga policyn
DROP POLICY IF EXISTS "Admin kan läsa alla profiler" ON profiles;

-- Steg 2: Skapa en SECURITY DEFINER-funktion
-- Den körs med ägarens rättigheter (utan RLS) och kan därför
-- läsa profiles-tabellen utan att trigga policyn igen.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Steg 3: Återskapa policyn med funktionen
CREATE POLICY "Admin kan läsa alla profiler" ON profiles
  FOR SELECT
  USING (is_admin());
