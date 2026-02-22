export interface Job {
  id: string
  title: string
  company: string | null
  seniority: string | null
  city: string | null
  country: string | null
  work_model: string | null
  contract_type: string | null
  description: string | null
  requirements: string | null
  benefits: string | null
  activities: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  status: string | null
  step: number | null
  archive_reason: string | null
  archive_notes: string | null
  publish_salary: boolean | null
  publish_company: boolean | null
  is_published: boolean | null
  published_at: string | null
  updated_at: string | null
  created_at: string | null
  contract_type_id: string | null
  work_model_id: string | null
  seniority_id: string | null
  hiring_regime_id: string | null
  company_id: string | null
  salary_periodicity_id: string | null
  job_type: string | null
  job_owner_user_id: string | null
  job_owner_name: string | null
  sector: string | null
  hiring_deadline: string | null
  // join
  companies: { id: string; name: string; logo_url: string | null } | null
  // Candidate count from pipeline
  candidate_count?: number
}

export type JobStatus = 'active' | 'inactive' | 'draft' | 'archived' | 'to_approve'

export interface JobFilters {
  search: string
  status: string
  company: string
  jobType: string
}

export const EMPTY_FILTERS: JobFilters = {
  search: '',
  status: 'all',
  company: 'all',
  jobType: 'all',
}
