import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>TLC English Teaching & Learning Center</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {decodeURIComponent(error)}
            </div>
          )}
          <form action={signup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center border-2 border-gray-200 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    defaultChecked
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-xl mb-1">学生</div>
                    <div className="text-sm font-medium">Student</div>
                  </div>
                </label>
                <label className="flex items-center justify-center border-2 border-gray-200 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-xl mb-1">先生</div>
                    <div className="text-sm font-medium">Teacher</div>
                  </div>
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
