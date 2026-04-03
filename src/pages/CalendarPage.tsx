import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { BookingRequestCard } from '@/components/booking/BookingRequestCard'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import type { BookingRequestWithProfiles } from '@/lib/types/database'
import { subMonths, addMonths } from 'date-fns'

export function CalendarPage() {
  const { user, profile } = useAuth()
  const isTeacher = profile?.role === 'teacher'
  const [lessons, setLessons] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    if (!user || !profile) return

    const rangeStart = subMonths(new Date(), 6).toISOString()
    const rangeEnd = addMonths(new Date(), 6).toISOString()

    const lessonQuery = supabase
      .from('lessons')
      .select('id, scheduled_start, scheduled_end, status, student:profiles!lessons_student_id_fkey(full_name), teacher:profiles!lessons_teacher_id_fkey(full_name)')
      .gte('scheduled_start', rangeStart)
      .lte('scheduled_start', rangeEnd)
      .order('scheduled_start', { ascending: true })

    if (isTeacher) {
      lessonQuery.eq('teacher_id', user.id)
    } else {
      lessonQuery.eq('student_id', user.id)
    }

    const [{ data: lessonsData }, { data: requestsData }] = await Promise.all([
      lessonQuery,
      isTeacher
        ? supabase
            .from('booking_requests')
            .select('*, student:profiles!booking_requests_student_id_fkey(id, full_name, display_name, avatar_url), teacher:profiles!booking_requests_teacher_id_fkey(id, full_name, display_name, avatar_url)')
            .eq('teacher_id', user.id)
            .eq('status', 'pending')
            .order('requested_start', { ascending: true })
        : supabase
            .from('booking_requests')
            .select('id, requested_start, status, teacher:profiles!booking_requests_teacher_id_fkey(full_name)')
            .eq('student_id', user.id)
            .eq('status', 'pending'),
    ])

    setLessons(lessonsData ?? [])
    setPendingRequests(requestsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user, profile])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <MonthCalendar
            lessons={lessons}
            pendingRequests={pendingRequests}
            role={isTeacher ? 'teacher' : 'student'}
            onRequestHandled={loadData}
          />
        </div>

        {isTeacher && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Pending Requests ({pendingRequests.length})
            </h2>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests.</p>
            ) : (
              pendingRequests.map(req => (
                <BookingRequestCard
                  key={req.id}
                  request={req as unknown as BookingRequestWithProfiles}
                  onHandled={loadData}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
