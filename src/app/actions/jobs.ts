'use server'

import DOMPurify from 'isomorphic-dompurify'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html) return null
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3'],
    ALLOWED_ATTR: [],
  })
  return clean === '<p></p>' || clean === '' ? null : clean
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateJobInput {
  title: string
  job_type: 'ux' | 'generic'
  sector?: string
  company_id?: string
  seniority?: string
  seniority_id?: string
  city?: string
  country?: string
  work_model?: string
  work_model_id?: string
  contract_type?: string
  contract_type_id?: string
  hiring_regime_id?: string
  hiring_deadline?: string
  job_owner_user_id?: string
  job_owner_name?: string
  description?: string
  activities?: string
  requirements?: string
  benefits?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_periodicity_id?: string
  publish_salary?: boolean
  publish_company?: boolean
  /** Initial pipeline stages to create alongside the job */
  stages?: Array<{ name: string; color: string; position: number }>
}

export interface ActionResult<T = void> {
  data?: T
  error?: string
}

// ---------------------------------------------------------------------------
// createJobAction
// ---------------------------------------------------------------------------

export async function createJobAction(
  input: CreateJobInput
): Promise<ActionResult<{ jobId: string }>> {
  try {
    await requireAuth()
    const { tenantId, userId } = await getTenantContext()
    const supabase = await createClient()

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title: input.title.trim(),
        job_type: input.job_type,
        sector: input.sector ?? null,
        company_id: input.company_id ?? null,
        seniority: input.seniority ?? null,
        seniority_id: input.seniority_id ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        work_model: input.work_model ?? null,
        work_model_id: input.work_model_id ?? null,
        contract_type: input.contract_type ?? null,
        contract_type_id: input.contract_type_id ?? null,
        hiring_regime_id: input.hiring_regime_id ?? null,
        hiring_deadline: input.hiring_deadline ?? null,
        job_owner_user_id: input.job_owner_user_id ?? userId,
        description: sanitizeHtml(input.description),
        activities: sanitizeHtml(input.activities),
        requirements: sanitizeHtml(input.requirements),
        benefits: sanitizeHtml(input.benefits),
        salary_min: input.salary_min ?? null,
        salary_max: input.salary_max ?? null,
        salary_currency: input.salary_currency ?? 'BRL',
        salary_periodicity_id: input.salary_periodicity_id ?? null,
        publish_salary: input.publish_salary ?? false,
        publish_company: input.publish_company ?? true,
        status: 'draft',
        step: 0,
        is_published: false,
        organization_id: tenantId,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    // Create pipeline stages if provided
    if (input.stages && input.stages.length > 0) {
      const { error: stagesError } = await supabase.from('pipeline_stages').insert(
        input.stages.map((s) => ({
          job_id: job.id,
          name: s.name,
          color: s.color,
          position: s.position,
        }))
      )
      if (stagesError) console.error('Failed to create stages:', stagesError.message)
    }

    revalidatePath(`/[tenantSlug]/vagas/ver-vagas`, 'page')

    return { data: { jobId: job.id } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}

// ---------------------------------------------------------------------------
// updateJobAction
// ---------------------------------------------------------------------------

export async function updateJobAction(
  jobId: string,
  fields: Partial<CreateJobInput>
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { tenantId } = await getTenantContext()
    const supabase = await createClient()

    const updates: Record<string, unknown> = {}

    if (fields.title !== undefined) updates.title = fields.title.trim()
    if (fields.job_type !== undefined) updates.job_type = fields.job_type
    if (fields.sector !== undefined) updates.sector = fields.sector ?? null
    if (fields.company_id !== undefined) updates.company_id = fields.company_id ?? null
    if (fields.seniority !== undefined) updates.seniority = fields.seniority ?? null
    if (fields.seniority_id !== undefined) updates.seniority_id = fields.seniority_id ?? null
    if (fields.city !== undefined) updates.city = fields.city ?? null
    if (fields.country !== undefined) updates.country = fields.country ?? null
    if (fields.work_model !== undefined) updates.work_model = fields.work_model ?? null
    if (fields.work_model_id !== undefined) updates.work_model_id = fields.work_model_id ?? null
    if (fields.contract_type !== undefined) updates.contract_type = fields.contract_type ?? null
    if (fields.contract_type_id !== undefined) updates.contract_type_id = fields.contract_type_id ?? null
    if (fields.hiring_deadline !== undefined) updates.hiring_deadline = fields.hiring_deadline ?? null
    if (fields.description !== undefined) updates.description = sanitizeHtml(fields.description)
    if (fields.activities !== undefined) updates.activities = sanitizeHtml(fields.activities)
    if (fields.requirements !== undefined) updates.requirements = sanitizeHtml(fields.requirements)
    if (fields.benefits !== undefined) updates.benefits = sanitizeHtml(fields.benefits)
    if (fields.salary_min !== undefined) updates.salary_min = fields.salary_min ?? null
    if (fields.salary_max !== undefined) updates.salary_max = fields.salary_max ?? null
    if (fields.salary_currency !== undefined) updates.salary_currency = fields.salary_currency
    if (fields.publish_salary !== undefined) updates.publish_salary = fields.publish_salary
    if (fields.publish_company !== undefined) updates.publish_company = fields.publish_company

    updates.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .eq('organization_id', tenantId)

    if (error) return { error: error.message }

    revalidatePath(`/[tenantSlug]/vagas/ver-vagas`, 'page')
    revalidatePath(`/[tenantSlug]/vagas/detalhes/${jobId}`, 'page')

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}

// ---------------------------------------------------------------------------
// updateJobTitleAction
// ---------------------------------------------------------------------------

export async function updateJobTitleAction(
  jobId: string,
  title: string
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { tenantId } = await getTenantContext()
    const supabase = await createClient()

    const trimmed = title.trim()
    if (!trimmed) return { error: 'Título não pode ser vazio' }

    const { error } = await supabase
      .from('jobs')
      .update({ title: trimmed, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('organization_id', tenantId)

    if (error) return { error: error.message }

    revalidatePath(`/[tenantSlug]/vagas/detalhes/${jobId}`, 'page')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}

// ---------------------------------------------------------------------------
// updateJobStatusAction
// ---------------------------------------------------------------------------

export async function updateJobStatusAction(
  jobId: string,
  status: 'active' | 'inactive' | 'archived'
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { tenantId } = await getTenantContext()
    const supabase = await createClient()

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'active') {
      updates.is_published = true
      updates.published_at = new Date().toISOString()
      updates.step = 2
    } else if (status === 'inactive') {
      updates.is_published = false
      updates.step = 1
    } else if (status === 'archived') {
      updates.is_published = false
      updates.step = 0
    }

    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .eq('organization_id', tenantId)

    if (error) return { error: error.message }

    revalidatePath(`/[tenantSlug]/vagas/ver-vagas`, 'page')
    revalidatePath(`/[tenantSlug]/vagas/detalhes/${jobId}`, 'page')

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}

// ---------------------------------------------------------------------------
// createPipelineStageAction
// ---------------------------------------------------------------------------

export async function createPipelineStageAction(
  jobId: string,
  name: string,
  color: string,
  position: number
): Promise<ActionResult<{ stageId: string }>> {
  try {
    await requireAuth()
    const { tenantId } = await getTenantContext()
    const supabase = await createClient()

    // Verify job belongs to tenant
    const { error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('organization_id', tenantId)
      .single()

    if (jobError) return { error: 'Vaga não encontrada' }

    const { data: stage, error } = await supabase
      .from('pipeline_stages')
      .insert({ job_id: jobId, name: name.trim(), color, position })
      .select('id')
      .single()

    if (error) return { error: error.message }

    revalidatePath(`/[tenantSlug]/vagas/detalhes/${jobId}`, 'page')
    return { data: { stageId: stage.id } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}

// ---------------------------------------------------------------------------
// reorderPipelineStagesAction
// ---------------------------------------------------------------------------

export async function reorderPipelineStagesAction(
  jobId: string,
  stages: Array<{ id: string; position: number }>
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { tenantId } = await getTenantContext()
    const supabase = await createClient()

    // Verify job belongs to tenant
    const { error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('organization_id', tenantId)
      .single()

    if (jobError) return { error: 'Vaga não encontrada' }

    // Update each stage position individually (Supabase doesn't support bulk upsert on multiple rows easily)
    const updates = stages.map((s) =>
      supabase
        .from('pipeline_stages')
        .update({ position: s.position, updated_at: new Date().toISOString() })
        .eq('id', s.id)
        .eq('job_id', jobId)
    )

    await Promise.all(updates)

    revalidatePath(`/[tenantSlug]/vagas/detalhes/${jobId}`, 'page')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}
