# Fase 6: Admin Panel

**Duração Estimada**: 2 semanas  
**Prioridade**: 🟡 MÉDIA  
**Status**: ⏳ Pendente

---

## 🎯 Objetivo

Migrar área administrativa da plataforma (Platform Admin, QA Robot) e portais separados (candidatos e clientes) com **autenticação isolada**.

---

## 📋 Tarefas

### 1. Criar Rota /platform-admin [ ]

**Arquivo**: `src/app/platform-admin/layout.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlatformAdminSidebar } from '@/components/platform-admin/Sidebar'

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth')
  }
  
  // Verificar se é ultra_master_admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (profile?.role !== 'ultra_master_admin') {
    redirect('/unauthorized')
  }
  
  return (
    <div className="flex h-screen">
      <PlatformAdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar layout protegido para platform-admin
- [ ] Verificar role `ultra_master_admin`
- [ ] Redirecionar se não autorizado

---

### 2. Dashboard de Administração da Plataforma [ ]

**Arquivo**: `src/app/platform-admin/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function PlatformAdminPage() {
  const supabase = await createClient()
  
  // Buscar estatísticas globais
  const [
    { count: totalOrgs },
    { count: totalUsers },
    { count: totalJobs },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true }),
  ])
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Platform Admin</h1>
      
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Organizações</CardTitle>
            <CardDescription>Total de tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalOrgs || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Total na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalUsers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vagas</CardTitle>
            <CardDescription>Total criadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalJobs || 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Checklist**:
- [ ] Dashboard com métricas globais
- [ ] Cards de estatísticas
- [ ] Acesso apenas para ultra_master_admin

---

### 3. Gerenciar Organizações [ ]

**Arquivo**: `src/app/platform-admin/organizacoes/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { OrganizationsTable } from '@/components/platform-admin/OrganizationsTable'

export default async function OrganizacoesPage() {
  const supabase = await createClient()
  
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*, user_profiles(count)')
    .order('created_at', { ascending: false })
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Organizações</h1>
      <OrganizationsTable organizations={organizations || []} />
    </div>
  )
}
```

**Checklist**:
- [ ] Listagem de organizações
- [ ] Ações: ativar/desativar, deletar
- [ ] Ver detalhes e usuários

---

### 4. Portal do Candidato (Autenticação Isolada) [ ]

**Referência**: `src/pages/CandidatoPortal.tsx`  
**Estratégia**: Usar **autenticação separada** com tabela `members` (sem Supabase Auth)

**Arquivo**: `src/app/(candidates)/meu-portal/layout.tsx`

```tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CandidateHeader } from '@/components/candidates/Header'

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const candidateToken = cookieStore.get('candidate_token')
  
  if (!candidateToken) {
    redirect('/candidato/login')
  }
  
  return (
    <div>
      <CandidateHeader />
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  )
}
```

**Checklist**:
- [ ] Layout separado para candidatos
- [ ] Autenticação baseada em token (JWT)
- [ ] Não usar Supabase Auth (usar tabela `members`)

---

### 5. Login de Candidato (OTP via email) [ ]

**Arquivo**: `src/app/candidato/login/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { candidateLoginAction, verifyCandidateOTPAction } from '@/app/actions/candidates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function CandidateLoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const handleSendOTP = async () => {
    setLoading(true)
    const result = await candidateLoginAction(email)
    setLoading(false)
    
    if (result.success) {
      toast.success('Código enviado para seu email')
      setStep('otp')
    } else {
      toast.error(result.error || 'Erro ao enviar código')
    }
  }
  
  const handleVerifyOTP = async () => {
    setLoading(true)
    const result = await verifyCandidateOTPAction(email, otp)
    setLoading(false)
    
    if (result.success) {
      toast.success('Login realizado!')
      router.push('/meu-portal')
    } else {
      toast.error(result.error || 'Código inválido')
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 border rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Portal do Candidato</h1>
        
        {step === 'email' ? (
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Seu email cadastrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleSendOTP}
              disabled={loading || !email}
            >
              Enviar Código
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Digite o código enviado para {email}
            </p>
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            <Button
              className="w-full"
              onClick={handleVerifyOTP}
              disabled={loading || !otp}
            >
              Verificar Código
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep('email')}
            >
              Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Checklist**:
- [ ] Login com OTP (não usar Supabase Auth)
- [ ] Server Actions para enviar/verificar OTP
- [ ] Cookie com JWT para sessão

---

### 6. Server Actions para Candidatos [ ]

**Arquivo**: `src/app/actions/candidates.ts`

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function candidateLoginAction(email: string) {
  const supabase = await createClient()
  
  // Verificar se candidato existe
  const { data: member } = await supabase
    .from('members')
    .select('id, email')
    .eq('email', email)
    .single()
  
  if (!member) {
    return { success: false, error: 'Email não encontrado' }
  }
  
  // Gerar OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
  
  // Salvar OTP
  await supabase
    .from('candidate_otps')
    .insert({
      member_id: member.id,
      otp,
      expires_at: expiresAt.toISOString(),
    })
  
  // Enviar email (integração com Resend/SendGrid)
  // await sendOTPEmail(email, otp)
  
  return { success: true }
}

export async function verifyCandidateOTPAction(email: string, otp: string) {
  const supabase = await createClient()
  
  // Buscar member
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('email', email)
    .single()
  
  if (!member) {
    return { success: false, error: 'Email não encontrado' }
  }
  
  // Verificar OTP
  const { data: otpRecord } = await supabase
    .from('candidate_otps')
    .select('*')
    .eq('member_id', member.id)
    .eq('otp', otp)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (!otpRecord) {
    return { success: false, error: 'Código inválido ou expirado' }
  }
  
  // Gerar JWT
  const token = jwt.sign(
    { memberId: member.id, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  
  // Salvar cookie
  const cookieStore = await cookies()
  cookieStore.set('candidate_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })
  
  // Deletar OTP usado
  await supabase
    .from('candidate_otps')
    .delete()
    .eq('id', otpRecord.id)
  
  return { success: true }
}
```

