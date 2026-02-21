import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Erro na Autenticação</h1>
        <p className="text-muted-foreground mb-8">
          Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.
        </p>
        <Button asChild>
          <Link href="/auth">Voltar ao Login</Link>
        </Button>
      </div>
    </div>
  )
}
