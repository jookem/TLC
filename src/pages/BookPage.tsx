import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import { PageError } from '@/components/shared/PageError'

export function BookPage() {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState<any>(null)
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([])
  const [existingLessons, setExistingLessons] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [noTeacher, setNoTeacher] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    if (!user) return
    try {
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

    const [{ data: slots, error: sErr }, { data: lessons, error: lErr }, { data: pending, error: pErr }] = await Promise.all([
      supabase.from('availability_slots').select('*').eq('teacher_id', t.id).eq('is_active', true),
      supabase.from('lessons').select('scheduled_start, scheduled_end, status, student_id').eq('teacher_id', t.id).in('status', ['scheduled']).gte('scheduled_start', new Date().toISOString()),
      supabase.from('booking_requests').select('*').eq('student_id', user.id).eq('status', 'pending'),
    ])
    if (sErr || lErr || pErr) throw sErr ?? lErr ?? pErr

    setAvailabilitySlots(slots ?? [])
    setExistingLessons(lessons ?? [])
    setPendingRequests(pending ?? [])
    setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load booking data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  if (error) return <PageError message={error} onRetry={loadData} />

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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
          <p className="text-sm text-yellow-800 font-medium">
            保留中のリクエスト / Pending Requests ({pendingRequests.length})
          </p>
          <p className="text-xs text-yellow-600">Awaiting teacher approval:</p>
          <ul className="space-y-1">
            {pendingRequests.map((req: any) => (
              <li key={req.id} className="text-xs text-yellow-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                {new Date(req.requested_start).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}
                {new Date(req.requested_start).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                {' – '}
                {new Date(req.requested_end).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
              </li>
            ))}
          </ul>
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
