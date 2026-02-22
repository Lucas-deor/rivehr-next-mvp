import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { CreateJobWizard } from '@/components/jobs/CreateJobWizard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { buildTenantPath } from '@/lib/tenant-utils'

export const metadata: Metadata = { title: 'Nova Vaga | RIVEHR' }

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function CriarVagaPage({ params }: Props) {
  await requireAuth()
  const { tenantId, tenantSlug } = await getTenantContext()
  const { tenantSlug: slug } = await params

  const supabase = await createClient()

  // Fetch lookup data in parallel
  const [companiesRes, seniorityRes] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name')
      .eq('organization_id', tenantId)
      .order('name'),
    supabase
      .from('seniority_levels')
      .select('id, name')
      .order('name'),
  ])

  const lookups = {
    companies: companiesRes.data ?? [],
    seniorities: seniorityRes.data ?? [],
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href={buildTenantPath(slug, '/vagas/ver-vagas')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Vagas
            </Link>
          </Button>
        </div>
        <h1 className="text-xl font-bold">Nova Vaga</h1>
        <p className="text-sm text-muted-foreground">
          Preencha as informações da vaga. Ela será salva como rascunho até ser publicada.
        </p>
      </div>

      {/* Wizard */}
      <div className="flex-1 overflow-hidden">
        <CreateJobWizard tenantSlug={slug} lookups={lookups} />
      </div>
    </div>
  )
}
