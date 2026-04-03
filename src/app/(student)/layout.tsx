import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AvatarMenu } from '@/components/shared/AvatarMenu'
import type { Profile } from '@/lib/types/database'

const navItems = [
  { href: '/dashboard', label: 'ホーム', labelEn: 'Home' },
  { href: '/lessons', label: 'レッスン', labelEn: 'Lessons' },
  { href: '/book', label: '予約', labelEn: 'Book' },
  { href: '/goals', label: '目標', labelEn: 'Goals' },
  { href: '/vocabulary', label: '単語', labelEn: 'Vocabulary' },
]

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="font-semibold text-gray-900">
                TLC English
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="ml-1 text-xs text-gray-400">{item.labelEn}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <AvatarMenu profile={profile as Profile} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="grid grid-cols-5 h-16">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <span className="text-base">{item.label}</span>
              <span className="text-xs">{item.labelEn}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
