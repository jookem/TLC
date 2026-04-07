-- Fix infinite RLS recursion on puzzle_deck_assignments <-> puzzle_decks.
-- Root cause: puzzle_decks student policy queries puzzle_deck_assignments,
-- and puzzle_deck_assignments teacher policy queries puzzle_decks — circular.
-- Fix: store teacher_id directly on puzzle_deck_assignments so its policy
-- needs no cross-table lookup.

ALTER TABLE puzzle_deck_assignments
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill from puzzle_decks
UPDATE puzzle_deck_assignments pda
SET teacher_id = d.teacher_id
FROM puzzle_decks d
WHERE d.id = pda.deck_id;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Teachers manage puzzle deck assignments" ON puzzle_deck_assignments;

-- Replace with a simple, non-recursive policy
CREATE POLICY "Teachers manage puzzle deck assignments"
  ON puzzle_deck_assignments
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
