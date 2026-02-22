'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET!)

// -----------------------------------------------
// Passo 1 — Enviar OTP para candidato
// -----------------------------------------------
export async function candidateLoginAction(email: string) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email inválido' }
  }

  const supabase = await createClient()

  // Verificar se candidato existe na tabela members
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (memberError || !member) {
    return { success: false, error: 'Email não encontrado. Verifique se você possui cadastro.' }
  }

  // Gerar OTP de 6 dígitos
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

  // Remover OTPs anteriores do mesmo membro
  await supabase
    .from('candidate_otps')
    .delete()
    .eq('member_id', member.id)

  // Salvar novo OTP
  const { error: insertError } = await supabase
    .from('candidate_otps')
    .insert({
      member_id: member.id,
      otp,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    return { success: false, error: 'Erro ao gerar código. Tente novamente.' }
  }

  // TODO: integrar envio de email via Resend/SendGrid/Supabase Edge Function
  // await sendOTPEmail(email, otp)

  // Em desenvolvimento: exibir OTP no log para testes
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Candidate OTP for ${email}: ${otp}`)
  }

  return { success: true }
}

// -----------------------------------------------
// Passo 2 — Verificar OTP e emitir JWT
// -----------------------------------------------
export async function verifyCandidateOTPAction(email: string, otp: string) {
  if (!email || !otp) {
    return { success: false, error: 'Email e código são obrigatórios' }
  }

  const supabase = await createClient()

  // Buscar membro
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!member) {
    return { success: false, error: 'Email não encontrado' }
  }

  // Verificar OTP não expirado
  const { data: otpRecord } = await supabase
    .from('candidate_otps')
    .select('id')
    .eq('member_id', member.id)
    .eq('otp', otp)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!otpRecord) {
    return { success: false, error: 'Código inválido ou expirado' }
  }

  // Gerar JWT com jose
  const token = await new SignJWT({ memberId: member.id, email: email.toLowerCase().trim() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET())

  // Salvar cookie httpOnly
  const cookieStore = await cookies()
  cookieStore.set('candidate_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  // Deletar OTP usado
  await supabase.from('candidate_otps').delete().eq('id', otpRecord.id)

  return { success: true }
}

// -----------------------------------------------
// Logout do candidato
// -----------------------------------------------
export async function candidateLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('candidate_token')
  return { success: true }
}
