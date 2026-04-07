import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { format, differenceInDays } from 'date-fns'
import { PageError } from '@/components/shared/PageError'

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
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGoals() }, [user])

  if (error) return <PageError message={error} onRetry={loadGoals} />

  if (loading) {
    return <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
  }

  const active = goals.filter(g => g.status === 'active')
  const achieved = goals.filter(g => g.status === 'achieved')
  const other = goals.filter(g => !['active', 'achieved'].includes(g.status))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">目標 / Goals</h1>
        <p className="text-gray-500 text-sm mt-1">Your learning goals set with your teacher.</p>
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
          {active.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </section>
      )}

      {achieved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">達成！ / Achieved</h2>
          {achieved.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </section>
      )}

      {other.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Other</h2>
          {other.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </section>
      )}
    </div>
  )
}

function GoalCard({ goal }: { goal: any }) {
  const daysUntil = goal.target_date
    ? differenceInDays(new Date(goal.target_date), new Date())
    : null

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{goal.title}</h3>
            {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
            {goal.target_date && (
              <p className="text-xs text-gray-400 mt-2">
                目標日: {format(new Date(goal.target_date), 'yyyy年M月d日')}
                {daysUntil !== null && goal.status === 'active' && (
                  <span className={`ml-2 ${daysUntil < 0 ? 'text-red-500' : daysUntil < 30 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {daysUntil < 0 ? `${Math.abs(daysUntil)}日経過` : `あと${daysUntil}日`}
                  </span>
                )}
              </p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-3 ${statusColors[goal.status] ?? ''}`}>
            {statusLabels[goal.status] ?? goal.status}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
