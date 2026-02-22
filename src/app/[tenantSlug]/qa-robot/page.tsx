import { requireAuth } from '@/lib/auth'
import { getTenantContext } from '@/lib/tenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Zap, BarChart2, AlertTriangle, CheckCircle } from 'lucide-react'

export default async function QARobotPage() {
  await requireAuth()
  const { tenantSlug } = await getTenantContext()

  const features = [
    {
      icon: Zap,
      title: 'Execução de análises',
      description: 'Rodadas automáticas de QA nas vagas e candidatos do tenant',
    },
    {
      icon: AlertTriangle,
      title: 'Detecção de issues',
      description: 'Identificação de inconsistências, dados incompletos e alertas de qualidade',
    },
    {
      icon: BarChart2,
      title: 'Métricas de cobertura',
      description: 'Score geral de qualidade dos dados e histórico de execuções',
    },
    {
      icon: CheckCircle,
      title: 'Relatório de saúde',
      description: 'Visão consolidada do estado do tenant com recomendações de melhoria',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QA Robot</h1>
          <p className="text-muted-foreground mt-0.5">
            Tenant: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{tenantSlug}</code>
          </p>
        </div>
      </div>

      <Card className="mb-6 border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Em desenvolvimento
          </CardTitle>
          <CardDescription>
            O módulo QA Robot está sendo implementado. Abaixo você encontra uma prévia das
            funcionalidades que estarão disponíveis em breve.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="opacity-60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
