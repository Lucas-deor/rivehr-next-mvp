import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { requireAuth } from '@/lib/auth'
import { MembersTable } from '@/components/members/MembersTable'

export const metadata: Metadata = {
  title: 'Membros | RIVEHR',
}

export interface Member {
  id: string
  name: string
  role: string | null
  seniority: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  skills: string[] | null
  availability: string | null
  email: string | null
  linkedin_url: string | null
  created_at: string | null
  job_type: string | null
}

export default async function MembrosPage() {
  await requireAuth()
  const { tenantId, tenantSlug } = await getTenantContext()

  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('members')
    .select(`
      id, name, role, seniority, avatar_url, city, country,
      skills, availability, email, linkedin_url, created_at, job_type
    `)
    .eq('organization_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching members:', error)
    throw new Error('Erro ao carregar membros')
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Membros</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie o banco de talentos da sua organização
        </p>
      </div>

      <MembersTable
        initialMembers={(members as Member[]) ?? []}
        tenantSlug={tenantSlug}
        tenantId={tenantId}
      />
    </div>
  )
}
