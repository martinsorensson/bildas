-- ============================================================
-- Migration 007
-- 1. Lägg till feedback_utkast på inlamningar (om saknas)
-- 2. RLS: lärare kan uppdatera feedback_utkast och status
--    på inlämningar kopplade till sina uppgifter
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Kolumn feedback_utkast
-- ----------------------------------------------------------------
ALTER TABLE inlamningar
  ADD COLUMN IF NOT EXISTS feedback_utkast text;


-- ----------------------------------------------------------------
-- 2. RLS: lärare kan UPDATE på inlämningar för sina uppgifter
-- ----------------------------------------------------------------
CREATE POLICY "Larare kan uppdatera inlamningar for sina uppgifter" ON inlamningar
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM uppgifter u
      WHERE u.id = inlamningar.uppgift_id
        AND u.larare_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uppgifter u
      WHERE u.id = inlamningar.uppgift_id
        AND u.larare_id = auth.uid()
    )
  );
