import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlatformAdminSidebar } from '@/components/platform-admin/Sidebar'

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Verificação com fallback duplo
  let isMasterAdmin = false

  // Tentativa 1: user_profiles.role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role === 'ultra_master_admin') {
    isMasterAdmin = true
  }

  // Tentativa 2 (fallback): profiles.is_master_admin
  if (!isMasterAdmin) {
    const { data: legacyProfile } = await supabase
      .from('profiles')
      .select('is_master_admin')
      .eq('id', user.id)
      .single()

    if (legacyProfile?.is_master_admin === true) {
      isMasterAdmin = true
    }
  }

  if (!isMasterAdmin) {
    redirect('/unauthorized')
  }

  return (
    <div className="flex h-screen">
      <PlatformAdminSidebar />
      <main className="flex-1 overflow-y-auto bg-muted/50 p-6">
        {children}
      </main>
    </div>
  )
}
