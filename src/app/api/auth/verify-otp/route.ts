import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()
    
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email e OTP são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Validar formato do OTP (6 dígitos)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP deve ter 6 dígitos' },
        { status: 400 }
      )
    }
    
    // Chamar Edge Function do Supabase
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, otp }),
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Edge Function error:', errorData)
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      )
    }
    
    const data = await response.json()
    
    // Criar sessão no Supabase Auth
    const supabase = await createClient()
    const { data: session, error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    
    if (error) {
      console.error('Error setting session:', error)
      throw error
    }
    
    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Erro ao verificar OTP:', error)
    return NextResponse.json(
      { error: 'Código inválido. Tente novamente.' },
      { status: 401 }
    )
  }
}
