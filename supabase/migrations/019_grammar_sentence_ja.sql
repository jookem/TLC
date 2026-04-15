-- Add Japanese translation of the pattern sentence to grammar_deck_points
alter table grammar_deck_points
  add column if not exists sentence_ja text;
