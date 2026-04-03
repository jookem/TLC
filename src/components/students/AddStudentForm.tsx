import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addStudentByEmail } from '@/lib/api/students'

export function AddStudentForm({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')
    const result = await addStudentByEmail(email)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Student added successfully.')
      setEmail('')
      setTimeout(() => {
        setOpen(false)
        setSuccess('')
        onAdded?.()
      }, 1500)
    }
  }

  if (!open) {
    return <Button size="sm" onClick={() => setOpen(true)}>+ Add Student</Button>
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="email"
        placeholder="Student's email address"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        className="w-64"
        autoFocus
        disabled={loading}
      />
      <Button type="submit" size="sm" disabled={loading || !email.trim()}>
        {loading ? 'Adding...' : 'Add'}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(false); setEmail(''); setError(''); setSuccess('') }} disabled={loading}>
        Cancel
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </form>
  )
}
