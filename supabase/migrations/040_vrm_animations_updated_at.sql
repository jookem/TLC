-- Add updated_at to vrm_animations so clients can cache-bust when a file is re-uploaded

ALTER TABLE vrm_animations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Keep updated_at current on every row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vrm_animations_updated_at
  BEFORE UPDATE ON vrm_animations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
