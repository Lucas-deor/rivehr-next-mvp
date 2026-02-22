import { createClient } from '@/lib/supabase/server'
import { OrganizationsTable } from '@/components/platform-admin/OrganizationsTable'

export default async function OrganizacoesPage() {
  const supabase = await createClient()

  // Buscar organizações com contagem de usuários via subquery
  const { data: organizations } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      is_active,
      disabled_at,
      created_at
    `)
    .order('created_at', { ascending: false })

  // Buscar contagem de usuários por organização
  const orgIds = (organizations ?? []).map((o) => o.id)
  const userCountsMap: Record<string, number> = {}

  if (orgIds.length > 0) {
    const { data: userCounts } = await supabase
      .from('organization_users')
      .select('organization_id')
      .in('organization_id', orgIds)

    for (const row of userCounts ?? []) {
      userCountsMap[row.organization_id] = (userCountsMap[row.organization_id] ?? 0) + 1
    }
  }

  const orgsWithCounts = (organizations ?? []).map((org) => ({
    ...org,
    users_count: userCountsMap[org.id] ?? 0,
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Organizações</h1>
        <p className="text-muted-foreground mt-1">
          Gerenciar todos os tenants da plataforma
        </p>
      </div>

      <OrganizationsTable organizations={orgsWithCounts} />
    </div>
  )
}
