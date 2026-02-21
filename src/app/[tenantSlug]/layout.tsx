import { requireAuth } from '@/lib/auth'
import { getTenantContext } from '@/lib/tenant'
import { TenantSidebar } from '@/components/tenant/TenantSidebar'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}) {
  // Garantir que usuário está autenticado
  const user = await requireAuth()
  
  // Obter contexto do tenant (validado pelo middleware)
  const tenantContext = await getTenantContext()
  const { tenantSlug } = await params
  
  return (
    <div className="flex h-screen">
      <TenantSidebar 
        tenantSlug={tenantSlug}
        user={user}
        userRole={tenantContext.userRole}
      />
      <main className="flex-1 overflow-y-auto bg-muted/50">
        {children}
      </main>
    </div>
  )
}
