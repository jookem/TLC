import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AvailabilityManager } from '@/components/calendar/AvailabilityManager'

export function AvailabilityPage() {
  const { user } = useAuth()
  const [recurringSlots, setRecurringSlots] = useState<any[]>([])
  const [oneOffSlots, setOneOffSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadSlots() {
    if (!user) return
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('teacher_id', user.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    setRecurringSlots((data ?? []).filter((s: any) => s.slot_type === 'recurring'))
    setOneOffSlots((data ?? []).filter((s: any) => s.slot_type === 'one_off'))
    setLoading(false)
  }

  useEffect(() => {
    loadSlots()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Availability</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set your recurring schedule and one-off available slots. Students can book within these times.
        </p>
      </div>

      <AvailabilityManager
        recurringSlots={recurringSlots}
        oneOffSlots={oneOffSlots}
        onChanged={loadSlots}
      />
    </div>
  )
}
