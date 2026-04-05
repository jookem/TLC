-- Add image_url to vocabulary_bank for flashcard back images
ALTER TABLE vocabulary_bank ADD COLUMN IF NOT EXISTS image_url TEXT;
