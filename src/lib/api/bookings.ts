import { supabase } from '@/lib/supabase'

export async function createBookingRequest(data: {
  teacher_id: string
  requested_start: string
  requested_end: string
  student_note?: string
}): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('booking_requests').insert({
    student_id: user.id,
    teacher_id: data.teacher_id,
    requested_start: data.requested_start,
    requested_end: data.requested_end,
    student_note: data.student_note ?? null,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function approveBookingRequest(
  requestId: string,
): Promise<{ error?: string; success?: boolean; lessonId?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: req, error: fetchError } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('id', requestId)
    .eq('teacher_id', user.id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !req) return { error: 'Request not found or already processed.' }

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

  const { error: updateError } = await supabase
    .from('booking_requests')
    .update({ status: 'approved', lesson_id: lesson.id })
    .eq('id', requestId)

  if (updateError) return { error: updateError.message }
  return { success: true, lessonId: lesson.id }
}

export async function declineBookingRequest(
  requestId: string,
  teacherNote?: string,
): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('booking_requests')
    .update({ status: 'declined', teacher_note: teacherNote ?? null })
    .eq('id', requestId)
    .eq('teacher_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  return { success: true }
}

export async function cancelLesson(
  lessonId: string,
  reason?: string,
): Promise<{ error?: string; success?: boolean }> {
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
  return { success: true }
}
