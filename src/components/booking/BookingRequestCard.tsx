import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveBookingRequest, declineBookingRequest } from '@/lib/api/bookings'
import { formatInTimeZone } from 'date-fns-tz'
import type { BookingRequestWithProfiles } from '@/lib/types/database'
import { useTimezone } from '@/lib/hooks/useTimezone'

export function BookingRequestCard({
  request,
  onHandled,
}: {
  request: BookingRequestWithProfiles
  onHandled?: () => void
}) {
  const tz = useTimezone()
  const [declining, setDeclining] = useState(false)
  const [declineNote, setDeclineNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await approveBookingRequest(request.id)
    setLoading(false)
    onHandled?.()
  }

  async function handleDecline() {
    if (!declining) {
      setDeclining(true)
      return
    }
    setLoading(true)
    await declineBookingRequest(request.id, declineNote)
    setLoading(false)
    onHandled?.()
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{request.student.full_name}</p>
            <p className="text-sm text-gray-600">
              {formatInTimeZone(new Date(request.requested_start), tz, 'MMM d, yyyy')}
              {' · '}
              {formatInTimeZone(new Date(request.requested_start), tz, 'h:mm a')}
              {' - '}
              {formatInTimeZone(new Date(request.requested_end), tz, 'h:mm a')}
            </p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</Badge>
        </div>

        {request.student_note && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 italic">
            &ldquo;{request.student_note}&rdquo;
          </p>
        )}

        {declining && (
          <Textarea
            value={declineNote}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeclineNote(e.target.value)}
            placeholder="Optional: reason for declining..."
            className="text-sm"
            rows={2}
          />
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleApprove} disabled={loading || declining} className="bg-green-600 hover:bg-green-700">
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={handleDecline} disabled={loading} className="text-red-600 border-red-200 hover:bg-red-50">
            {declining ? 'Confirm Decline' : 'Decline'}
          </Button>
          {declining && (
            <Button size="sm" variant="ghost" onClick={() => { setDeclining(false); setDeclineNote('') }} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
