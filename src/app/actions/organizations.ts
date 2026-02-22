'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/app/actions/jobs'

export interface OrganizationUpdateInput {
  name?: string
  logo_url?: string
}

export async function updateOrganizationAction(
  input: OrganizationUpdateInput
): Promise<ActionResult> {
  try {
    await requireAuth()
    const { tenantId, userRole } = await getTenantContext()

    if (userRole !== 'owner' && userRole !== 'admin') {
      return { error: 'Permissão negada. Apenas owners e admins podem alterar configurações.' }
    }

    const supabase = await createClient()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) updates.name = input.name.trim()
    if (input.logo_url !== undefined) updates.logo_url = input.logo_url ?? null

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', tenantId)

    if (error) return { error: error.message }

    revalidatePath('/[tenantSlug]/configuracoes', 'page')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado' }
  }
}
