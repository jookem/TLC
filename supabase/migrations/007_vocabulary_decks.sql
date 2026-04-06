-- Deck templates (teacher-owned, reusable across students)
CREATE TABLE IF NOT EXISTS vocabulary_decks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Words inside deck templates
CREATE TABLE IF NOT EXISTS vocabulary_deck_words (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     uuid NOT NULL REFERENCES vocabulary_decks(id) ON DELETE CASCADE,
  word        text NOT NULL,
  reading     text,
  definition_ja text,
  definition_en text,
  example     text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (deck_id, word)
);

-- Track which deck each vocabulary_bank entry came from
ALTER TABLE vocabulary_bank
  ADD COLUMN IF NOT EXISTS deck_id uuid REFERENCES vocabulary_decks(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE vocabulary_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their own decks"
  ON vocabulary_decks
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Students can see deck names of decks assigned to them
CREATE POLICY "Students view decks assigned to them"
  ON vocabulary_decks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vocabulary_bank vb
      WHERE vb.deck_id = id
        AND vb.student_id = auth.uid()
    )
  );

ALTER TABLE vocabulary_deck_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage words in their decks"
  ON vocabulary_deck_words
  USING (
    EXISTS (
      SELECT 1 FROM vocabulary_decks d
      WHERE d.id = deck_id AND d.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vocabulary_decks d
      WHERE d.id = deck_id AND d.teacher_id = auth.uid()
    )
  );
