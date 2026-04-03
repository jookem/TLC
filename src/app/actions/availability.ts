'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const availabilitySchema = z.discriminatedUnion('slot_type', [
  z.object({
    slot_type: z.literal('recurring'),
    day_of_week: z.number().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  }),
  z.object({
    slot_type: z.literal('one_off'),
    specific_date: z.string(),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  }),
])

export async function createAvailabilitySlot(data: z.infer<typeof availabilitySchema>) {
  const result = availabilitySchema.safeParse(data)
  if (!result.success) return { error: 'Invalid availability data.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const payload =
    result.data.slot_type === 'recurring'
      ? {
          teacher_id: user.id,
          slot_type: 'recurring' as const,
          day_of_week: result.data.day_of_week,
          start_time: result.data.start_time,
          end_time: result.data.end_time,
        }
      : {
          teacher_id: user.id,
          slot_type: 'one_off' as const,
          specific_date: result.data.specific_date,
          start_time: result.data.start_time,
          end_time: result.data.end_time,
        }

  const { error } = await supabase.from('availability_slots').insert(payload)

  if (error) return { error: error.message }

  revalidatePath('/availability')
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteAvailabilitySlot(slotId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('id', slotId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/availability')
  revalidatePath('/calendar')
  return { success: true }
}

export async function toggleAvailabilitySlot(slotId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('availability_slots')
    .update({ is_active: isActive })
    .eq('id', slotId)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/availability')
  return { success: true }
}
