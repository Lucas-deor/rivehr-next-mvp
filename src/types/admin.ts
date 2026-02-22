// Types for Platform Admin area

export interface Organization {
  id: string
  name: string
  slug: string
  is_active: boolean
  disabled_at: string | null
  created_at: string
}

export interface TenantOverview {
  organization_id: string
  organization_name: string
  organization_slug: string
  org_created_at: string
  users_count: number
  candidates_count: number
  jobs_count: number
  clients_count: number
}

export interface PlatformStats {
  total_organizations: number
  total_users: number
  total_jobs: number
  total_candidates: number
}

export interface AdminUserProfile {
  user_id: string
  role: string | null
  email?: string
}