**Checklist**:
- [ ] Criar tabela `candidate_otps` (migration)
- [ ] Gerar e validar OTP
- [ ] Gerar JWT e salvar em cookie
- [ ] Integrar envio de email

---

### 7. Portal do Cliente (Autenticação Isolada) [ ]

**Referência**: `src/pages/ClientPortal.tsx`  
**Estratégia**: Similar ao portal do candidato, mas usando tabela `company_users`

**Arquivo**: `src/app/(clients)/portal-cliente/layout.tsx`

```tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClientHeader } from '@/components/clients/Header'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const clientToken = cookieStore.get('client_token')
  
  if (!clientToken) {
    redirect('/cliente/login')
  }
  
  return (
    <div>
      <ClientHeader />
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  )
}
```

**Checklist**:
- [ ] Layout separado para clientes
- [ ] Autenticação baseada em token (JWT)
- [ ] Usar tabela `company_users`

---

### 8. Migrar QA Robot [ ]

**Referência**: `src/pages/QARobot.tsx`  
**Arquivo**: `src/app/(authenticated)/[tenantSlug]/qa-robot/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { QARobotDashboard } from '@/components/qa-robot/Dashboard'

export default async function QARobotPage() {
  const { tenantId } = await getTenantContext()
  const supabase = await createClient()
  
  // Buscar análises do QA Robot
  const { data: qaReports } = await supabase
    .from('qa_robot_reports')
    .select('*')
    .eq('organization_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">QA Robot</h1>
      <QARobotDashboard reports={qaReports || []} />
    </div>
  )
}
```

**Checklist**:
- [ ] Dashboard de análises
- [ ] Executar análise de qualidade
- [ ] Exibir resultados com scores

---

### 9. Middleware para 3 Sistemas de Auth [ ]

**Atualizar**: `middleware.ts`

```tsx
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Portal do Candidato
  if (pathname.startsWith('/meu-portal')) {
    const token = request.cookies.get('candidate_token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/candidato/login', request.url))
    }
    
    try {
      jwt.verify(token, JWT_SECRET)
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/candidato/login', request.url))
    }
  }
  
  // 2. Portal do Cliente
  if (pathname.startsWith('/portal-cliente')) {
    const token = request.cookies.get('client_token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/cliente/login', request.url))
    }
    
    try {
      jwt.verify(token, JWT_SECRET)
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/cliente/login', request.url))
    }
  }
  
  // 3. Sistema Principal (Supabase Auth)
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Checklist**:
- [ ] 3 sistemas de autenticação simultâneos
- [ ] Rotas isoladas para cada portal
- [ ] Validação de JWT para candidatos/clientes

---

### 10. Criar Tabelas para Portais [ ]

**Arquivo**: `supabase/migrations/20240203_candidate_client_auth.sql`

```sql
-- Tabela para OTPs de candidatos
CREATE TABLE IF NOT EXISTS candidate_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidate_otps_member_id ON candidate_otps(member_id);
CREATE INDEX idx_candidate_otps_expires_at ON candidate_otps(expires_at);

-- Tabela para OTPs de clientes
CREATE TABLE IF NOT EXISTS client_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_user_id UUID NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_otps_company_user_id ON client_otps(company_user_id);
CREATE INDEX idx_client_otps_expires_at ON client_otps(expires_at);

-- Limpeza automática de OTPs expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM candidate_otps WHERE expires_at < NOW();
  DELETE FROM client_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Checklist**:
- [ ] Criar migration
- [ ] Executar `supabase db push`
- [ ] Testar tabelas

---

## ✅ Critérios de Verificação

- [ ] Platform Admin acessível apenas para ultra_master_admin
- [ ] Portal do Candidato funciona com OTP
- [ ] Portal do Cliente funciona com OTP
- [ ] 3 sistemas de autenticação isolados
- [ ] Middleware roteia corretamente
- [ ] QA Robot dashboard funciona

---

## 🎯 Próxima Fase

**Fase 7: Otimizações e Deploy** (2 semanas)
