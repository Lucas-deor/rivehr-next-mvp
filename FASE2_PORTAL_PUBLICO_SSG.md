# Fase 2: Portal Público com SSG

**Duração Estimada**: 3 semanas  
**Prioridade**: 🔥 CRÍTICA (maior ROI em SEO e performance)  
**Status**: ⏳ Pendente

---

## 🎯 Objetivo

Migrar as páginas públicas do portal (sem autenticação) usando **Static Site Generation (SSG)** e **Incremental Static Regeneration (ISR)** para otimizar SEO e performance.

---

## 📋 Tarefas

### 1. Criar Layout Público [ ]

**Arquivo**: `src/app/(public)/layout.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header público */}
      <header className="border-b">
        <nav className="container mx-auto px-4 py-4">
          {/* Logo e navegação básica */}
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 RIVEHR - Powered by Deeploy
        </div>
      </footer>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar diretório `src/app/(public)/`
- [ ] Criar `layout.tsx` com header e footer
- [ ] Adicionar logo RIVEHR
- [ ] Testar responsividade

---

### 2. Migrar Página de Vagas Públicas por Empresa [ ]

**Referência Original**: `src/pages/PublicCompanyJobs.tsx`

**Arquivo**: `src/app/(public)/empresas/[slug]/vagas/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { JobCard } from '@/components/public/JobCard'
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
}

// Gerar páginas estáticas em build time
export async function generateStaticParams() {
  const supabase = await createClient()
  
  const { data: companies } = await supabase
    .from('companies')
    .select('slug')
    .not('slug', 'is', null)
  
  return companies?.map((company) => ({
    slug: company.slug,
  })) || []
}

// SEO dinâmico
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient()
  
  const { data: company } = await supabase
    .from('companies')
    .select('name, description')
    .eq('slug', params.slug)
    .single()
  
  if (!company) {
    return {
      title: 'Empresa não encontrada',
    }
  }
  
  return {
    title: `Vagas - ${company.name}`,
    description: company.description || `Veja todas as vagas abertas na ${company.name}`,
    openGraph: {
      title: `Vagas - ${company.name}`,
      description: company.description || '',
      type: 'website',
    },
  }
}

export default async function CompanyJobsPage({ params }: PageProps) {
  const supabase = await createClient()
  
  // Buscar empresa e vagas em paralelo
  const [
    { data: company },
    { data: jobs }
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('*')
      .eq('slug', params.slug)
      .single(),
    supabase
      .from('jobs')
      .select(`
        *,
        companies!inner(name, slug)
      `)
      .eq('companies.slug', params.slug)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
  ])
  
  if (!company) {
    notFound()
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Company Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">{company.name}</h1>
        {company.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {company.description}
          </p>
        )}
      </div>
      
      {/* Jobs Grid */}
      {jobs && jobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma vaga disponível no momento.
          </p>
        </div>
      )}
    </div>
  )
}

// ISR: Revalidar a cada 1 hora
export const revalidate = 3600
```

**Checklist**:
- [ ] Criar diretório `src/app/(public)/empresas/[slug]/vagas/`
- [ ] Criar `page.tsx` com SSG
- [ ] Implementar `generateStaticParams()`
- [ ] Implementar `generateMetadata()` para SEO
- [ ] Criar componente `JobCard` (Server Component)
- [ ] Configurar `revalidate = 3600` (1 hora)
- [ ] Testar com empresa real do banco
- [ ] Verificar que página é pré-renderizada no build

---

### 3. Criar Componente JobCard (Server Component) [ ]

**Arquivo**: `src/components/public/JobCard.tsx`

```tsx
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase, Clock } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface JobCardProps {
  job: {
    id: string
    title: string
    description?: string
    location?: string
    work_model?: string
    created_at: string
    companies: {
      name: string
      slug: string
    }
  }
}

