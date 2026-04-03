'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const bookingRequestSchema = z.object({
  teacher_id: z.string().uuid(),
  requested_start: z.string().datetime(),
  requested_end: z.string().datetime(),
  student_note: z.string().max(500).optional(),
})

export async function createBookingRequest(data: {
  teacher_id: string
  requested_start: string
  requested_end: string
  student_note?: string
}) {
  const result = bookingRequestSchema.safeParse(data)
  if (!result.success) return { error: 'Invalid booking data.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('booking_requests').insert({
    student_id: user.id,
    teacher_id: result.data.teacher_id,
    requested_start: result.data.requested_start,
    requested_end: result.data.requested_end,
    student_note: result.data.student_note ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/book')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function approveBookingRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Fetch the request
  const { data: req, error: fetchError } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('id', requestId)
    .eq('teacher_id', user.id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !req) return { error: 'Request not found or already processed.' }

  // Create the lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      teacher_id: req.teacher_id,
      student_id: req.student_id,
      scheduled_start: req.requested_start,
      scheduled_end: req.requested_end,
      status: 'scheduled',
    })
    .select()
    .single()

  if (lessonError) return { error: lessonError.message }

  // Update the request
  const { error: updateError } = await supabase
    .from('booking_requests')
    .update({ status: 'approved', lesson_id: lesson.id })
    .eq('id', requestId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/lessons')
  return { success: true, lessonId: lesson.id }
}

export async function declineBookingRequest(requestId: string, teacherNote?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('booking_requests')
    .update({ status: 'declined', teacher_note: teacherNote ?? null })
    .eq('id', requestId)
    .eq('teacher_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}

export async function cancelLesson(lessonId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('lessons')
    .update({
      status: 'cancelled',
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? null,
    })
    .eq('id', lessonId)
    .or(`teacher_id.eq.${user.id},student_id.eq.${user.id}`)

  if (error) return { error: error.message }

  revalidatePath('/lessons')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}
