import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { BookingCalendar } from '@/components/booking/BookingCalendar'

export function BookPage() {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState<any>(null)
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([])
  const [existingLessons, setExistingLessons] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [noTeacher, setNoTeacher] = useState(false)

  async function loadData() {
    if (!user) return

    const { data: relationships } = await supabase
      .from('teacher_student_relationships')
      .select('*, teacher:profiles!teacher_student_relationships_teacher_id_fkey(id, full_name, display_name, avatar_url)')
      .eq('student_id', user.id)
      .eq('status', 'active')

    const teacherRel = relationships?.[0]
    if (!teacherRel) {
      setNoTeacher(true)
      setLoading(false)
      return
    }

    const t = (teacherRel as any).teacher
    setTeacher(t)

    const [{ data: slots }, { data: lessons }, { data: pending }] = await Promise.all([
      supabase.from('availability_slots').select('*').eq('teacher_id', t.id).eq('is_active', true),
      supabase.from('lessons').select('scheduled_start, scheduled_end, status, student_id').eq('teacher_id', t.id).in('status', ['scheduled']).gte('scheduled_start', new Date().toISOString()),
      supabase.from('booking_requests').select('*').eq('student_id', user.id).eq('status', 'pending'),
    ])

    setAvailabilitySlots(slots ?? [])
    setExistingLessons(lessons ?? [])
    setPendingRequests(pending ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (noTeacher) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">予約 / Book a Lesson</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">You are not currently enrolled with a teacher.</p>
            <p className="text-sm text-gray-400 mt-1">Please contact your teacher to be added.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">予約 / Book a Lesson</h1>
        <p className="text-gray-500 text-sm mt-1">先生: {teacher.full_name}</p>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium">
            保留中のリクエスト: {pendingRequests.length}件
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            You have {pendingRequests.length} pending booking request(s) awaiting teacher approval.
          </p>
        </div>
      )}

      <BookingCalendar
        teacherId={teacher.id}
        teacherName={teacher.full_name}
        availabilitySlots={availabilitySlots}
        existingLessons={existingLessons}
        studentId={user!.id}
        onBooked={loadData}
      />
    </div>
  )
}
