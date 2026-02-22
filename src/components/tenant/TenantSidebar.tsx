'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Building2, 
  Settings, 
  LogOut,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import type { User } from '@supabase/supabase-js'

interface TenantSidebarProps {
  tenantSlug: string
  user: User
  userRole: string | null
}

export function TenantSidebar({ tenantSlug, user, userRole }: TenantSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  
  const navigation = [
    {
      name: 'Dashboard',
      href: `/${tenantSlug}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: 'Ver Vagas',
      href: `/${tenantSlug}/vagas/ver-vagas`,
      icon: Briefcase,
    },
    {
      name: 'Membros',
      href: `/${tenantSlug}/membros`,
      icon: Users,
    },
    {
      name: 'Empresas',
      href: `/${tenantSlug}/empresas`,
      icon: Building2,
      disabled: true,
    },
    {
      name: 'Configurações',
      href: `/${tenantSlug}/configuracoes`,
      icon: Settings,
    },
  ]
  
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold">RIVEHR</h2>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {tenantSlug}
        </p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground cursor-not-allowed opacity-50"
              >
                <Icon className="h-4 w-4" />
                {item.name}
                <span className="ml-auto text-xs">Em breve</span>
              </div>
            )
          }
          
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

      {/* Quick action */}
      <div className="px-4 pb-2">
        <Button asChild className="w-full" size="sm">
          <Link href={`/${tenantSlug}/vagas/criar`}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova Vaga
          </Link>
        </Button>
      </div>
      
      <div className="p-4 border-t space-y-3">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{user.email}</p>
          {userRole && (
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
