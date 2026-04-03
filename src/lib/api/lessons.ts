import { supabase } from '@/lib/supabase'

export async function saveLessonNotes(data: {
  lesson_id: string
  summary?: string
  vocabulary?: { word: string; definition: string; example?: string; mastered?: boolean }[]
  grammar_points?: { point: string; explanation: string; examples?: string[] }[]
  homework?: string
  strengths?: string
  areas_to_focus?: string
  teacher_notes?: string
  goal_ids?: string[]
  is_visible_to_student?: boolean
}): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('lesson_notes').upsert(
    {
      lesson_id: data.lesson_id,
      author_id: user.id,
      summary: data.summary ?? null,
      vocabulary: data.vocabulary ?? [],
      grammar_points: data.grammar_points ?? [],
      homework: data.homework ?? null,
      strengths: data.strengths ?? null,
      areas_to_focus: data.areas_to_focus ?? null,
      teacher_notes: data.teacher_notes ?? null,
      goal_ids: data.goal_ids ?? null,
      is_visible_to_student: data.is_visible_to_student ?? true,
    },
    { onConflict: 'lesson_id' },
  )

  if (error) return { error: error.message }
  return { success: true }
}

export async function markLessonComplete(
  lessonId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('lessons')
    .update({ status: 'completed' })
    .eq('id', lessonId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function createLesson(data: {
  student_id: string
  scheduled_start: string
  scheduled_end: string
  lesson_type: 'trial' | 'regular' | 'intensive'
}): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('lessons').insert({
    teacher_id: user.id,
    student_id: data.student_id,
    scheduled_start: data.scheduled_start,
    scheduled_end: data.scheduled_end,
    lesson_type: data.lesson_type,
    status: 'completed',
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function addVocabularyToBank(
  entries: {
    student_id: string
    word: string
    reading?: string
    definition_en?: string
    definition_ja?: string
    example?: string
    lesson_id?: string
  }[],
): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('vocabulary_bank')
    .upsert(
      entries.map(e => ({ ...e, teacher_id: user.id })),
      { onConflict: 'student_id,word', ignoreDuplicates: true },
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateVocabMastery(
  vocabId: string,
  masteryLevel: 0 | 1 | 2 | 3,
): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const daysUntilReview = [1, 3, 7, 14][masteryLevel]
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + daysUntilReview)

  const { error } = await supabase
    .from('vocabulary_bank')
    .update({
      mastery_level: masteryLevel,
      next_review: nextReview.toISOString().split('T')[0],
    })
    .eq('id', vocabId)
    .eq('student_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
