import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatInTimeZone } from 'date-fns-tz'
import { useTimezone } from '@/lib/hooks/useTimezone'
import { format, differenceInDays } from 'date-fns'
import { listMilestones, getStudyStreak } from '@/lib/api/goals'

export function StudentDashboard() {
  const { user } = useAuth()
  const tz = useTimezone()
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [featuredGoal, setFeaturedGoal] = useState<any | null>(null)
  const [featuredMilestones, setFeaturedMilestones] = useState<any[]>([])
  const [streak, setStreak] = useState(0)
  const [recentNotes, setRecentNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      const [lessonsResult, goalsResult, recentNotesResult, streakResult] = await Promise.all([
        supabase
          .from('lessons')
          .select('*, teacher:profiles!lessons_teacher_id_fkey(id, full_name, display_name)')
          .eq('student_id', user!.id)
          .eq('status', 'scheduled')
          .gte('scheduled_start', new Date().toISOString())
          .order('scheduled_start', { ascending: true })
          .limit(3),

        supabase
          .from('student_goals')
          .select('*')
          .eq('student_id', user!.id)
          .eq('status', 'active')
          .order('target_date', { ascending: true, nullsFirst: false }),

        supabase
          .from('lesson_notes')
          .select('*, lesson:lessons(scheduled_start, teacher:profiles!lessons_teacher_id_fkey(full_name))')
          .eq('is_visible_to_student', true)
          .order('created_at', { ascending: false })
          .limit(3),

        getStudyStreak(user!.id),
      ])

      setUpcomingLessons(lessonsResult.data ?? [])
      setGoals(goalsResult.data ?? [])
      setRecentNotes(recentNotesResult.data ?? [])
      setStreak(streakResult)

      // Featured goal = soonest target date (or first active if no dates)
      const activeGoals: any[] = goalsResult.data ?? []
      const withDate = activeGoals.filter(g => g.target_date)
      const featured = withDate[0] ?? activeGoals[0] ?? null
      setFeaturedGoal(featured)
      if (featured) {
        const { milestones } = await listMilestones(featured.id)
        setFeaturedMilestones(milestones ?? [])
      }

      setLoading(false)
    }

    load()
  }, [user])

  const nextLesson = upcomingLessons[0]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  const daysUntil = featuredGoal?.target_date
    ? differenceInDays(new Date(featuredGoal.target_date), new Date())
    : null
  const completedMilestones = featuredMilestones.filter(m => m.completed).length
  const totalMilestones = featuredMilestones.length
  const milestonePct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          こんにちは！<span className="text-gray-500 font-normal text-lg ml-2">Welcome back</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'yyyy年M月d日')} ({format(new Date(), 'EEEE')})
        </p>
      </div>

      {nextLesson && (
        <Card className="bg-brand-light border-brand/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-brand font-medium uppercase tracking-wide">
                  Next Lesson / 次のレッスン
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatInTimeZone(new Date(nextLesson.scheduled_start), tz, 'M月d日 (EEE) HH:mm')}
                </p>
                <p className="text-sm text-gray-600">with {nextLesson.teacher?.full_name}</p>
              </div>
              <div className="flex flex-col gap-2">
                {nextLesson.meeting_url && (
                  <a
                    href={nextLesson.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark transition-colors"
                  >
                    Join / 参加する
                  </a>
                )}
                <Link to={`/lessons/${nextLesson.id}`} className="text-sm text-center text-brand hover:underline">
                  Details
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal countdown + streak row */}
      {(featuredGoal || streak > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Featured goal countdown */}
          {featuredGoal && (
            <Link to="/goals" className="lg:col-span-2 block group">
              <div className="bg-gradient-to-br from-brand to-brand/80 rounded-2xl p-5 text-white h-full">
                <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">目標 / Goal</p>
                <p className="text-lg font-semibold leading-tight">{featuredGoal.title}</p>

                {daysUntil !== null && (
                  <div className="mt-3 flex items-end gap-2">
                    <span className={`text-5xl font-bold leading-none ${daysUntil < 0 ? 'text-red-300' : daysUntil < 14 ? 'text-yellow-300' : 'text-white'}`}>
                      {Math.abs(daysUntil)}
                    </span>
                    <span className="text-white/70 text-sm mb-1.5">
                      {daysUntil < 0 ? '日経過 / days past' : '日 / days to go'}
                    </span>
                  </div>
                )}

                {milestonePct !== null && (
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>Milestones</span>
                      <span>{completedMilestones} / {totalMilestones}</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${milestonePct}%` }}
                      />
                    </div>
                  </div>
                )}

                {goals.length > 1 && (
                  <p className="mt-3 text-xs text-white/50">+{goals.length - 1} more active goal{goals.length > 2 ? 's' : ''} →</p>
                )}
              </div>
            </Link>
          )}

          {/* Study streak */}
          {streak > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
              <span className="text-5xl mb-1">🔥</span>
              <span className="text-4xl font-bold text-orange-600">{streak}</span>
              <p className="text-orange-500 text-sm font-medium mt-1">day streak!</p>
              <p className="text-orange-400 text-xs mt-1">Keep studying every day</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">目標 Goals</CardTitle>
            <Link to="/goals" className="text-sm text-brand hover:underline">すべて見る</Link>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-500">No goals set yet.</p>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 4).map((goal: any) => {
                  const days = goal.target_date ? differenceInDays(new Date(goal.target_date), new Date()) : null
                  return (
                    <div key={goal.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
                        {days !== null && (
                          <p className={`text-xs ${days < 0 ? 'text-red-500' : days < 30 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {days < 0 ? `${Math.abs(days)}日経過` : `あと${days}日`}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-brand-dark bg-brand-light px-2 py-0.5 rounded-full shrink-0">進行中</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">最近のノート Lesson Notes</CardTitle>
            <Link to="/lessons" className="text-sm text-brand hover:underline">すべて見る</Link>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <p className="text-sm text-gray-500">No lesson notes yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note: any) => (
                  <div key={note.id} className="border rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      {note.lesson?.scheduled_start &&
                        formatInTimeZone(new Date(note.lesson.scheduled_start), tz, 'M月d日')}
                    </p>
                    {note.summary && (
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{note.summary}</p>
                    )}
                    {note.homework && (
                      <p className="text-xs text-orange-700 mt-1">宿題: {note.homework}</p>
                    )}
                    <Link to={`/lessons/${note.lesson_id}`} className="text-xs text-brand hover:underline mt-1 block">
                      詳細を見る →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 text-white border-0">
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="font-medium">Ready for your next lesson?</p>
            <p className="text-gray-400 text-sm">次のレッスンを予約しましょう</p>
          </div>
          <Link
            to="/book"
            className="bg-white text-gray-900 px-4 py-2 rounded font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            予約する / Book
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
