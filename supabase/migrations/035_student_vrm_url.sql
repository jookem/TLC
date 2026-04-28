-- Student VRM avatar URL stored on their account
ALTER TABLE student_details
  ADD COLUMN IF NOT EXISTS vrm_url TEXT;

-- Allow students to update their own details row (needed to save VRM URL)
CREATE POLICY "Students update own details"
  ON student_details FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
