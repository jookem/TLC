'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const lessonNotesSchema = z.object({
  lesson_id: z.string().uuid(),
  summary: z.string().optional(),
  vocabulary: z.array(z.object({
    word: z.string(),
    definition: z.string(),
    example: z.string().optional(),
    mastered: z.boolean().optional(),
  })).optional(),
  grammar_points: z.array(z.object({
    point: z.string(),
    explanation: z.string(),
    examples: z.array(z.string()).optional(),
  })).optional(),
  homework: z.string().optional(),
  strengths: z.string().optional(),
  areas_to_focus: z.string().optional(),
  teacher_notes: z.string().optional(),
  goal_ids: z.array(z.string().uuid()).optional(),
  is_visible_to_student: z.boolean().optional(),
})

export async function saveLessonNotes(data: z.infer<typeof lessonNotesSchema>) {
  const result = lessonNotesSchema.safeParse(data)
  if (!result.success) return { error: 'Invalid notes data.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const payload = {
    lesson_id: result.data.lesson_id,
    author_id: user.id,
    summary: result.data.summary ?? null,
    vocabulary: result.data.vocabulary ?? [],
    grammar_points: result.data.grammar_points ?? [],
    homework: result.data.homework ?? null,
    strengths: result.data.strengths ?? null,
    areas_to_focus: result.data.areas_to_focus ?? null,
    teacher_notes: result.data.teacher_notes ?? null,
    goal_ids: result.data.goal_ids ?? null,
    is_visible_to_student: result.data.is_visible_to_student ?? true,
  }

  const { error } = await supabase
    .from('lesson_notes')
    .upsert(payload, { onConflict: 'lesson_id' })

  if (error) return { error: error.message }

  revalidatePath(`/lessons/${result.data.lesson_id}`)
  return { success: true }
}

const lessonPlanSchema = z.object({
  lesson_id: z.string().uuid(),
  objectives: z.array(z.string()).optional(),
  materials: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    type: z.enum(['worksheet', 'video', 'audio', 'book', 'website', 'other']),
  })).optional(),
  activities: z.array(z.object({
    name: z.string(),
    duration_minutes: z.number(),
    description: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
})

export async function saveLessonPlan(data: z.infer<typeof lessonPlanSchema>) {
  const result = lessonPlanSchema.safeParse(data)
  if (!result.success) return { error: 'Invalid plan data.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('lesson_plans')
    .upsert({
      lesson_id: result.data.lesson_id,
      teacher_id: user.id,
      objectives: result.data.objectives ?? [],
      materials: result.data.materials ?? [],
      activities: result.data.activities ?? [],
      notes: result.data.notes ?? null,
    }, { onConflict: 'lesson_id' })

  if (error) return { error: error.message }

  revalidatePath(`/lessons/${result.data.lesson_id}`)
  return { success: true }
}

export async function markLessonComplete(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('lessons')
    .update({ status: 'completed' })
    .eq('id', lessonId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/lessons')
  revalidatePath(`/lessons/${lessonId}`)
  return { success: true }
}

export async function addVocabularyToBank(entries: {
  student_id: string
  word: string
  reading?: string
  definition_en?: string
  definition_ja?: string
  example?: string
  lesson_id?: string
}[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('vocabulary_bank')
    .upsert(
      entries.map(e => ({ ...e, teacher_id: user.id })),
      { onConflict: 'student_id,word', ignoreDuplicates: true }
    )

  if (error) return { error: error.message }

  revalidatePath('/students')
  return { success: true }
}

export async function updateVocabMastery(vocabId: string, masteryLevel: 0 | 1 | 2 | 3) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Calculate next review based on mastery
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

  revalidatePath('/vocabulary')
  return { success: true }
}
