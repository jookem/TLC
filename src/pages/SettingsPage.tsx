import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfileName, updatePassword } from '@/lib/api/settings'
import { joinTeacherByCode } from '@/lib/api/students'
import { toast } from 'sonner'

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [savingName, setSavingName] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [inviteInput, setInviteInput] = useState('')
  const [joiningCode, setJoiningCode] = useState(false)

  const [copied, setCopied] = useState(false)

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return
    setSavingName(true)
    const { error } = await updateProfileName(fullName)
    if (error) {
      toast.error(error)
    } else {
      await refreshProfile()
      toast.success('Name updated.')
    }
    setSavingName(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setSavingPassword(true)
    const { error } = await updatePassword(newPassword)
    if (error) {
      toast.error(error)
    } else {
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated.')
    }
    setSavingPassword(false)
  }

  async function handleJoinTeacher(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteInput.trim()) return
    setJoiningCode(true)
    const { error, teacherName } = await joinTeacherByCode(inviteInput)
    if (error) {
      toast.error(error)
    } else {
      setInviteInput('')
      toast.success(`Joined ${teacherName}'s class!`)
    }
    setJoiningCode(false)
  }

  function copyCode() {
    if (!profile?.invite_code) return
    navigator.clipboard.writeText(profile.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account</p>
      </div>

      {/* Teacher: invite code */}
      {profile?.role === 'teacher' && profile.invite_code && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Invite Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              Share this code with students so they can join your class from their Settings page.
            </p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-bold tracking-widest text-brand">
                {profile.invite_code}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student: join a teacher */}
      {profile?.role === 'student' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Join a Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinTeacher} className="space-y-4">
              <p className="text-sm text-gray-500">
                Enter the 6-character code your teacher gave you.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value.toUpperCase())}
                  placeholder="e.g. AB3K9X"
                  maxLength={6}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={joiningCode || inviteInput.length < 6}
                  className="px-4 py-2 bg-brand text-white text-sm rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {joiningCode ? 'Joining…' : 'Join Class'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={savingName || !fullName.trim() || fullName === profile?.full_name}
              className="px-4 py-2 bg-brand text-white text-sm rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingName ? 'Saving…' : 'Save Name'}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-brand text-white text-sm rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
