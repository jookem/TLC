import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatInTimeZone } from 'date-fns-tz'
import { format } from 'date-fns'

export function TeacherDashboard() {
  const { user } = useAuth()
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [pendingBookings, setPendingBookings] = useState<any[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      const [lessonsResult, pendingBookingsResult, studentsResult] = await Promise.all([
        supabase
          .from('lessons')
          .select('*, student:profiles!lessons_student_id_fkey(id, full_name, display_name, avatar_url)')
          .eq('teacher_id', user!.id)
          .eq('status', 'scheduled')
          .gte('scheduled_start', new Date().toISOString())
          .order('scheduled_start', { ascending: true })
          .limit(5),

        supabase
          .from('booking_requests')
          .select('*, student:profiles!booking_requests_student_id_fkey(id, full_name, display_name)')
          .eq('teacher_id', user!.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),

        supabase
          .from('teacher_student_relationships')
          .select('id')
          .eq('teacher_id', user!.id)
          .eq('status', 'active'),
      ])

      setUpcomingLessons(lessonsResult.data ?? [])
      setPendingBookings(pendingBookingsResult.data ?? [])
      setStudentCount(studentsResult.data?.length ?? 0)
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{studentCount}</div>
            <div className="text-sm text-gray-500 mt-1">Active Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{upcomingLessons.length}</div>
            <div className="text-sm text-gray-500 mt-1">Upcoming Lessons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-brand">{pendingBookings.length}</div>
            <div className="text-sm text-gray-500 mt-1">Pending Requests</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming Lessons</CardTitle>
            <Link to="/lessons" className="text-sm text-brand hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {upcomingLessons.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming lessons.</p>
            ) : (
              <div className="space-y-3">
                {upcomingLessons.map((lesson: any) => (
                  <div key={lesson.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lesson.student?.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatInTimeZone(new Date(lesson.scheduled_start), 'Asia/Tokyo', 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{lesson.lesson_type}</Badge>
                      <Link to={`/lessons/${lesson.id}`} className="text-xs text-brand hover:underline">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Booking Requests</CardTitle>
            <Link to="/calendar" className="text-sm text-brand hover:underline">Calendar</Link>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((req: any) => (
                  <div key={req.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{req.student?.full_name}</p>
                      <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatInTimeZone(new Date(req.requested_start), 'Asia/Tokyo', 'MMM d, h:mm a')}
                      {' - '}
                      {formatInTimeZone(new Date(req.requested_end), 'Asia/Tokyo', 'h:mm a')}
                    </p>
                    {req.student_note && (
                      <p className="text-xs text-gray-600 italic">&ldquo;{req.student_note}&rdquo;</p>
                    )}
                    <Link
                      to={`/calendar?request=${req.id}`}
                      className="text-xs bg-brand text-white px-3 py-1 rounded hover:bg-brand-dark transition-colors inline-block"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
