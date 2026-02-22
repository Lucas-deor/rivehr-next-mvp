'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET!)

// -----------------------------------------------
// Passo 1 — Enviar OTP para cliente
// -----------------------------------------------
export async function clientLoginAction(email: string) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email inválido' }
  }

  const supabase = await createClient()

  // Verificar se cliente existe na tabela company_users
  const { data: companyUser, error: userError } = await supabase
    .from('company_users')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (userError || !companyUser) {
    return { success: false, error: 'Email não encontrado. Verifique se você possui acesso ao portal.' }
  }

  // Gerar OTP de 6 dígitos
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

  // Remover OTPs anteriores do mesmo utilizador
  await supabase
    .from('client_otps')
    .delete()
    .eq('company_user_id', companyUser.id)

  // Salvar novo OTP
  const { error: insertError } = await supabase
    .from('client_otps')
    .insert({
      company_user_id: companyUser.id,
      otp,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    return { success: false, error: 'Erro ao gerar código. Tente novamente.' }
  }

  // TODO: integrar envio de email via Resend/SendGrid/Supabase Edge Function
  // await sendOTPEmail(email, otp)

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Client OTP for ${email}: ${otp}`)
  }

  return { success: true }
}

// -----------------------------------------------
// Passo 2 — Verificar OTP e emitir JWT
// -----------------------------------------------
export async function verifyClientOTPAction(email: string, otp: string) {
  if (!email || !otp) {
    return { success: false, error: 'Email e código são obrigatórios' }
  }

  const supabase = await createClient()

  // Buscar company_user
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!companyUser) {
    return { success: false, error: 'Email não encontrado' }
  }

  // Verificar OTP não expirado
  const { data: otpRecord } = await supabase
    .from('client_otps')
    .select('id')
    .eq('company_user_id', companyUser.id)
    .eq('otp', otp)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!otpRecord) {
    return { success: false, error: 'Código inválido ou expirado' }
  }

  // Gerar JWT com jose
  const token = await new SignJWT({ companyUserId: companyUser.id, email: email.toLowerCase().trim() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET())

  // Salvar cookie httpOnly
  const cookieStore = await cookies()
  cookieStore.set('client_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  // Deletar OTP usado
  await supabase.from('client_otps').delete().eq('id', otpRecord.id)

  return { success: true }
}

// -----------------------------------------------
// Logout do cliente
// -----------------------------------------------
export async function clientLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('client_token')
  return { success: true }
}
