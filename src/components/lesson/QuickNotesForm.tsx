import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { saveLessonNotes } from '@/lib/api/lessons'

type Props = {
  lessonId: string
  initialSummary?: string | null
  initialAreasToFocus?: string | null
  initialHomework?: string | null
}

export function QuickNotesForm({ lessonId, initialSummary, initialAreasToFocus, initialHomework }: Props) {
  const [summary, setSummary] = useState(initialSummary ?? '')
  const [areasToFocus, setAreasToFocus] = useState(initialAreasToFocus ?? '')
  const [homework, setHomework] = useState(initialHomework ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const autoSave = useCallback((s: string, a: string, h: string) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaving(true)
      await saveLessonNotes({ lesson_id: lessonId, summary: s, areas_to_focus: a, homework: h })
      setSaving(false)
      setSavedAt(new Date())
    }, 1500)
  }, [lessonId])

  return (
    <div className="space-y-3 pt-3 border-t">
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">What we covered</label>
        <Textarea
          value={summary}
          onChange={e => { setSummary(e.target.value); autoSave(e.target.value, areasToFocus, homework) }}
          placeholder="Topics covered, activities done, how the student performed..."
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Next session focus</label>
        <Textarea
          value={areasToFocus}
          onChange={e => { setAreasToFocus(e.target.value); autoSave(summary, e.target.value, homework) }}
          placeholder="What should we work on next time?"
          rows={2}
          className="mt-1 text-sm border-orange-200 focus-visible:ring-orange-300"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Homework</label>
        <Textarea
          value={homework}
          onChange={e => { setHomework(e.target.value); autoSave(summary, areasToFocus, e.target.value) }}
          placeholder="Assignments for the student before next lesson..."
          rows={1}
          className="mt-1 text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {saving ? 'Saving...' : savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setSaving(true)
              await saveLessonNotes({ lesson_id: lessonId, summary, areas_to_focus: areasToFocus, homework })
              setSaving(false)
              setSavedAt(new Date())
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Link to={`/lessons/${lessonId}`} className="text-xs text-brand hover:underline flex items-center">
            Full notes editor →
          </Link>
        </div>
      </div>
    </div>
  )
}
