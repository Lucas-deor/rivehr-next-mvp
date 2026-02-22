import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Bot } from 'lucide-react'
import type { TenantOverview } from '@/types/admin'

export default async function PlatformQARobotPage() {
  const supabase = await createClient()

  // Buscar visão geral de tenants (view master_admin_tenant_overview se existir)
  const { data: tenants } = await supabase
    .from('master_admin_tenant_overview')
    .select('*')
    .order('org_created_at', { ascending: false })

  // Fallback: organizations simples se a view não existir
  const { data: fallbackOrgs } = tenants
    ? { data: null }
    : await supabase
        .from('organizations')
        .select('id, name, slug, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

  const items: Pick<TenantOverview, 'organization_slug' | 'organization_name'>[] =
    tenants?.map((t: TenantOverview) => ({
      organization_slug: t.organization_slug,
      organization_name: t.organization_name,
    })) ??
    (fallbackOrgs ?? []).map((o) => ({
      organization_slug: o.slug,
      organization_name: o.name,
    }))

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QA Robot</h1>
          <p className="text-muted-foreground mt-1">
            Selecione um tenant para abrir o QA Robot correspondente
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum tenant encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.organization_slug} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{item.organization_name}</CardTitle>
                <p className="text-xs text-muted-foreground font-mono">{item.organization_slug}</p>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={`/${item.organization_slug}/qa-robot`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Abrir QA Robot
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
