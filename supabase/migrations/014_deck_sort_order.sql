-- Add sort_order to all three deck tables so teachers can reorder them

ALTER TABLE vocabulary_decks ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE grammar_decks    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE puzzle_decks     ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Backfill: assign sort_order based on existing created_at order (oldest first)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY created_at ASC) - 1 AS rn
  FROM vocabulary_decks
)
UPDATE vocabulary_decks SET sort_order = ranked.rn FROM ranked WHERE vocabulary_decks.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY created_at ASC) - 1 AS rn
  FROM grammar_decks
)
UPDATE grammar_decks SET sort_order = ranked.rn FROM ranked WHERE grammar_decks.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY created_at ASC) - 1 AS rn
  FROM puzzle_decks
)
UPDATE puzzle_decks SET sort_order = ranked.rn FROM ranked WHERE puzzle_decks.id = ranked.id;
