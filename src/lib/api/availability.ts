import { supabase } from '@/lib/supabase'

export async function createAvailabilitySlot(
  data:
    | { slot_type: 'recurring'; day_of_week: number; start_time: string; end_time: string }
    | { slot_type: 'one_off'; specific_date: string; start_time: string; end_time: string },
): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const payload =
    data.slot_type === 'recurring'
      ? {
          teacher_id: user.id,
          slot_type: 'recurring' as const,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
        }
      : {
          teacher_id: user.id,
          slot_type: 'one_off' as const,
          specific_date: data.specific_date,
          start_time: data.start_time,
          end_time: data.end_time,
        }

  const { error } = await supabase.from('availability_slots').insert(payload)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAvailabilitySlot(
  slotId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('id', slotId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleAvailabilitySlot(
  slotId: string,
  isActive: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('availability_slots')
    .update({ is_active: isActive })
    .eq('id', slotId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
