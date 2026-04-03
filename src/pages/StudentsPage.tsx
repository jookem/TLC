import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AddStudentModal } from '@/components/students/AddStudentModal'
import { RemoveStudentButton } from '@/components/students/RemoveStudentButton'

export function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadStudents() {
    if (!user) return
    const { data } = await supabase
      .from('teacher_student_relationships')
      .select('*, student:profiles!teacher_student_relationships_student_id_fkey(*)')
      .eq('teacher_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })

    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadStudents()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} active</p>
        </div>
        <AddStudentModal onAdded={loadStudents} />
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No students yet.</p>
            <p className="text-sm mt-1">Add a student by entering their email address above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((rel: any) => (
            <StudentCard key={rel.id} relationship={rel} onRemoved={loadStudents} />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentCard({ relationship, onRemoved }: { relationship: any; onRemoved: () => void }) {
  const student = relationship.student
  const initials = student.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Card className="hover:border-brand/50 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <Link to={`/students/${student.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={student.avatar_url} />
              <AvatarFallback className="bg-brand-light text-brand-dark font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{student.email}</p>
            </div>
          </Link>
          <RemoveStudentButton studentId={student.id} studentName={student.full_name} onRemoved={onRemoved} />
        </div>
      </CardContent>
    </Card>
  )
}
