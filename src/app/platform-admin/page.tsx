import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, Users, Briefcase, UserCheck } from 'lucide-react'

export default async function PlatformAdminPage() {
  const supabase = await createClient()

  // Tentar usar RPC de stats — fallback para queries individuais
  const { data: rpcStats } = await supabase.rpc('get_master_admin_platform_stats')

  let stats = {
    total_organizations: 0,
    total_users: 0,
    total_jobs: 0,
    total_candidates: 0,
  }

  if (rpcStats && typeof rpcStats === 'object' && !Array.isArray(rpcStats)) {
    stats = rpcStats as typeof stats
  } else {
    const [
      { count: orgsCount },
      { count: usersCount },
      { count: jobsCount },
      { count: candidatesCount },
    ] = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }),
    ])

    stats = {
      total_organizations: orgsCount ?? 0,
      total_users: usersCount ?? 0,
      total_jobs: jobsCount ?? 0,
      total_candidates: candidatesCount ?? 0,
    }
  }

  const cards = [
    {
      title: 'Organizações',
      description: 'Total de tenants ativos',
      value: stats.total_organizations,
      icon: Building2,
    },
    {
      title: 'Usuários',
      description: 'Total na plataforma',
      value: stats.total_users,
      icon: Users,
    },
    {
      title: 'Vagas',
      description: 'Total criadas',
      value: stats.total_jobs,
      icon: Briefcase,
    },
    {
      title: 'Candidatos',
      description: 'Perfis de membros',
      value: stats.total_candidates,
      icon: UserCheck,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Platform Admin</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral de toda a plataforma RiveHR
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{card.value.toLocaleString('pt-BR')}</p>
                <CardDescription className="mt-1">{card.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
