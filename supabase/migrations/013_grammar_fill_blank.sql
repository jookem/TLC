-- Add fill-in-the-blank fields to grammar deck points and student bank.
-- sentence_with_blank: English sentence with _____ placeholder
-- answer:              the correct word(s) that fill the blank
-- hint_ja:             Japanese explanation shown under the blank
-- distractors:         teacher-defined wrong answer choices

ALTER TABLE grammar_deck_points
  ADD COLUMN IF NOT EXISTS sentence_with_blank text,
  ADD COLUMN IF NOT EXISTS answer              text,
  ADD COLUMN IF NOT EXISTS hint_ja             text,
  ADD COLUMN IF NOT EXISTS distractors         text[] DEFAULT '{}';

ALTER TABLE grammar_bank
  ADD COLUMN IF NOT EXISTS sentence_with_blank text,
  ADD COLUMN IF NOT EXISTS answer              text,
  ADD COLUMN IF NOT EXISTS hint_ja             text,
  ADD COLUMN IF NOT EXISTS distractors         text[] DEFAULT '{}';
