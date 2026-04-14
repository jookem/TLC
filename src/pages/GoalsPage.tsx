import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { format, differenceInDays } from 'date-fns'
import { PageError } from '@/components/shared/PageError'
import { toast } from 'sonner'
import { listMilestones, toggleMilestone, getStudyStreak } from '@/lib/api/goals'

const statusColors: Record<string, string> = {
  active: 'bg-brand-light text-brand-dark',
  achieved: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  dropped: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  active: '進行中',
  achieved: '達成！',
  paused: '一時停止',
  dropped: '取り消し',
}

export function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<any[]>([])
  const [milestonesByGoal, setMilestonesByGoal] = useState<Record<string, any[]>>({})
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadGoals() {
    if (!user) return
    try {
      const { data, error: err } = await supabase
        .from('student_goals')
        .select('*')
        .eq('student_id', user.id)
        .order('status', { ascending: true })
        .order('target_date', { ascending: true })
      if (err) throw err
      setGoals(data ?? [])

      // Load milestones for all goals
      const map: Record<string, any[]> = {}
      await Promise.all((data ?? []).map(async (g: any) => {
        const { milestones } = await listMilestones(g.id)
        map[g.id] = milestones ?? []
      }))
      setMilestonesByGoal(map)

      const s = await getStudyStreak(user.id)
      setStreak(s)
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGoals() }, [user])

  async function toggleAchieved(goal: any) {
    const newStatus = goal.status === 'achieved' ? 'active' : 'achieved'
    const { error: err } = await supabase
      .from('student_goals')
      .update({ status: newStatus })
      .eq('id', goal.id)
      .eq('student_id', user!.id)
    if (err) {
      toast.error('Could not update goal')
    } else {
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: newStatus } : g))
      if (newStatus === 'achieved') toast.success('目標達成！ Goal marked as achieved!')
    }
  }

  async function handleToggleMilestone(goalId: string, milestoneId: string, completed: boolean) {
    const { error: err } = await toggleMilestone(milestoneId, completed)
    if (err) { toast.error('Could not update milestone'); return }
    setMilestonesByGoal(prev => ({
      ...prev,
      [goalId]: (prev[goalId] ?? []).map(m =>
        m.id === milestoneId ? { ...m, completed } : m
      ),
    }))
  }

  if (error) return <PageError message={error} onRetry={loadGoals} />
  if (loading) return <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />

  const active = goals.filter(g => g.status === 'active')
  const achieved = goals.filter(g => g.status === 'achieved')
  const other = goals.filter(g => !['active', 'achieved'].includes(g.status))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">目標 / Goals</h1>
          <p className="text-gray-500 text-sm mt-1">Your learning goals set with your teacher.</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-lg font-bold text-orange-600 leading-none">{streak}</p>
              <p className="text-xs text-orange-500">day streak</p>
            </div>
          </div>
        )}
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">まだ目標がありません。</p>
            <p className="text-sm text-gray-400 mt-1">Your teacher will set learning goals for you here.</p>
          </CardContent>
        </Card>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">進行中 / Active</h2>
          {active.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              milestones={milestonesByGoal[goal.id] ?? []}
              onToggleAchieved={toggleAchieved}
              onToggleMilestone={handleToggleMilestone}
            />
          ))}
        </section>
      )}

      {achieved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">達成！ / Achieved</h2>
          {achieved.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              milestones={milestonesByGoal[goal.id] ?? []}
              onToggleAchieved={toggleAchieved}
              onToggleMilestone={handleToggleMilestone}
            />
          ))}
        </section>
      )}

      {other.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Other</h2>
          {other.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              milestones={milestonesByGoal[goal.id] ?? []}
              onToggleAchieved={toggleAchieved}
              onToggleMilestone={handleToggleMilestone}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function GoalCard({
  goal,
  milestones,
  onToggleAchieved,
  onToggleMilestone,
}: {
  goal: any
  milestones: any[]
  onToggleAchieved: (goal: any) => void
  onToggleMilestone: (goalId: string, milestoneId: string, completed: boolean) => void
}) {
  const daysUntil = goal.target_date
    ? differenceInDays(new Date(goal.target_date), new Date())
    : null
  const canToggle = goal.status === 'active' || goal.status === 'achieved'
  const completedCount = milestones.filter(m => m.completed).length
  const totalCount = milestones.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : null

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{goal.title}</h3>
            {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
            {goal.target_date && (
              <p className="text-xs text-gray-400 mt-1.5">
                目標日: {format(new Date(goal.target_date), 'yyyy年M月d日')}
                {daysUntil !== null && goal.status === 'active' && (
                  <span className={`ml-2 font-medium ${daysUntil < 0 ? 'text-red-500' : daysUntil < 30 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {daysUntil < 0 ? `${Math.abs(daysUntil)}日経過` : `あと${daysUntil}日`}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[goal.status] ?? ''}`}>
              {statusLabels[goal.status] ?? goal.status}
            </span>
            {canToggle && (
              <button
                onClick={() => onToggleAchieved(goal)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  goal.status === 'achieved'
                    ? 'text-gray-400 hover:text-gray-600'
                    : 'text-green-600 hover:bg-green-50 border border-green-200'
                }`}
              >
                {goal.status === 'achieved' ? 'Undo' : '✓ Mark achieved'}
              </button>
            )}
          </div>
        </div>

        {/* Milestone progress bar */}
        {progressPct !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Milestones</span>
              <span>{completedCount} / {totalCount}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestones list */}
        {milestones.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {milestones.map(m => (
              <li key={m.id} className="flex items-center gap-2.5">
                <button
                  onClick={() => onToggleMilestone(goal.id, m.id, !m.completed)}
                  className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                    m.completed
                      ? 'bg-brand border-brand text-white'
                      : 'border-gray-300 hover:border-brand'
                  }`}
                >
                  {m.completed && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                </button>
                <span className={`text-sm ${m.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {m.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
