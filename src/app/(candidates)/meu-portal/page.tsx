import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function CandidatePortalPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meu Portal</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao seu espaço de candidato</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-primary" />
            Em desenvolvimento
          </CardTitle>
          <CardDescription>
            O portal do candidato está sendo construído.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Em breve você poderá:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Visualizar e editar seu perfil profissional</li>
            <li>Acompanhar suas candidaturas e processos seletivos</li>
            <li>Receber atualizações sobre seleções em andamento</li>
            <li>Gerenciar suas preferências de disponibilidade e salário</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
