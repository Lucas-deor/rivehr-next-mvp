# Fase 3: Autenticação e Middleware

**Duração Estimada**: 2-3 semanas  
**Prioridade**: 🔥 CRÍTICA  
**Status**: ⏳ Pendente

---

## 🎯 Objetivo

Implementar sistema robusto de autenticação com Supabase, middleware para proteção de rotas, resolução de tenants, e sistema de RBAC (Role-Based Access Control).

---

## 📋 Tarefas

### 1. Atualizar Middleware com Tenant Resolution [ ]

**Arquivo**: `middleware.ts` (atualizar)

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  
  const path = request.nextUrl.pathname
  
  // Rotas públicas (sem proteção)
  const publicPaths = [
    '/auth',
    '/empresas',
    '/s/',
  ]
  
  const isPublicPath = publicPaths.some(p => path.startsWith(p))
  
  if (isPublicPath) {
    return supabaseResponse
  }
  
  // Extrato tenant slug da URL: /:tenantSlug/*
  const tenantSlugMatch = path.match(/^\/([^/]+)/)
  const tenantSlug = tenantSlugMatch?.[1]
  
  // Rotas protegidas exigem autenticação
  if (!user) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Validar tenant (se aplicável)
  if (tenantSlug && !['admin', 'api', '_next'].includes(tenantSlug)) {
    const { createServerClient } = await import('@supabase/ssr')
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )
    
    // Verificar se usuário pertence ao tenant
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id, role, organizations!inner(slug)')
      .eq('user_id', user.id)
      .eq('organizations.slug', tenantSlug)
      .single()
    
    if (!orgUser) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    // Injetar tenant info nos headers para uso em Server Components
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    })
    
    response.headers.set('x-tenant-id', orgUser.organization_id)
    response.headers.set('x-tenant-slug', tenantSlug)
    response.headers.set('x-user-role', orgUser.role)
    
    return response
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Checklist**:
- [ ] Atualizar `middleware.ts`
- [ ] Implementar tenant resolution
- [ ] Validar acesso do usuário ao tenant
- [ ] Injetar headers `x-tenant-id`, `x-tenant-slug`, `x-user-role`
- [ ] Redirecionar para `/auth` se não autenticado
- [ ] Redirecionar para `/unauthorized` se tenant inválido
- [ ] Testar com múltiplos tenants

---

### 2. Criar Página de Login/Auth [ ]

**Arquivo**: `src/app/auth/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se já está autenticado, redirecionar
  if (user) {
    const redirectTo = searchParams.redirect || '/dashboard'
    redirect(redirectTo)
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">RIVEHR</h1>
          <p className="text-muted-foreground mt-2">
            Faça login para continuar
          </p>
        </div>
        
        <AuthForm redirectTo={searchParams.redirect} />
      </div>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar `src/app/auth/page.tsx`
- [ ] Verificar se usuário já está autenticado
- [ ] Redirecionar para página solicitada após login
- [ ] Criar layout limpo para auth

---

### 3. Criar Componente de Formulário de Auth (OTP) [ ]

**Arquivo**: `src/components/auth/AuthForm.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'Código deve ter 6 dígitos'),
})

type EmailFormData = z.infer<typeof emailSchema>
type OTPFormData = z.infer<typeof otpSchema>

interface AuthFormProps {
  redirectTo?: string
}

