import { useAuth } from '@/contexts/AuthContext'

/** Returns the current user's timezone, falling back to Asia/Tokyo */
export function useTimezone(): string {
  const { profile } = useAuth()
  return profile?.timezone ?? 'Asia/Tokyo'
}
