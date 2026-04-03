import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// This is a routing page that redirects teacher/student
// to their respective route-group dashboards.
// The (teacher)/dashboard and (student)/dashboard pages handle the actual UI.
export default async function DashboardRouter() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Both roles use /dashboard URL but the layout.tsx in (teacher) and (student)
  // route groups handle role enforcement. Next.js will match the correct group.
  // Since both groups have a dashboard page, this shouldn't be needed in practice.
  // If here, just show nothing - the middleware handles routing.
  return null
}
