import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createGoal, addMilestone } from '@/lib/api/goals'

export function GoalForm({
  studentId,
  teacherId,
  onSaved,
}: {
  studentId: string
  teacherId: string
  onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [milestoneInput, setMilestoneInput] = useState('')
  const [milestones, setMilestones] = useState<string[]>([])
  const [error, setError] = useState('')

  function addMilestoneLocal() {
    const t = milestoneInput.trim()
    if (!t) return
    setMilestones(prev => [...prev, t])
    setMilestoneInput('')
  }

  async function handleSubmit() {
    if (!title.trim()) return
    setLoading(true)
    setError('')
    const result = await createGoal({
      student_id: studentId,
      title: title.trim(),
      description: description.trim() || undefined,
      target_date: targetDate || undefined,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Add milestones if any
    if (milestones.length > 0 && result.goalId) {
      await Promise.all(
        milestones.map((m, i) => addMilestone(result.goalId!, studentId, m, i))
      )
    }

    setLoading(false)
    setTitle(''); setDescription(''); setTargetDate('')
    setMilestones([]); setMilestoneInput('')
    setOpen(false)
    onSaved?.()
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        + Add Goal
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">New Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="space-y-1">
          <Label className="text-xs">Goal</Label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="e.g. Pass EIKEN Grade 2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="More details..."
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Target Date (optional)</Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetDate(e.target.value)}
          />
        </div>

        {/* Milestones */}
        <div className="space-y-1.5">
          <Label className="text-xs">Milestones (optional)</Label>
          {milestones.length > 0 && (
            <ul className="space-y-1 mb-1">
              {milestones.map((m, i) => (
                <li key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-700">• {m}</span>
                  <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 text-xs ml-2">✕</button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              value={milestoneInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addMilestoneLocal() } }}
              placeholder="e.g. Complete grammar deck"
              className="text-sm"
            />
            <Button type="button" size="sm" variant="outline" onClick={addMilestoneLocal} disabled={!milestoneInput.trim()}>Add</Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? 'Saving...' : 'Save Goal'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
