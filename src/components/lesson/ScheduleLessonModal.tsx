import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createLesson } from '@/lib/api/lessons'

type Props = { studentId: string; studentName: string; onSaved?: () => void }

export function ScheduleLessonModal({ studentId, studentName, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [lessonType, setLessonType] = useState<'trial' | 'regular' | 'intensive'>('regular')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !startTime || !endTime) { setError('Date and times are required.'); return }

    const start = new Date(`${date}T${startTime}:00+09:00`)
    const end = new Date(`${date}T${endTime}:00+09:00`)
    if (end <= start) { setError('End time must be after start time.'); return }

    setLoading(true)
    setError('')
    const result = await createLesson({
      student_id: studentId,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      lesson_type: lessonType,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setDate('')
      setStartTime('')
      setEndTime('')
      onSaved?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">+ Log Lesson</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Lesson — {studentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <Label className="text-xs">Date</Label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start time (JST)</Label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <Label className="text-xs">End time (JST)</Label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Type</Label>
            <div className="flex gap-2 mt-1">
              {(['trial', 'regular', 'intensive'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLessonType(t)}
                  className={`flex-1 py-1.5 rounded text-sm border capitalize transition-colors ${
                    lessonType === t
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Lesson'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
