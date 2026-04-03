import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { removeStudent } from '@/lib/api/students'

export function RemoveStudentButton({
  studentId,
  studentName,
  onRemoved,
}: {
  studentId: string
  studentName: string
  onRemoved?: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    await removeStudent(studentId)
    setLoading(false)
    onRemoved?.()
  }

  if (confirm) {
    return (
      <div className="flex gap-1">
        <Button size="sm" variant="destructive" onClick={handleRemove} disabled={loading} className="text-xs h-7 px-2">
          {loading ? '...' : 'Remove'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirm(false)} disabled={loading} className="text-xs h-7 px-2">
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setConfirm(true)}
      className="text-xs h-7 px-2 text-gray-400 hover:text-red-600"
      title={`Remove ${studentName}`}
    >
      ✕
    </Button>
  )
}
