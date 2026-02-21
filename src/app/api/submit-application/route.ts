import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      job_id, 
      full_name, 
      email, 
      phone, 
      linkedin_url, 
      resume_url, 
      message,
      consent,
      consent_version 
    } = body
    
    // Validações básicas
    if (!job_id || !full_name || !email || !consent) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }
    
    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Inserir candidatura
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id,
        full_name,
        email,
        phone: phone || null,
        linkedin_url: linkedin_url || null,
        resume_url: resume_url || null,
        message: message || null,
        status: 'pending',
        consent_at: new Date().toISOString(),
        consent_source: 'public_portal',
        consent_version: consent_version || 'v1',
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao inserir candidatura:', error)
      return NextResponse.json(
        { error: 'Erro ao processar candidatura' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro no POST:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
