import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface NotificationsContextValue {
  unreadCount: number
  clearUnread: () => void
}

const NotificationsContext = createContext<NotificationsContextValue>({
  unreadCount: 0,
  clearUnread: () => {},
})

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!user || !profile) return

    // Load initial count
    if (profile.role === 'teacher') {
      supabase
        .from('booking_requests')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('status', 'pending')
        .then(({ count }) => setUnreadCount(count ?? 0))
    }

    // Subscribe to realtime changes
    const channelName = `notifications:${user.id}`
    const channel = supabase.channel(channelName)

    if (profile.role === 'teacher') {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_requests',
          filter: `teacher_id=eq.${user.id}`,
        },
        () => setUnreadCount(n => n + 1),
      )
    } else {
      // Students: notify when a booking request status changes (approved/declined)
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'booking_requests',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status
          if (newStatus === 'approved' || newStatus === 'declined') {
            setUnreadCount(n => n + 1)
          }
        },
      )
    }

    channel.subscribe()
    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [user, profile])

  function clearUnread() {
    setUnreadCount(0)
  }

  return (
    <NotificationsContext.Provider value={{ unreadCount, clearUnread }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