export function JobCard({ job }: JobCardProps) {
  const jobSlug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}--${job.id}`
  
  return (
    <Link href={`/empresas/${job.companies.slug}/vagas/${jobSlug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="line-clamp-2">{job.title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatDistance(new Date(job.created_at), new Date(), {
              addSuffix: true,
              locale: ptBR,
            })}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {job.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2">
              {job.location && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </Badge>
              )}
              {job.work_model && (
                <Badge variant="outline" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.work_model}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Checklist**:
- [ ] Criar diretório `src/components/public/`
- [ ] Criar `JobCard.tsx` como Server Component
- [ ] Instalar `date-fns` (já instalado)
- [ ] Testar renderização
- [ ] Validar acessibilidade (links com contexto)

---

### 4. Migrar Página de Detalhes de Vaga Pública [ ]

**Referência Original**: `src/pages/PublicJobPage.tsx`

**Arquivo**: `src/app/(public)/empresas/[slug]/vagas/[jobId]/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ApplicationForm } from '@/components/public/ApplicationForm'
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string; jobId: string }
}

// Extrair ID real do slug (formato: titulo-vaga--<uuid>)
function extractJobId(jobSlug: string): string {
  const parts = jobSlug.split('--')
  return parts[parts.length - 1]
}

// Gerar páginas estáticas
export async function generateStaticParams() {
  const supabase = await createClient()
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, companies!inner(slug)')
    .eq('status', 'published')
  
  return jobs?.map((job) => {
    const jobSlug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}--${job.id}`
    return {
      slug: job.companies.slug,
      jobId: jobSlug,
    }
  }) || []
}

// SEO dinâmico com JSON-LD
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const jobId = extractJobId(params.jobId)
  const supabase = await createClient()
  
  const { data: job } = await supabase
    .from('jobs')
    .select('*, companies(name)')
    .eq('id', jobId)
    .single()
  
  if (!job) {
    return { title: 'Vaga não encontrada' }
  }
  
  return {
    title: `${job.title} - ${job.companies.name}`,
    description: job.description?.slice(0, 160) || 'Veja detalhes da vaga',
    openGraph: {
      title: job.title,
      description: job.description || '',
      type: 'website',
    },
  }
}

