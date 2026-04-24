-- Add folder grouping to all three deck types
ALTER TABLE vocabulary_decks ADD COLUMN IF NOT EXISTS folder text DEFAULT NULL;
ALTER TABLE grammar_decks    ADD COLUMN IF NOT EXISTS folder text DEFAULT NULL;
ALTER TABLE puzzle_decks     ADD COLUMN IF NOT EXISTS folder text DEFAULT NULL;
