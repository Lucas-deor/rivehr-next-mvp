// Types for Client Portal (isolated auth — not Supabase Auth)

export interface ClientSession {
  companyUserId: string
  email: string
  iat?: number
  exp?: number
}

export interface ClientOTP {
  id: string
  company_user_id: string
  otp: string
  expires_at: string
  created_at: string
}

export interface CompanyUser {
  id: string
  email: string
  name: string | null
  company_id: string
  role: string | null
}
