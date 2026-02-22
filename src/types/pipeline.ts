export interface PipelineStage {
  id: string
  job_id: string
  name: string
  position: number
  color: string
  created_at: string
  updated_at: string
  candidates?: JobCandidate[]
}

export interface JobCandidate {
  id: string
  job_id: string
  member_id: string
  stage_id: string
  source: string | null
  origin_type: string | null
  origin_user_id: string | null
  notes: string | null
  rejection_reason: string | null
  rejection_notes: string | null
  added_at: string
  updated_at: string
  member: {
    id: string
    name: string
    role: string | null
    seniority: string | null
    avatar_url: string | null
    city: string | null
    country: string | null
    skills: string[] | null
    availability: string | null
  } | null
}
