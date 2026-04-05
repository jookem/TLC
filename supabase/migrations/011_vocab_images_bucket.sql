-- ============================================================
-- VOCAB IMAGES BUCKET
-- Public image attachments for vocabulary flashcard backs.
-- Files stored at path: {vocabEntryId}.webp
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vocab-images',
  'vocab-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Teachers can upload/replace images for vocab entries they own
CREATE POLICY "Teachers can upload vocab images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vocab-images'
    AND EXISTS (
      SELECT 1 FROM vocabulary_bank
      WHERE id::text = regexp_replace(storage.filename(name), '\.webp$', '')
        AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update vocab images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vocab-images'
    AND EXISTS (
      SELECT 1 FROM vocabulary_bank
      WHERE id::text = regexp_replace(storage.filename(name), '\.webp$', '')
        AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete vocab images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vocab-images'
    AND EXISTS (
      SELECT 1 FROM vocabulary_bank
      WHERE id::text = regexp_replace(storage.filename(name), '\.webp$', '')
        AND teacher_id = auth.uid()
    )
  );

-- Public read (bucket is public so this is the default, but explicit is safer)
CREATE POLICY "Vocab images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vocab-images');
