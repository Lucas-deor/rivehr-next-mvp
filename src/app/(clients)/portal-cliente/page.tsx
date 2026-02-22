import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function ClientPortalPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Portal do Cliente</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao seu espaço de acompanhamento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-primary" />
            Em desenvolvimento
          </CardTitle>
          <CardDescription>
            O portal do cliente está sendo construído.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Em breve você poderá:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Visualizar shortlists de candidatos curados pela sua equipe de RH</li>
            <li>Deixar comentários e avaliações sobre candidatos</li>
            <li>Acompanhar o andamento dos processos seletivos</li>
            <li>Aprovar ou solicitar ajustes nos perfis apresentados</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
