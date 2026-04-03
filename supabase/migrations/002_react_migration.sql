-- ============================================================
-- 002 - React migration patches
-- Run this in Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- STUDENT_DETAILS (was missing from initial schema)
-- Extended per-student info set by their teacher
-- ============================================================
CREATE TABLE IF NOT EXISTS student_details (
  student_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  age            SMALLINT,
  grade          TEXT,
  school_name    TEXT,
  occupation     TEXT,
  eiken_grade    TEXT,
  toeic_score    SMALLINT,
  ielts_score    NUMERIC(3,1),
  toefl_score    SMALLINT,
  self_cefr      TEXT CHECK (self_cefr IN ('A1','A2','B1','B2','C1','C2')),
  hobbies        TEXT,
  likes          TEXT,
  dislikes       TEXT,
  learning_goals TEXT,
  notes          TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

-- Teachers can manage details for their students
CREATE POLICY "Teachers manage student details"
  ON student_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teacher_student_relationships tsr
      WHERE tsr.teacher_id = auth.uid()
        AND tsr.student_id = student_details.student_id
        AND tsr.status = 'active'
    )
  );

-- Students can read their own details
CREATE POLICY "Students read own details"
  ON student_details FOR SELECT
  USING (student_id = auth.uid());


-- ============================================================
-- PROFILES — allow teachers to look up any profile by email
-- Needed for the "add student by email" flow in the browser
-- (previously used admin client, now uses anon client)
-- ============================================================
CREATE POLICY "Teachers can look up any profile"
  ON profiles FOR SELECT
  USING (auth_user_role() = 'teacher');


-- ============================================================
-- STUDENT_DETAILS trigger for updated_at
-- ============================================================
CREATE TRIGGER student_details_updated_at
  BEFORE UPDATE ON student_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