export default async function JobDetailsPage({ params }: PageProps) {
  const jobId = extractJobId(params.jobId)
  const supabase = await createClient()
  
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      companies(name, slug, description),
      seniority_levels(name),
      contract_types(name),
      work_models(name)
    `)
    .eq('id', jobId)
    .eq('status', 'published')
    .single()
  
  if (!job) {
    notFound()
  }
  
  // JSON-LD para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companies.name,
    },
    jobLocation: job.location ? {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    } : undefined,
    employmentType: job.contract_types?.name || 'FULL_TIME',
  }
  
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Job Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{job.title}</h1>
            <p className="text-xl text-muted-foreground">{job.companies.name}</p>
          </div>
          
          {/* Job Details */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {job.description && (
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Descrição da Vaga</h2>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </section>
              )}
              
              {/* Application Form */}
              <ApplicationForm jobId={job.id} companySlug={params.slug} />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Info Card */}
              <div className="border rounded-lg p-6 space-y-4">
                <h3 className="font-semibold">Informações</h3>
                {job.seniority_levels && (
                  <div>
                    <p className="text-sm text-muted-foreground">Senioridade</p>
                    <p className="font-medium">{job.seniority_levels.name}</p>
                  </div>
                )}
                {job.contract_types && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contrato</p>
                    <p className="font-medium">{job.contract_types.name}</p>
                  </div>
                )}
                {job.work_models && (
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo de Trabalho</p>
                    <p className="font-medium">{job.work_models.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const revalidate = 3600
```

**Checklist**:
- [ ] Criar `src/app/(public)/empresas/[slug]/vagas/[jobId]/page.tsx`
- [ ] Implementar extração de ID do slug
- [ ] Adicionar JSON-LD structured data
- [ ] Criar componente `ApplicationForm` (Client Component)
- [ ] Testar com vaga real
- [ ] Validar rich snippets no Google Search Console

---

### 5. Criar Formulário de Candidatura (Client Component) [ ]

**Arquivo**: `src/components/public/ApplicationForm.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const applicationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  resume_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface ApplicationFormProps {
  jobId: string
  companySlug: string
}

export function ApplicationForm({ jobId, companySlug }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })
  
  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    
    try {
      const supabase = createClient()
      
      // Submeter via Edge Function (já existe no projeto)
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          ...data,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erro ao enviar candidatura')
      }
      
      setSubmitted(true)
      toast.success('Candidatura enviada com sucesso!')
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar candidatura. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (submitted) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <h3 className="text-2xl font-semibold mb-2">Candidatura Enviada! ✅</h3>
        <p className="text-muted-foreground">
          Entraremos em contato em breve.
        </p>
      </div>
    )
  }
  
  return (
    <section className="border rounded-lg p-8">
      <h2 className="text-2xl font-semibold mb-6">Candidate-se</h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="João Silva"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="joao@email.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...form.register('phone')}
            placeholder="(11) 99999-9999"
          />
        </div>
        
        <div>
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            {...form.register('linkedin')}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar Candidatura'}
        </Button>
      </form>
    </section>
  )
}
```

**Checklist**:
- [ ] Criar `ApplicationForm.tsx` como Client Component (`'use client'`)
- [ ] Integrar com Edge Function `submit-application`
- [ ] Adicionar validação com Zod
- [ ] Implementar feedback visual (toast)
- [ ] Testar submissão ao banco
- [ ] Adicionar honeypot anti-bot (opcional)

---

### 6. Migrar Shortlist Público (SSR) [ ]

**Referência Original**: `src/pages/ShortlistView.tsx`

**Arquivo**: `src/app/(public)/s/[token]/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface PageProps {
  params: { token: string }
}

// NÃO usar generateStaticParams - tokens são dinâmicos e privados
// Esta página usa SSR (Server-Side Rendering)

export default async function ShortlistPage({ params }: PageProps) {
  const supabase = await createClient()
  
  // Buscar shortlist pelo token
  const { data: shortlist } = await supabase
    .from('shortlists')
    .select(`
      *,
      job:jobs(title, companies(name)),
      members:shortlist_members(
        member:members(*)
      )
    `)
    .eq('share_token', params.token)
    .single()
  
  if (!shortlist) {
    notFound()
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{shortlist.name}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {shortlist.job.companies.name} - {shortlist.job.title}
        </p>
        
        <div className="grid gap-6">
          {shortlist.members.map(({ member }) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {member.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{member.name}</CardTitle>
                    {member.current_position && (
                      <p className="text-sm text-muted-foreground">
                        {member.current_position}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {member.summary && (
                  <p className="text-sm">{member.summary}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// NÃO cachear - tokens podem ser revogados
export const dynamic = 'force-dynamic'
```

**Checklist**:
- [ ] Criar `src/app/(public)/s/[token]/page.tsx`
- [ ] Buscar shortlist por token
- [ ] Exibir candidatos da lista
- [ ] Usar `dynamic = 'force-dynamic'` (SSR sempre)
- [ ] Testar com token válido
- [ ] Implementar página 404 para tokens inválidos

---

### 7. Criar API Route para Submissão [ ]

**Arquivo**: `src/app/api/submit-application/route.ts`

```tsx
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id, name, email, phone, linkedin, resume_url } = body
    
    // Validações básicas
    if (!job_id || !name || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Inserir candidatura
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id,
        name,
        email,
        phone,
        linkedin,
        resume_url,
        status: 'pending',
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
```

**Checklist**:
- [ ] Criar `src/app/api/submit-application/route.ts`
- [ ] Validar dados recebidos
- [ ] Inserir em `job_applications`
- [ ] Retornar resposta apropriada
- [ ] Testar com Postman/Insomnia
- [ ] Adicionar rate limiting (futuro)

---

### 8. Configurar Redirects de Rotas Legacy [ ]

**Arquivo**: `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirect antigo /shortlist/:token → /s/:token
      {
        source: '/shortlist/:token',
        destination: '/s/:token',
        permanent: true,
      },
      // Redirect antigo formato de vaga
      {
        source: '/vagas/link/:jobId',
        destination: '/404',
        permanent: false,
      },
      // Adicionar outros redirects conforme necessário
    ]
  },
}

export default nextConfig
```

**Checklist**:
- [ ] Atualizar `next.config.ts` com redirects
- [ ] Mapear TODAS as rotas legacy (ver DOCUMENTATION.md)
- [ ] Testar cada redirect
- [ ] Documentar redirects criados

---

### 9. Otimizar Imagens Públicas [ ]

**Arquivo**: `next.config.ts` (atualizar)

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // ... redirects
}
```

**Checklist**:
- [ ] Configurar `remotePatterns` para Supabase Storage
- [ ] Substituir `<img>` por `<Image>` em JobCard
- [ ] Adicionar logos de empresas com next/image
- [ ] Testar carregamento de imagens

---

### 10. Implementar Sitemap Dinâmico [ ]

**Arquivo**: `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  
  // Buscar todas as vagas públicas
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, updated_at, companies!inner(slug)')
    .eq('status', 'published')
  
  const jobUrls = jobs?.map((job) => {
    const jobSlug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}--${job.id}`
    return {
      url: `https://yourdomain.com/empresas/${job.companies.slug}/vagas/${jobSlug}`,
      lastModified: new Date(job.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  }) || []
  
  return [
    {
      url: 'https://yourdomain.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    ...jobUrls,
  ]
}
```

**Checklist**:
- [ ] Criar `src/app/sitemap.ts`
- [ ] Incluir todas as vagas públicas
- [ ] Incluir páginas de empresas
- [ ] Atualizar domain no código
- [ ] Testar geração: `curl http://localhost:3000/sitemap.xml`

