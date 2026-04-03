'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addStudentByEmail(email: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Use admin client to look up the student profile by email
  // (teacher doesn't have RLS access to arbitrary profiles)
  const admin = createAdminClient()
  const { data: student } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!student) return { error: 'No account found with that email address.' }
  if (student.role !== 'student') return { error: 'That account is not a student.' }
  if (student.id === user.id) return { error: 'You cannot add yourself.' }

  // Check if relationship already exists
  const { data: existing } = await supabase
    .from('teacher_student_relationships')
    .select('id, status')
    .eq('teacher_id', user.id)
    .eq('student_id', student.id)
    .single()

  if (existing) {
    if (existing.status === 'active') return { error: `${student.full_name} is already your student.` }
    // Re-activate a paused/ended relationship
    const { error } = await supabase
      .from('teacher_student_relationships')
      .update({ status: 'active', ended_at: null })
      .eq('id', existing.id)
    if (error) return { error: 'Failed to re-activate relationship.' }
    revalidatePath('/students')
    return {}
  }

  const { error } = await supabase
    .from('teacher_student_relationships')
    .insert({ teacher_id: user.id, student_id: student.id })

  if (error) return { error: 'Failed to add student.' }

  revalidatePath('/students')
  return {}
}

export async function removeStudent(studentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('teacher_student_relationships')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)

  if (error) return { error: 'Failed to remove student.' }

  revalidatePath('/students')
  return {}
}
