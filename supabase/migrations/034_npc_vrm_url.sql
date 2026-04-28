-- Add VRM model URL and animation URL to NPCs
ALTER TABLE situation_npcs
  ADD COLUMN IF NOT EXISTS vrm_url TEXT,
  ADD COLUMN IF NOT EXISTS animation_url TEXT;
