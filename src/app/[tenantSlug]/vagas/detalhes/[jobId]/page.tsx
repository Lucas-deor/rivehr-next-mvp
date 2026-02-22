import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { JobTitleEdit } from '@/components/jobs/JobTitleEdit'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import { buildTenantPath } from '@/lib/tenant-utils'
import type { PipelineStage } from '@/types/pipeline'

interface Props {
  params: Promise<{ tenantSlug: string; jobId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: 'Pipeline | RIVEHR' }
}

export default async function PipelinePage({ params }: Props) {
  await requireAuth()
  const { tenantId, tenantSlug } = await getTenantContext()
  const { jobId } = await params

  const supabase = await createClient()

  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, status, company, companies ( id, name, logo_url )')
    .eq('id', jobId)
    .eq('organization_id', tenantId)
    .single()

  if (jobError || !job) notFound()

  // Fetch pipeline stages
  const { data: stagesData } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('job_id', jobId)
    .order('position', { ascending: true })

  // Fetch candidates with member info
  const { data: candidatesData } = await supabase
    .from('job_candidates')
    .select(`
      id, job_id, member_id, stage_id, source, origin_type,
      origin_user_id, notes, rejection_reason, rejection_notes,
      added_at, updated_at,
      member:members ( id, name, role, seniority, avatar_url, city, country, skills, availability )
    `)
    .eq('job_id', jobId)

  // Attach candidates to stages
  const stages: PipelineStage[] = (stagesData ?? []).map((stage) => ({
    ...stage,
    candidates: (candidatesData ?? []).filter((c) => c.stage_id === stage.id),
  }))

  const companyName = (job as any).companies?.name ?? job.company ?? null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href={buildTenantPath(tenantSlug, '/vagas/ver-vagas')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Vagas
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <JobTitleEdit jobId={jobId} initialTitle={job.title} />
            {companyName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {companyName}
              </p>
            )}
          </div>
          <Badge variant="outline" className="ml-auto">
            {candidatesData?.length ?? 0} candidatos
          </Badge>
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard
        initialStages={stages}
        jobId={jobId}
        tenantSlug={tenantSlug}
      />
    </div>
  )
}
