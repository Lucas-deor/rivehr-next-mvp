import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Briefcase, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()
  const { tenantSlug, userRole } = await getTenantContext()
  
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Vagas
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Será implementado na FASE4
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Candidatos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Será implementado na FASE4
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empresas Clientes
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Será implementado na FASE4
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Será implementado na FASE4
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🎉 Autenticação Configurada!</CardTitle>
          <CardDescription>
            FASE 3 completa - Sistema de autenticação com OTP e middleware de tenant resolution implementado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            As próximas funcionalidades (criação de vagas, gestão de candidatos, etc.) serão implementadas nas fases seguintes.
          </p>
          <ul className="text-sm space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Autenticação com OTP via email
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Middleware com validação de tenant
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Proteção de rotas automática
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Sistema preparado para RBAC
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
