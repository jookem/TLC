import { useAuth } from '@/contexts/AuthContext'
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard'
import { StudentDashboard } from '@/components/dashboard/StudentDashboard'

export function DashboardPage() {
  const { profile } = useAuth()
  if (!profile) return null
  return profile.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />
}