export function AuthForm({ redirectTo }: AuthFormProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })
  
  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })
  
  const onSendOTP = async (data: EmailFormData) => {
    setIsSubmitting(true)
    
    try {
      // Enviar OTP via Edge Function
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      
      if (!response.ok) {
        throw new Error('Erro ao enviar código')
      }
      
      setEmail(data.email)
      setStep('otp')
      toast.success('Código enviado para seu email!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar código. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const onVerifyOTP = async (data: OTPFormData) => {
    setIsSubmitting(true)
    
    try {
      // Verificar OTP via Edge Function
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp }),
      })
      
      if (!response.ok) {
        throw new Error('Código inválido')
      }
      
      const { session } = await response.json()
      
      // Supabase auth state será atualizado automaticamente
      toast.success('Login realizado com sucesso!')
      
      // Redirecionar
      router.push(redirectTo || '/dashboard')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Código inválido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (step === 'otp') {
    return (
      <div className="border rounded-lg p-8 bg-card">
        <h2 className="text-xl font-semibold mb-4">Digite o código</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>
        </p>
        
        <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4">
          <div>
            <Label htmlFor="otp">Código</Label>
            <Input
              id="otp"
              {...otpForm.register('otp')}
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
            {otpForm.formState.errors.otp && (
              <p className="text-sm text-destructive mt-1">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Verificar Código'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep('email')}
          >
            Usar outro email
          </Button>
        </form>
      </div>
    )
  }
  
  return (
    <div className="border rounded-lg p-8 bg-card">
      <h2 className="text-xl font-semibold mb-4">Digite seu email</h2>
      
      <form onSubmit={emailForm.handleSubmit(onSendOTP)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...emailForm.register('email')}
            placeholder="voce@empresa.com"
            autoFocus
          />
          {emailForm.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {emailForm.formState.errors.email.message}
            </p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar Código'}
        </Button>
      </form>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar `src/components/auth/AuthForm.tsx`
- [ ] Implementar fluxo de 2 steps (email → OTP)
- [ ] Integrar com Edge Functions de OTP
- [ ] Validar com Zod
- [ ] Adicionar feedback visual
- [ ] Testar fluxo completo

---

### 4. Criar API Routes para OTP [ ]

**Arquivo**: `src/app/api/auth/send-otp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }
    
    // Chamar Edge Function do Supabase
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      }
    )
    
    if (!response.ok) {
      throw new Error('Erro ao enviar OTP')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar OTP:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
```

**Arquivo**: `src/app/api/auth/verify-otp/route.ts`

```typescript
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
      throw new Error('OTP inválido')
    }
    
    const data = await response.json()
    
    // Criar sessão no Supabase Auth
    const supabase = await createClient()
    const { data: session, error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Erro ao verificar OTP:', error)
    return NextResponse.json(
      { error: 'OTP inválido' },
      { status: 401 }
    )
  }
}
```

**Checklist**:
- [ ] Criar `src/app/api/auth/send-otp/route.ts`
- [ ] Criar `src/app/api/auth/verify-otp/route.ts`
- [ ] Testar integração com Edge Functions
- [ ] Validar criação de sessão
- [ ] Adicionar error handling

---

### 5. Criar Hook useAuth [ ]

**Arquivo**: `src/hooks/use-auth.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      router.refresh()
    })
    
    return () => subscription.unsubscribe()
  }, [router, supabase])
  
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }
  
  return {
    user,
    loading,
    signOut,
  }
}
```

**Checklist**:
- [ ] Criar `src/hooks/use-auth.ts`
- [ ] Implementar listener de mudanças de auth
- [ ] Adicionar método `signOut`
- [ ] Testar em componentes client

---

### 6. Criar Helper para Tenant Context [ ]

**Arquivo**: `src/lib/tenant.ts`

```typescript
import { headers } from 'next/headers'

export async function getTenantContext() {
  const headersList = await headers()
  
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')
  const userRole = headersList.get('x-user-role') as 'owner' | 'admin' | 'member' | 'viewer' | null
  
  if (!tenantId || !tenantSlug) {
    throw new Error('Tenant context not found. Make sure middleware is configured.')
  }
  
  return {
    tenantId,
    tenantSlug,
    userRole,
  }
}

export function hasRole(userRole: string | null, allowedRoles: string[]) {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}
```

**Checklist**:
- [ ] Criar `src/lib/tenant.ts`
- [ ] Implementar `getTenantContext()` para Server Components
- [ ] Implementar `hasRole()` para validação de roles
- [ ] Documentar uso

---

### 7. Criar Componente RoleGuard [ ]

**Arquivo**: `src/components/auth/RoleGuard.tsx`

```tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: ('owner' | 'admin' | 'member' | 'viewer')[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, loading } = useAuth()
  
  // TODO: Buscar role do usuário (via context ou query)
  // Placeholder: assumir que todos têm acesso
  const userRole = 'member'
  
  if (loading) {
    return <div>Carregando...</div>
  }
  
  if (!user || !allowedRoles.includes(userRole as any)) {
    return fallback || <div>Acesso negado</div>
  }
  
  return <>{children}</>
}
```

**Checklist**:
- [ ] Criar `src/components/auth/RoleGuard.tsx`
- [ ] Integrar com role do usuário
- [ ] Testar com diferentes roles
- [ ] Adicionar loading state

---

### 8. Criar Página de Unauthorized [ ]

**Arquivo**: `src/app/unauthorized/page.tsx`

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-muted-foreground mb-8">
          Você não tem permissão para acessar esta página.
        </p>
        <Button asChild>
          <Link href="/">Voltar ao Início</Link>
        </Button>
      </div>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar `src/app/unauthorized/page.tsx`
- [ ] Design simples e informativo
- [ ] Adicionar botão de voltar

---

### 9. Implementar Redirect Pós-Login [ ]

**Lógica**: Capturar `redirect` query param e redirecionar após login bem-sucedido.

**Checklist**:
- [ ] Atualizar `AuthForm` para aceitar `redirectTo`
- [ ] Middleware adiciona `redirect` query param ao redirecionar para `/auth`
- [ ] Testar fluxo: tentar acessar página protegida → login → volta para página

---

### 10. Configurar Callback URL do Supabase [ ]

**No Supabase Dashboard**:
- Ir em Authentication → URL Configuration
- Adicionar `http://localhost:3000/auth/callback` em Redirect URLs
- Adicionar `https://yourdomain.com/auth/callback` em Redirect URLs

**Arquivo**: `src/app/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }
  
  // Return to error page if something goes wrong
  return NextResponse.redirect(new URL('/auth/error', request.url))
}
```

**Checklist**:
- [ ] Configurar Redirect URLs no Supabase
- [ ] Criar `src/app/auth/callback/route.ts`
- [ ] Testar fluxo de callback

---

## ✅ Critérios de Verificação

### Autenticação
- [ ] Login com OTP funciona end-to-end
- [ ] Sessão persiste após reload
- [ ] Logout funciona corretamente
- [ ] Redirect pós-login funciona

### Middleware
- [ ] Rotas protegidas exigem autenticação
- [ ] Tenant resolution funciona
- [ ] Usuário sem acesso ao tenant é bloqueado
- [ ] Headers de tenant são injetados corretamente

### RBAC
- [ ] Roles são validados no middleware
- [ ] `getTenantContext()` retorna dados corretos
- [ ] `RoleGuard` bloqueia acesso apropriadamente

### UX
- [ ] Feedback visual em todos os estados
- [ ] Mensagens de erro são claras
- [ ] Loading states funcionam
- [ ] Página de unauthorized é exibida quando necessário

---

## 🔧 Comandos de Teste

```bash
# Testar login
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verificar sessão
curl http://localhost:3000/api/auth/session

# Testar middleware
curl -I http://localhost:3000/acme-corp/vagas
```

---

## 🎯 Próxima Fase

**Fase 4: Área Autenticada - Leitura** (4 semanas)
