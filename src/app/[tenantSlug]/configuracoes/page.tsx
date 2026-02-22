import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { ConfigForm } from '@/components/settings/ConfigForm'
import { hasRole } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { buildTenantPath } from '@/lib/tenant-utils'

export const metadata: Metadata = { title: 'Configurações | RIVEHR' }

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function ConfiguracoesPage({ params }: Props) {
  await requireAuth()
  const { tenantId, tenantSlug, userRole } = await getTenantContext()
  const { tenantSlug: slug } = await params

  // Only owners and admins can access settings
  if (!hasRole(userRole, ['owner', 'admin'])) {
    redirect(buildTenantPath(slug, '/dashboard'))
  }

  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('id', tenantId)
    .single()

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as informações da sua organização.
        </p>
      </div>

      <ConfigForm
        tenantId={tenantId}
        initialName={org?.name ?? tenantSlug}
        initialLogoUrl={org?.logo_url}
        tenantSlug={slug}
      />
    </div>
  )
}
