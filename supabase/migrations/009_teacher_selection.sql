-- ============================================================
-- 009 - Teacher selection screen
-- Replaces invite-code login with a visual teacher picker
-- ============================================================

-- Returns all teachers for the student login selection screen (anon accessible)
CREATE OR REPLACE FUNCTION public.get_all_teachers()
RETURNS TABLE(id UUID, full_name TEXT, avatar_url TEXT)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT id, full_name, avatar_url
  FROM profiles
  WHERE role = 'teacher'
  ORDER BY full_name;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_teachers() TO anon, authenticated;

-- Returns students for a given teacher (used after teacher is selected on login screen)
CREATE OR REPLACE FUNCTION public.get_teacher_students(p_teacher_id UUID)
RETURNS TABLE(id UUID, full_name TEXT, email TEXT)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT p.id, p.full_name, p.email
  FROM profiles p
  JOIN teacher_student_relationships tsr ON tsr.student_id = p.id
  WHERE tsr.teacher_id = p_teacher_id
    AND tsr.status = 'active'
    AND p.role = 'student'
  ORDER BY p.full_name;
$$;
GRANT EXECUTE ON FUNCTION public.get_teacher_students(UUID) TO anon, authenticated;

-- ============================================================
-- Storage bucket for teacher/user avatars
-- Run the bucket creation via Supabase dashboard if INSERT fails
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
