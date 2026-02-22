/** Shared types for the Create Job Wizard. */

export interface WizardStage {
  id: string
  name: string
  color: string
  position: number
}

export interface WizardData {
  // Basic info
  title: string
  job_type: 'ux' | 'generic'
  sector?: string
  company_id?: string
  seniority?: string
  work_model?: string
  contract_type?: string
  city?: string
  country?: string
  hiring_deadline?: string
  // Content
  description?: string
  activities?: string
  requirements?: string
  benefits?: string
  // Salary
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  publish_salary?: boolean
  publish_company?: boolean
  // Pipeline
  stages: WizardStage[]
}

export interface LookupData {
  companies: Array<{ id: string; name: string }>
  seniorities: Array<{ id: string; name: string }>
}
