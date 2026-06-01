-- ============================================================
-- Migration 005
-- Fixa trigger för ny-användare-profil: role → 'pending'
--
-- Supabase skapar ofta en trigger på auth.users som automatiskt
-- skapar en rad i public.profiles vid ny inloggning.
-- Om den sätter role = 'larare' (eller något annat default)
-- ersätts den här med en korrekt version som sätter 'pending'.
-- ============================================================

-- Trigerfunktionen som körs vid INSERT i auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, namn, email)
  VALUES (
    NEW.id,
    'pending',
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ta bort eventuell befintlig trigger och återskapa den
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
