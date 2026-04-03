import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatInTimeZone } from 'date-fns-tz'
import { LessonNotesEditor } from '@/components/lesson/LessonNotesEditor'
import { markLessonComplete } from '@/lib/api/lessons'
import { toast } from 'sonner'

export function LessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<any>(null)
  const [notes, setNotes] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  async function loadData() {
    if (!user || !lessonId) return

    const [lessonResult, notesResult, goalsResult] = await Promise.all([
      supabase
        .from('lessons')
        .select('*, student:profiles!lessons_student_id_fkey(*), teacher:profiles!lessons_teacher_id_fkey(id, full_name)')
        .eq('id', lessonId)
        .eq('teacher_id', user.id)
        .single(),

      supabase.from('lesson_notes').select('*').eq('lesson_id', lessonId).single(),

      supabase.from('student_goals').select('*').eq('teacher_id', user.id).eq('status', 'active'),
    ])

    if (!lessonResult.data) {
      navigate('/lessons')
      return
    }

    setLesson(lessonResult.data)
    setNotes(notesResult.data ?? null)
    setGoals((goalsResult.data ?? []).filter((g: any) => g.student_id === lessonResult.data.student_id))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user, lessonId])

  async function handleMarkComplete() {
    if (!lessonId) return
    setCompleting(true)
    const result = await markLessonComplete(lessonId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setLesson((prev: any) => ({ ...prev, status: 'completed' }))
    }
    setCompleting(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!lesson) return null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/lessons" className="hover:text-gray-700">Lessons</Link>
            <span>/</span>
            <Link to={`/students/${lesson.student_id}`} className="hover:text-gray-700">
              {lesson.student?.full_name}
            </Link>
          </div>
          <h1 className="text-2xl font-semibold">{lesson.student?.full_name}&apos;s Lesson</h1>
          <p className="text-gray-500 mt-1">
            {formatInTimeZone(new Date(lesson.scheduled_start), 'Asia/Tokyo', 'EEEE, MMMM d, yyyy · h:mm a')}
            {' - '}
            {formatInTimeZone(new Date(lesson.scheduled_end), 'Asia/Tokyo', 'h:mm a')}
            {' JST'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{lesson.lesson_type}</Badge>
          <span className={`text-sm px-2 py-0.5 rounded-full font-medium capitalize ${
            lesson.status === 'scheduled' ? 'bg-brand-light text-brand-dark' :
            lesson.status === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {lesson.status}
          </span>
          {lesson.status === 'scheduled' && (
            <button
              onClick={handleMarkComplete}
              disabled={completing}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {completing ? 'Saving…' : 'Mark Complete'}
            </button>
          )}
        </div>
      </div>

      {lesson.meeting_url && (
        <Card className="bg-brand-light border-brand/30">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm text-brand-dark">Meeting link</span>
            <a href={lesson.meeting_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline font-medium">
              Join Meeting
            </a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <LessonNotesEditor
            lessonId={lessonId!}
            studentId={lesson.student_id}
            initialNotes={notes ?? undefined}
            goals={goals}
            onSaved={loadData}
          />
        </CardContent>
      </Card>
    </div>
  )
}
