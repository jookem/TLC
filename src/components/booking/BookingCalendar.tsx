import { useState } from 'react'
import { addDays, startOfWeek, format, isSameDay, parseISO, setHours, setMinutes } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createBookingRequest } from '@/lib/api/bookings'
import type { AvailabilitySlot } from '@/lib/types/database'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7)

interface BookingCalendarProps {
  teacherId: string
  teacherName: string
  availabilitySlots: AvailabilitySlot[]
  existingLessons: { scheduled_start: string; scheduled_end: string; status: string; student_id: string }[]
  studentId: string
  onBooked?: () => void
}

export function BookingCalendar({
  teacherId,
  availabilitySlots,
  existingLessons,
  studentId,
  onBooked,
}: BookingCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function isSlotAvailable(date: Date, hour: number): boolean {
    const dayOfWeek = date.getDay()
    const timeStr = `${String(hour).padStart(2, '0')}:00:00`

    const hasRecurring = availabilitySlots.some(slot => {
      if (slot.slot_type !== 'recurring' || slot.day_of_week !== dayOfWeek) return false
      return slot.start_time <= timeStr && slot.end_time > timeStr
    })

    const dateStr = format(date, 'yyyy-MM-dd')
    const hasOneOff = availabilitySlots.some(slot => {
      if (slot.slot_type !== 'one_off' || slot.specific_date !== dateStr) return false
      return slot.start_time <= timeStr && slot.end_time > timeStr
    })

    return hasRecurring || hasOneOff
  }

  function isSlotBooked(date: Date, hour: number): boolean {
    const slotStart = setMinutes(setHours(date, hour), 0)
    const slotEnd = setMinutes(setHours(date, hour + 1), 0)
    return existingLessons.some(lesson => {
      const lessonStart = parseISO(lesson.scheduled_start)
      const lessonEnd = parseISO(lesson.scheduled_end)
      return slotStart < lessonEnd && slotEnd > lessonStart
    })
  }

  function handleSlotClick(date: Date, hour: number) {
    if (!isSlotAvailable(date, hour) || isSlotBooked(date, hour)) return
    const start = setMinutes(setHours(date, hour), 0)
    const end = setMinutes(setHours(date, hour + 1), 0)
    setSelectedSlot({ start, end })
    setSubmitted(false)
  }

  async function handleSubmitBooking() {
    if (!selectedSlot) return
    setSubmitting(true)
    const result = await createBookingRequest({
      teacher_id: teacherId,
      requested_start: selectedSlot.start.toISOString(),
      requested_end: selectedSlot.end.toISOString(),
      student_note: note || undefined,
    })
    setSubmitting(false)
    if (!result.error) {
      setSubmitted(true)
      setSelectedSlot(null)
      setNote('')
      onBooked?.()
    }
  }

  return (
    <div className="space-y-4">
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">リクエストを送りました！</p>
          <p className="text-xs text-green-600">Booking request sent! Your teacher will confirm shortly.</p>
        </div>
      )}

      {selectedSlot && (
        <div className="border border-brand/30 bg-brand-light rounded-lg p-4 space-y-3">
          <div>
            <p className="font-medium text-brand-dark">予約リクエスト / Booking Request</p>
            <p className="text-sm text-brand-dark">
              {formatInTimeZone(selectedSlot.start, 'Asia/Tokyo', 'M月d日 (EEE) HH:mm')}
              {' - '}
              {formatInTimeZone(selectedSlot.end, 'Asia/Tokyo', 'HH:mm')} JST
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">メッセージ (任意) / Message (optional)</Label>
            <Textarea
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              placeholder="Any notes for your teacher..."
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmitBooking} disabled={submitting}>
              {submitting ? '送信中...' : 'リクエスト送信 / Send Request'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedSlot(null)}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)} disabled={weekOffset <= 0}>
          ← 前の週
        </Button>
        <span className="text-sm font-medium">
          {format(weekStart, 'M月d日')} – {format(addDays(weekStart, 6), 'M月d日, yyyy')}
        </span>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
          次の週 →
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-xs text-gray-400" />
            {days.map(day => (
              <div
                key={day.toISOString()}
                className={`p-2 text-center text-xs ${isSameDay(day, new Date()) ? 'bg-brand-light font-semibold text-brand-dark' : 'text-gray-600'}`}
              >
                <div>{format(day, 'EEE')}</div>
                <div className="text-base font-medium">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-1 text-xs text-gray-400 text-right pr-3 py-2">
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map(day => {
                const available = isSlotAvailable(day, hour)
                const booked = isSlotBooked(day, hour)
                const isPast = setMinutes(setHours(day, hour), 0) < new Date()
                const isSelected =
                  selectedSlot &&
                  isSameDay(selectedSlot.start, day) &&
                  selectedSlot.start.getHours() === hour

                let cellClass = 'h-8 mx-0.5 my-0.5 rounded cursor-default transition-colors'
                if (isPast) {
                  cellClass += ' bg-gray-50'
                } else if (isSelected) {
                  cellClass += ' bg-brand cursor-pointer'
                } else if (booked) {
                  cellClass += ' bg-brand-light cursor-not-allowed'
                } else if (available) {
                  cellClass += ' bg-green-100 hover:bg-green-200 cursor-pointer border border-green-200'
                } else {
                  cellClass += ' bg-white'
                }

                return (
                  <div
                    key={day.toISOString()}
                    className={cellClass}
                    onClick={() => !isPast && handleSlotClick(day, hour)}
                    title={
                      available && !booked && !isPast
                        ? `Click to book ${String(hour).padStart(2, '0')}:00 JST`
                        : booked ? 'Already booked' : ''
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-100 border border-green-200 rounded inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-brand-light rounded inline-block" />
          Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-brand rounded inline-block" />
          Selected
        </span>
      </div>
    </div>
  )
}
