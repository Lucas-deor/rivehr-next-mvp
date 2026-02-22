'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Settings,
  Bot,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  {
    name: 'Dashboard',
    href: '/platform-admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Organizações',
    href: '/platform-admin/organizacoes',
    icon: Building2,
  },
  {
    name: 'QA Robot',
    href: '/platform-admin/qa-robot',
    icon: Bot,
  },
  {
    name: 'Configurações',
    href: '/platform-admin/configuracoes',
    icon: Settings,
  },
]

export function PlatformAdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">PA</span>
          </div>
          <h2 className="text-lg font-bold">Platform Admin</h2>
        </div>
        <p className="text-xs text-muted-foreground">Painel administrativo global</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          asChild
        >
          <Link href="/auth">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar ao app
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
