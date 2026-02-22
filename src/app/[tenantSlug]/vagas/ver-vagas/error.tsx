'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function VerVagasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('VerVagas error:', error)
  }, [error])

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar vagas</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {error.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
        </p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  )
}
