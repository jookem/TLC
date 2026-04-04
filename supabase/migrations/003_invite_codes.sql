-- ============================================================
-- 003 - Teacher invite codes
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add invite_code column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- ============================================================
-- Function: generate a unique 6-char code (no ambiguous chars)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_teacher_invite_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  TEXT;
  taken BOOLEAN;
BEGIN
  LOOP
    SELECT string_agg(substr(chars, ceil(random() * length(chars))::int, 1), '')
    INTO code
    FROM generate_series(1, 6);

    SELECT EXISTS(SELECT 1 FROM profiles WHERE invite_code = code) INTO taken;
    EXIT WHEN NOT taken;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger: auto-set invite_code for new teacher profiles
-- ============================================================
CREATE OR REPLACE FUNCTION set_teacher_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' AND NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_teacher_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_invite_code
  BEFORE INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_teacher_invite_code();

-- Generate codes for any existing teachers
UPDATE profiles
SET invite_code = generate_teacher_invite_code()
WHERE role = 'teacher' AND invite_code IS NULL;

-- ============================================================
-- RLS: allow authenticated users to look up teacher profiles
-- (needed so students can resolve an invite code)
-- ============================================================
CREATE POLICY "Authenticated users can view teacher profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (role = 'teacher');
