import { supabase } from '@/lib/supabase'

export async function login(email: string, password: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return {}
}

export async function signup(
  email: string,
  password: string,
  full_name: string,
  role: 'teacher' | 'student',
): Promise<{ error?: string }> {
  // Pass role + full_name as user metadata — the DB trigger reads these to create the profile
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name },
    },
  })
  if (error) return { error: error.message }
  if (!data.user) return { error: 'Signup failed. Please try again.' }
  return {}
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
