import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatInTimeZone } from 'date-fns-tz'
import { QuickNotesForm } from './QuickNotesForm'

const TZ = 'Asia/Tokyo'

const statusStyle: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  scheduled: 'bg-brand-light text-brand-dark',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-100 text-red-600',
}

type Props = {
  lesson: {
    id: string
    scheduled_start: string
    scheduled_end: string
    status: string
    lesson_type: string
  }
  notes?: {
    summary?: string | null
    areas_to_focus?: string | null
    homework?: string | null
  } | null
}

export function LessonCard({ lesson, notes }: Props) {
  const [open, setOpen] = useState(false)

  const date = formatInTimeZone(new Date(lesson.scheduled_start), TZ, 'MMM d, yyyy')
  const startTime = formatInTimeZone(new Date(lesson.scheduled_start), TZ, 'h:mm a')
  const endTime = formatInTimeZone(new Date(lesson.scheduled_end), TZ, 'h:mm a')
  const hasNotes = notes?.summary || notes?.areas_to_focus || notes?.homework

  return (
    <div className={`bg-white border rounded-lg px-4 py-3 space-y-2 ${open ? 'border-brand/30 shadow-sm' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900">{date}</span>
            <span className="text-xs text-gray-400">{startTime} – {endTime}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${statusStyle[lesson.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {lesson.status}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
              {lesson.lesson_type}
            </span>
          </div>

          {!open && (
            <div className="mt-1.5 space-y-0.5">
              {notes?.summary ? (
                <p className="text-sm text-gray-600 truncate">{notes.summary}</p>
              ) : (
                <p className="text-sm text-gray-300 italic">No notes yet</p>
              )}
              {notes?.areas_to_focus && (
                <p className="text-xs text-orange-600 truncate">
                  <span className="font-medium">Next focus:</span> {notes.areas_to_focus}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className={`text-xs px-3 py-1 rounded border transition-colors ${
              open
                ? 'border-brand text-brand bg-brand-light'
                : 'border-gray-200 text-gray-600 hover:border-brand/50 hover:text-brand'
            }`}
          >
            {open ? 'Close' : hasNotes ? 'Edit Notes' : 'Add Notes'}
          </button>
          <Link
            to={`/lessons/${lesson.id}`}
            className="text-xs text-gray-400 hover:text-brand"
            title="Full lesson editor"
          >
            ↗
          </Link>
        </div>
      </div>

      {open && (
        <QuickNotesForm
          lessonId={lesson.id}
          initialSummary={notes?.summary}
          initialAreasToFocus={notes?.areas_to_focus}
          initialHomework={notes?.homework}
        />
      )}
    </div>
  )
}
