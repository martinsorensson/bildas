-- ============================================================
-- Migration 004
-- Koppla uppgifter till kurser + RLS för elevläsning
-- ============================================================

ALTER TABLE uppgifter
  ADD COLUMN kurs_id uuid references kurser(id) on delete set null;

CREATE INDEX ON uppgifter(kurs_id);

-- Elever kan se uppgifter som tillhör kurser de är inskrivna i
CREATE POLICY "Elever kan se uppgifter i sina kurser" ON uppgifter
  FOR SELECT
  USING (
    kurs_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM kurs_elever ke
      WHERE ke.kurs_id = uppgifter.kurs_id
        AND ke.elev_id = auth.uid()
    )
  );
