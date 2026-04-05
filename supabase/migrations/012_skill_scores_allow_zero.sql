-- Allow skill scores of 0 (previously 1–10, now 0–10)
ALTER TABLE progress_snapshots
  DROP CONSTRAINT IF EXISTS progress_snapshots_speaking_score_check,
  DROP CONSTRAINT IF EXISTS progress_snapshots_listening_score_check,
  DROP CONSTRAINT IF EXISTS progress_snapshots_reading_score_check,
  DROP CONSTRAINT IF EXISTS progress_snapshots_writing_score_check;

ALTER TABLE progress_snapshots
  ADD CONSTRAINT progress_snapshots_speaking_score_check  CHECK (speaking_score  BETWEEN 0 AND 10),
  ADD CONSTRAINT progress_snapshots_listening_score_check CHECK (listening_score BETWEEN 0 AND 10),
  ADD CONSTRAINT progress_snapshots_reading_score_check   CHECK (reading_score   BETWEEN 0 AND 10),
  ADD CONSTRAINT progress_snapshots_writing_score_check   CHECK (writing_score   BETWEEN 0 AND 10);
