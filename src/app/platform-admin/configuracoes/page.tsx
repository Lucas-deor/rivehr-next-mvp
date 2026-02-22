import { createClient } from '@/lib/supabase/server'
import { AdminSettingsForm } from '@/components/platform-admin/AdminSettingsForm'

export default async function PlatformAdminConfiguracoesPage() {
  const supabase = await createClient()

  // Buscar todos os ultra_master_admin (via user_profiles)
  const { data: adminProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, role')
    .eq('role', 'ultra_master_admin')

  // Buscar via profiles (fallback legado)
  const { data: legacyAdmins } = await supabase
    .from('profiles')
    .select('id, is_master_admin, email')
    .eq('is_master_admin', true)

  // Merge deduplicado
  const adminUserIds = new Set([
    ...(adminProfiles ?? []).map((p) => p.user_id),
    ...(legacyAdmins ?? []).map((p) => p.id),
  ])

  const admins = Array.from(adminUserIds).map((userId) => {
    const legacy = (legacyAdmins ?? []).find((p) => p.id === userId)
    return {
      user_id: userId,
      email: legacy?.email ?? null,
    }
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerenciar permissões de administradores da plataforma
        </p>
      </div>

      <AdminSettingsForm admins={admins} />
    </div>
  )
}
