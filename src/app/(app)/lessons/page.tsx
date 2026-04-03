import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LessonCard } from '@/components/lesson/LessonCard'
import { ScheduleLessonModal } from '@/components/lesson/ScheduleLessonModal'

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>
}) {
  const { student: selectedStudentId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isTeacher = profile?.role === 'teacher'

  // --- Teacher view ---
  if (isTeacher) {
    // Fetch teacher's students
    const { data: relationships } = await supabase
      .from('teacher_student_relationships')
      .select('student:profiles!teacher_student_relationships_student_id_fkey(id, full_name, email)')
      .eq('teacher_id', user.id)
      .eq('status', 'active')
      .order('started_at')

    const students = (relationships ?? []).map((r: any) => r.student).filter(Boolean)

    // If a student is selected, fetch their lessons + notes
    let lessons: any[] = []
    let selectedStudent: any = null

    if (selectedStudentId) {
      selectedStudent = students.find((s: any) => s.id === selectedStudentId)

      const { data } = await supabase
        .from('lessons')
        .select('id, scheduled_start, scheduled_end, status, lesson_type, lesson_notes(summary, areas_to_focus, homework)')
        .eq('teacher_id', user.id)
        .eq('student_id', selectedStudentId)
        .order('scheduled_start', { ascending: false })

      lessons = data ?? []
    }

    return (
      <div className="flex flex-col md:flex-row gap-0 md:gap-6 min-h-0">
        {/* Student sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Students</h2>
          {students.length === 0 ? (
            <p className="text-sm text-gray-400">No students yet.</p>
          ) : (
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {students.map((s: any) => {
                const initials = s.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                const active = s.id === selectedStudentId
                return (
                  <Link
                    key={s.id}
                    href={`/lessons?student=${s.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors shrink-0 ${
                      active
                        ? 'bg-brand text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className={`text-xs font-semibold ${active ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-dark'}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{s.full_name.split(' ')[0]}</span>
                  </Link>
                )
              })}
            </nav>
          )}
        </aside>

        {/* Main panel */}
        <div className="flex-1 min-w-0 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6 pt-4 md:pt-0">
          {!selectedStudentId ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Select a student to view their lessons</p>
            </div>
          ) : !selectedStudent ? (
            <p className="text-sm text-gray-500">Student not found.</p>
          ) : (
            <div className="space-y-4">
              {/* Student header */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold">{selectedStudent.full_name}</h1>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ScheduleLessonModal
                    studentId={selectedStudent.id}
                    studentName={selectedStudent.full_name}
                  />
                  <Link
                    href={`/students/${selectedStudent.id}`}
                    className="text-xs text-brand hover:underline"
                  >
                    Student profile →
                  </Link>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">
                  <strong className="text-gray-900">{lessons.length}</strong> total
                </span>
                <span className="text-gray-500">
                  <strong className="text-green-700">{lessons.filter((l: any) => l.status === 'completed').length}</strong> completed
                </span>
                <span className="text-gray-500">
                  <strong className="text-brand">{lessons.filter((l: any) => l.status === 'scheduled').length}</strong> upcoming
                </span>
              </div>

              {/* Lesson timeline */}
              {lessons.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm">No lessons yet for this student.</p>
                  <p className="text-xs mt-1">Use "Log Lesson" to add a past lesson.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson: any) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      notes={lesson.lesson_notes ?? null}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Student view (unchanged) ---
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, teacher:profiles!lessons_teacher_id_fkey(id, full_name), lesson_notes(summary, areas_to_focus, homework)')
    .eq('student_id', user.id)
    .order('scheduled_start', { ascending: false })

  const upcoming = (lessons ?? []).filter((l: any) => l.status === 'scheduled')
  const past = (lessons ?? []).filter((l: any) => l.status !== 'scheduled')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Lessons</h1>

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((lesson: any) => (
              <LessonCard key={lesson.id} lesson={lesson} notes={lesson.lesson_notes ?? null} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past Lessons</h2>
          <div className="space-y-2">
            {past.map((lesson: any) => (
              <LessonCard key={lesson.id} lesson={lesson} notes={lesson.lesson_notes ?? null} />
            ))}
          </div>
        </section>
      )}

      {!lessons?.length && (
        <p className="text-sm text-gray-500">No lessons yet.</p>
      )}
    </div>
  )
}
