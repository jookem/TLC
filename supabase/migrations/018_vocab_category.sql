-- Add semantic category to vocabulary deck words (teacher template)
ALTER TABLE vocabulary_deck_words ADD COLUMN IF NOT EXISTS category text;

-- Add semantic category to student vocabulary bank entries
ALTER TABLE vocabulary_bank ADD COLUMN IF NOT EXISTS category text;
