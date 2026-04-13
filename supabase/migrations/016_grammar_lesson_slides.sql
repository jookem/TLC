-- Lesson slides for grammar decks
-- Each deck can have an ordered set of teaching slides shown before the quiz

CREATE TABLE grammar_lesson_slides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     uuid NOT NULL REFERENCES grammar_decks(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL DEFAULT 0,
  title       text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  examples    text[] NOT NULL DEFAULT '{}',
  hint_ja     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX grammar_lesson_slides_deck_id ON grammar_lesson_slides(deck_id, sort_order);

-- RLS: teachers own their slides; students can read slides for decks assigned to them
ALTER TABLE grammar_lesson_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their lesson slides"
  ON grammar_lesson_slides
  FOR ALL
  TO authenticated
  USING (
    deck_id IN (SELECT id FROM grammar_decks WHERE teacher_id = auth.uid())
  )
  WITH CHECK (
    deck_id IN (SELECT id FROM grammar_decks WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Students can read lesson slides for assigned decks"
  ON grammar_lesson_slides
  FOR SELECT
  TO authenticated
  USING (
    deck_id IN (
      SELECT DISTINCT deck_id FROM grammar_bank WHERE student_id = auth.uid() AND deck_id IS NOT NULL
    )
  );
