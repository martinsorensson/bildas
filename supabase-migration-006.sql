-- ============================================================
-- Migration 006
-- Tabell: larare_anteckningar
-- En rad per lärare+elev-kombination (upsert)
-- RLS: läraren kan bara läsa/skriva sina egna anteckningar,
--      och bara om de undervisar eleven via kurser+kurs_elever
-- ============================================================

CREATE TABLE larare_anteckningar (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  larare_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  elev_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anteckning   text,
  uppdaterad_at timestamptz DEFAULT now(),
  UNIQUE (larare_id, elev_id)
);

ALTER TABLE larare_anteckningar ENABLE ROW LEVEL SECURITY;

-- Lärare kan läsa/skriva sina egna anteckningar,
-- men bara om de faktiskt undervisar eleven
CREATE POLICY "Larare kan hantera egna anteckningar" ON larare_anteckningar
  FOR ALL
  USING (auth.uid() = larare_id)
  WITH CHECK (
    auth.uid() = larare_id AND
    EXISTS (
      SELECT 1 FROM kurser k
      JOIN kurs_elever ke ON ke.kurs_id = k.id
      WHERE k.larare_id = auth.uid()
        AND ke.elev_id = larare_anteckningar.elev_id
    )
  );
