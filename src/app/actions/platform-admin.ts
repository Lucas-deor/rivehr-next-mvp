'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// -----------------------------------------------
// Guard: verificar ultra_master_admin
// Fallback duplo: user_profiles.role OU profiles.is_master_admin
// -----------------------------------------------
async function requireMasterAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Tentativa 1: user_profiles.role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role === 'ultra_master_admin') {
    return user
  }

  // Tentativa 2: profiles.is_master_admin (compatibilidade com vite app)
  const { data: legacyProfile } = await supabase
    .from('profiles')
    .select('is_master_admin')
    .eq('id', user.id)
    .single()

  if (legacyProfile?.is_master_admin === true) {
    return user
  }

  redirect('/unauthorized')
}

// -----------------------------------------------
// Criar organização
// -----------------------------------------------
export async function createOrgAction(name: string, slug: string) {
  await requireMasterAdmin()
  const supabase = await createClient()

  // Verificar slug único
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return { error: 'Slug já existe. Escolha outro.' }
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, slug, is_active: true })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/platform-admin/organizacoes')
  return { data }
}

// -----------------------------------------------
// Ativar / desativar organização
// -----------------------------------------------
export async function toggleOrgActiveAction(orgId: string, isActive: boolean) {
  await requireMasterAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update({
      is_active: isActive,
      disabled_at: isActive ? null : new Date().toISOString(),
    })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/platform-admin/organizacoes')
  return { success: true }
}

// -----------------------------------------------
// Deletar organização (soft-delete: desativar + marcar deleted_at se coluna existir)
// -----------------------------------------------
export async function deleteOrgAction(orgId: string) {
  await requireMasterAdmin()
  const supabase = await createClient()

  // Tentativa de soft-delete via deleted_at; fallback para desativar
  const { error } = await supabase
    .from('organizations')
    .update({
      is_active: false,
      disabled_at: new Date().toISOString(),
    })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/platform-admin/organizacoes')
  return { success: true }
}

// -----------------------------------------------
// Promover / revogar master admin
// Atualiza os dois campos (fallback duplo) simultaneamente
// -----------------------------------------------
export async function promoteToMasterAdminAction(userId: string, promote: boolean) {
  await requireMasterAdmin()
  const supabase = await createClient()

  // Atualizar user_profiles.role
  await supabase
    .from('user_profiles')
    .update({ role: promote ? 'ultra_master_admin' : 'user' })
    .eq('user_id', userId)

  // Atualizar profiles.is_master_admin (compatibilidade legada)
  await supabase
    .from('profiles')
    .update({ is_master_admin: promote })
    .eq('id', userId)

  revalidatePath('/platform-admin/configuracoes')
  return { success: true }
}
