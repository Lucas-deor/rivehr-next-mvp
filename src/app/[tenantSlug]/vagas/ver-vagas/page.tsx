import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { JobsTable } from '@/components/jobs/JobsTable'
import type { Job } from '@/types/jobs'

export const metadata: Metadata = {
  title: 'Ver Vagas | RIVEHR',
}

export default async function VerVagasPage() {
  await requireAuth()
  const { tenantId, tenantSlug } = await getTenantContext()

  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      company,
      seniority,
      city,
      country,
      work_model,
      contract_type,
      status,
      step,
      is_published,
      published_at,
      created_at,
      updated_at,
      job_type,
      company_id,
      sector,
      archive_reason,
      companies ( id, name, logo_url )
    `)
    .eq('organization_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    throw new Error('Erro ao carregar vagas')
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Vagas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todas as suas vagas abertas e fechadas
        </p>
      </div>

      <JobsTable
        initialJobs={(jobs as unknown as Job[]) ?? []}
        tenantSlug={tenantSlug}
        tenantId={tenantId}
      />
    </div>
  )
}
