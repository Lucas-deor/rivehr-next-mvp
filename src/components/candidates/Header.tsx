'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { candidateLogoutAction } from '@/app/actions/candidates'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { toast } from 'sonner'

export function CandidateHeader() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleLogout() {
    startTransition(async () => {
      await candidateLogoutAction()
      toast.success('Sessão encerrada')
      router.push('/candidato/login')
    })
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">RiveHR — Portal do Candidato</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  )
}
