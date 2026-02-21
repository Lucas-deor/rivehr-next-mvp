import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Get the current authenticated user from Supabase session
 * 
 * This function should only be used in Server Components and Server Actions.
 * It returns the user if authenticated, or null if not.
 * 
 * @returns {Promise<User | null>} The authenticated user or null
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function ProfilePage() {
 *   const user = await getCurrentUser()
 *   if (!user) {
 *     return <div>Please log in</div>
 *   }
 *   return <div>Welcome {user.email}</div>
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Require authentication for a Server Component or Server Action
 * 
 * If the user is not authenticated, they will be redirected to the auth page
 * with a return URL to come back after login.
 * 
 * @param redirectTo - Optional custom redirect path after login (defaults to current path)
 * @returns {Promise<User>} The authenticated user
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function ProtectedPage() {
 *   const user = await requireAuth()
 *   // This code only runs if user is authenticated
 *   return <div>Welcome {user.email}</div>
 * }
 * ```
 */
export async function requireAuth(redirectTo?: string): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    // Get current path for redirect after login
    const returnPath = redirectTo || '/'
    redirect(`/auth?redirect=${encodeURIComponent(returnPath)}`)
  }
  
  return user
}

/**
 * Get the current user's session
 * 
 * @returns {Promise<{ user: User | null, session: any | null }>}
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return { user: null, session: null }
  }
  
  return { user: session?.user || null, session }
}
