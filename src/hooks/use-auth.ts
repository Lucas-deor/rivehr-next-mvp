'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * Client-side hook for auth state management
 * 
 * This hook should only be used in Client Components for UI conditional rendering.
 * For Server Components, use the helpers from @/lib/auth instead.
 * 
 * @returns {object} Auth state and methods
 * 
 * @example
 * ```tsx
 * 'use client'
 * 
 * export function UserProfile() {
 *   const { user, loading, signOut } = useAuth()
 *   
 *   if (loading) return <div>Loading...</div>
 *   if (!user) return <div>Not logged in</div>
 *   
 *   return (
 *     <div>
 *       <p>{user.email}</p>
 *       <button onClick={signOut}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      router.refresh()
    })
    
    return () => subscription.unsubscribe()
  }, [router, supabase])
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push('/auth')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
