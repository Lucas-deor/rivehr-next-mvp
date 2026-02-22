// Types for Candidate Portal (isolated auth — not Supabase Auth)

export interface CandidateSession {
  memberId: string
  email: string
  iat?: number
  exp?: number
}

export interface CandidateOTP {
  id: string
  member_id: string
  otp: string
  expires_at: string
  created_at: string
}

export interface CandidateMember {
  id: string
  email: string
  name: string | null
  phone: string | null
  linkedin_url: string | null
  avatar_url: string | null
}
