'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function PipelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Pipeline error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Erro ao carregar pipeline</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {error.message || 'Ocorreu um erro inesperado ao carregar os dados da vaga.'}
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