---

### 11. Criar robots.txt [ ]

**Arquivo**: `src/app/robots.ts`

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}
```

**Checklist**:
- [ ] Criar `src/app/robots.ts`
- [ ] Desabilitar crawling de áreas privadas
- [ ] Linkar sitemap
- [ ] Testar: `curl http://localhost:3000/robots.txt`

---

## ✅ Critérios de Verificação

### Build & Deploy
- [ ] `npm run build` completa sem erros
- [ ] Páginas são geradas estaticamente (ver output)
- [ ] Lighthouse score > 90 (Performance, SEO, Accessibility)

### SEO
- [ ] Meta tags presentes em todas as páginas
- [ ] OG images configurados
- [ ] JSON-LD structured data validado
- [ ] Sitemap acessível e válido
- [ ] robots.txt correto

### Funcionalidade
- [ ] Lista de vagas carrega corretamente
- [ ] Detalhes de vaga exibem informações completas
- [ ] Formulário de candidatura funciona
- [ ] Shortlist público acessível por token
- [ ] Redirects funcionam

### Performance
- [ ] TTFB < 300ms
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FCP < 1.8s

---

## 🔧 Comandos Úteis

```bash
# Build e verificar páginas geradas
npm run build

# Iniciar servidor de produção local
npm run start

# Verificar sitemap
curl http://localhost:3000/sitemap.xml | head -50

# Verificar robots.txt
curl http://localhost:3000/robots.txt

# Lighthouse CI
npx lighthouse http://localhost:3000/empresas/acme/vagas --view
```

---

## 📊 Métricas de Sucesso

| Métrica | Baseline (Vite) | Target (Next.js) | Atual |
|---------|-----------------|------------------|-------|
| Lighthouse SEO | 65/100 | 95/100 | - |
| First Contentful Paint | ~800ms | <300ms | - |
| Largest Contentful Paint | ~2.1s | <1.5s | - |
| Time to Interactive | ~1.2s | <500ms | - |
| Google Indexação | 0 vagas | 100% | - |

---

## 🎯 Próxima Fase

Após concluir a Fase 2, prosseguir para:
**Fase 3: Autenticação e Middleware** (2-3 semanas)
