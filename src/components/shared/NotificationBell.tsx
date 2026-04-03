import { Bell } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function NotificationBell() {
  const { unreadCount, clearUnread } = useNotifications()
  const { profile } = useAuth()
  const navigate = useNavigate()

  function handleClick() {
    clearUnread()
    // Teachers go to calendar (booking requests), students go to lessons
    navigate(profile?.role === 'teacher' ? '/calendar' : '/lessons')
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      aria-label="Notifications"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
