import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Briefcase, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { buildTenantPath } from '@/lib/tenant-utils'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()
  const { tenantSlug, userRole, tenantId } = await getTenantContext()

  const supabase = await createClient()

  // Fetch stats in parallel
  const [jobsResult, membersResult, companiesResult, candidatesResult] = await Promise.all([
    supabase.from('jobs').select('id, status', { count: 'exact' }).eq('organization_id', tenantId),
    supabase.from('members').select('id', { count: 'exact' }).eq('organization_id', tenantId),
    supabase.from('companies').select('id', { count: 'exact' }).eq('organization_id', tenantId),
    supabase.from('job_candidates').select('id', { count: 'exact' }).in(
      'job_id',
      (await supabase.from('jobs').select('id').eq('organization_id', tenantId)).data?.map((j) => j.id) ?? []
    ),
  ])

  const totalJobs = jobsResult.count ?? 0
  const activeJobs = jobsResult.data?.filter((j) => j.status === 'active').length ?? 0
  const totalMembers = membersResult.count ?? 0
  const totalCompanies = companiesResult.count ?? 0
  const totalCandidates = candidatesResult.count ?? 0

  const stats = [
    {
      title: 'Vagas Ativas',
      value: activeJobs,
      total: totalJobs,
      description: `${totalJobs} vagas no total`,
      icon: Briefcase,
      href: buildTenantPath(tenantSlug, '/vagas/ver-vagas'),
    },
    {
      title: 'Membros',
      value: totalMembers,
      description: 'No banco de talentos',
      icon: Users,
      href: buildTenantPath(tenantSlug, '/membros'),
    },
    {
      title: 'Empresas Clientes',
      value: totalCompanies,
      description: 'Organizações cadastradas',
      icon: Building2,
      href: null,
    },
    {
      title: 'Total de Candidaturas',
      value: totalCandidates,
      description: 'Candidatos em pipelines',
      icon: TrendingUp,
      href: null,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo ao {tenantSlug}, {user.email}
        </p>
        {userRole && (
          <p className="text-sm text-muted-foreground">
            Sua função: <span className="font-medium capitalize">{userRole}</span>
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                {stat.href && (
                  <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs" asChild>
                    <Link href={stat.href}>
                      Ver detalhes <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick access */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acesso Rápido</CardTitle>
            <CardDescription>Atalhos para as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href={buildTenantPath(tenantSlug, '/vagas/ver-vagas')}>
                <Briefcase className="h-4 w-4" />
                Ver todas as vagas
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href={buildTenantPath(tenantSlug, '/membros')}>
                <Users className="h-4 w-4" />
                Banco de talentos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
