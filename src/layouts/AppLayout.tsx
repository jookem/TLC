import { Link, NavLink, Outlet } from 'react-router-dom'
import { AvatarMenu } from '@/components/shared/AvatarMenu'
import { useAuth } from '@/contexts/AuthContext'

const teacherNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/availability', label: 'Availability' },
  { href: '/lessons', label: 'Lessons' },
]

const studentNav = [
  { href: '/dashboard', label: 'ホーム', sub: 'Home' },
  { href: '/lessons', label: 'レッスン', sub: 'Lessons' },
  { href: '/book', label: '予約', sub: 'Book' },
  { href: '/goals', label: '目標', sub: 'Goals' },
  { href: '/vocabulary', label: '単語', sub: 'Vocab' },
]

export function AppLayout() {
  const { profile } = useAuth()
  if (!profile) return null

  const isTeacher = profile.role === 'teacher'
  const nav = isTeacher ? teacherNav : studentNav

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center">
                <img
                  src="/tlc_logo.svg"
                  alt="Toyooka Language Center"
                  width={100}
                  height={42}
                />
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {nav.map(item => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }: { isActive: boolean }) =>
                      `px-3 py-1.5 text-sm rounded-md transition-colors ${
                        isActive
                          ? 'text-brand font-medium bg-brand-light'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    {item.label}
                    {'sub' in item && typeof item.sub === 'string' && (
                      <span className="ml-1 text-xs text-gray-400">{item.sub}</span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
            <AvatarMenu profile={profile} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {!isTeacher && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="grid grid-cols-5 h-16">
            {studentNav.map(item => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex flex-col items-center justify-center transition-colors ${
                    isActive ? 'text-brand' : 'text-gray-600 hover:text-brand'
                  }`
                }
              >
                <span className="text-base">{item.label}</span>
                <span className="text-xs">{item.sub}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
