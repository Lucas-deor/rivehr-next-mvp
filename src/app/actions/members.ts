'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/app/actions/jobs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemberNote {
  content: string
  author: string
  authorId: string
  createdAt: string
}

export interface LanguageEntry {
  language: string
  proficiency: 'básico' | 'intermediário' | 'avançado' | 'fluente' | 'nativo'
}

export interface SalaryExpectation {
  min?: number
  max?: number
  currency?: string
  periodicity?: string
  notes?: string
}

export interface MemberUpdateInput {
  name?: string
  role?: string
  seniority?: string
  city?: string
  country?: string
  availability?: string
  email?: string
  linkedin_url?: string
  job_type?: string
  // JSONB custom_fields sub-fields
  languagesWithProficiency?: LanguageEntry[]
  salaryByType?: Record<string, SalaryExpectation>
}

// ---------------------------------------------------------------------------
// updateMemberAction
// ---------------------------------------------------------------------------

export async function updateMemberAction(
  memberId: string,
  input: MemberUpdateInput
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { tenantId } = await getTenantContext()
    const supabase = await createClient()

    // Verify member belongs to tenant
    const { error: memberError } = await supabase
      .from('members')
      .select('id, custom_fields')
      .eq('id', memberId)
      .eq('organization_id', tenantId)
      .single()

    if (memberError) return { error: 'Membro não encontrado' }

    // Build top-level updates
    const topLevel: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) topLevel.name = input.name.trim()
    if (input.role !== undefined) topLevel.role = input.role ?? null
    if (input.seniority !== undefined) topLevel.seniority = input.seniority ?? null
    if (input.city !== undefined) topLevel.city = input.city ?? null
    if (input.country !== undefined) topLevel.country = input.country ?? null
    if (input.availability !== undefined) topLevel.availability = input.availability ?? null
    if (input.email !== undefined) topLevel.email = input.email ?? null
    if (input.linkedin_url !== undefined) topLevel.linkedin_url = input.linkedin_url ?? null
    if (input.job_type !== undefined) topLevel.job_type = input.job_type ?? null

    // Handle custom_fields sub-fields with a json merge approach
    if (input.languagesWithProficiency !== undefined || input.salaryByType !== undefined) {
      // Read current custom_fields first
      const { data: current } = await supabase
        .from('members')
        .select('custom_fields')
        .eq('id', memberId)
        .single()

      const existingCf = (current?.custom_fields as Record<string, unknown>) ?? {}
      const newCf: Record<string, unknown> = { ...existingCf }

      if (input.languagesWithProficiency !== undefined) {
        newCf.languagesWithProficiency = input.languagesWithProficiency
      }
      if (input.salaryByType !== undefined) {
        newCf.salaryByType = input.salaryByType
      }

      topLevel.custom_fields = newCf
    }

    const { error } = await supabase
      .from('members')
      .update(topLevel)
      .eq('id', memberId)
      .eq('organization_id', tenantId)

    if (error) return { error: error.message }

    revalidatePath(`/[tenantSlug]/membros`, 'page')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}

// ---------------------------------------------------------------------------
// appendMemberNoteAction
// ---------------------------------------------------------------------------

export async function appendMemberNoteAction(
  memberId: string,
  content: string,
  authorName: string
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { tenantId, userId } = await getTenantContext()
    const supabase = await createClient()

    if (!content.trim()) return { error: 'Nota não pode ser vazia' }

    // Fetch current custom_fields
    const { data, error: fetchError } = await supabase
      .from('members')
      .select('id, custom_fields')
      .eq('id', memberId)
      .eq('organization_id', tenantId)
      .single()

    if (fetchError || !data) return { error: 'Membro não encontrado' }

    const existingCf = (data.custom_fields as Record<string, unknown>) ?? {}
    const notes: MemberNote[] = (existingCf.generalNotesHistory as MemberNote[]) ?? []

    const newNote: MemberNote = {
      content: content.trim(),
      author: authorName,
      authorId: userId,
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('members')
      .update({
        custom_fields: {
          ...existingCf,
          generalNotesHistory: [newNote, ...notes],
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('organization_id', tenantId)

    if (error) return { error: error.message }

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}

// ---------------------------------------------------------------------------
// uploadResumeAction — handles Supabase Storage + member_private upsert
// ---------------------------------------------------------------------------

export async function uploadResumeAction(
  memberId: string,
  fileName: string,
  fileBase64: string,
  mimeType: string
): Promise<ActionResult<{ resumeUrl: string }>> {
  try {
    await requireAuth()
    const { tenantId } = await getTenantContext()
    const supabase = await createClient()

    // Verify member belongs to tenant
    const { error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('organization_id', tenantId)
      .single()

    if (memberError) return { error: 'Membro não encontrado' }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileBase64, 'base64')
    const storagePath = `resumes/${tenantId}/${memberId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('member-files')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) return { error: uploadError.message }

    // Upsert member_private
    const { error: privateError } = await supabase
      .from('member_private')
      .upsert({ member_id: memberId, resume_url: storagePath })

    if (privateError) return { error: privateError.message }

    return { data: { resumeUrl: storagePath } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}
