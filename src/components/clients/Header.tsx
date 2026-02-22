'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { clientLogoutAction } from '@/app/actions/clients'
import { Button } from '@/components/ui/button'
import { LogOut, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export function ClientHeader() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleLogout() {
    startTransition(async () => {
      await clientLogoutAction()
      toast.success('Sessão encerrada')
      router.push('/cliente/login')
    })
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">RiveHR — Portal do Cliente</span>
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
