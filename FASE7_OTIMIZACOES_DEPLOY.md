# Fase 7: Otimizações e Deploy

**Duração Estimada**: 2 semanas  
**Prioridade**: 🟢 DEPLOY  
**Status**: ⏳ Pendente

---

## 🎯 Objetivo

Otimizar performance, configurar CI/CD, fazer deploy na **Vercel**, adicionar monitoring e finalizar documentação.

---

## 📋 Tarefas

### 1. Otimização de Imagens [ ]

**Substituir todas as tags `<img>` por `<Image>` do Next.js**

**Exemplo**: `src/components/jobs/JobCard.tsx`

```tsx
// Antes
<img src={companyLogo} alt="Logo" />

// Depois
import Image from 'next/image'

<Image
  src={companyLogo}
  alt="Logo da Empresa"
  width={80}
  height={80}
  className="rounded"
  priority={false}
/>
```

**Configurar domínios de imagens**: `next.config.ts`

```tsx
import type { NextConfig } from 'next'

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
}

export default nextConfig
```

**Checklist**:
- [ ] Substituir todas as `<img>` por `<Image>`
- [ ] Configurar `remotePatterns` no next.config.ts
- [ ] Adicionar `priority` para imagens acima da dobra
- [ ] Usar `placeholder="blur"` quando possível

---

### 2. Code Splitting e Dynamic Imports [ ]

**Importar componentes pesados dinamicamente**

**Exemplo**: `src/app/(authenticated)/[tenantSlug]/dashboard/page.tsx`

```tsx
import dynamic from 'next/dynamic'

// Recharts é pesado, carregar apenas no cliente
const DashboardCharts = dynamic(
  () => import('@/components/dashboard/DashboardCharts'),
  {
    ssr: false,
    loading: () => <div>Carregando gráficos...</div>,
  }
)

export default async function DashboardPage() {
  // ... fetch data
  
  return (
    <div>
      <h1>Dashboard</h1>
      <DashboardCharts data={data} />
    </div>
  )
}
```

**Checklist**:
- [ ] Dynamic import para Recharts
- [ ] Dynamic import para TipTap (RichTextEditor)
- [ ] Dynamic import para @dnd-kit (KanbanBoard)
- [ ] Adicionar loading states

---

### 3. Bundle Analysis [ ]

**Instalar e executar bundle analyzer**

```bash
npm install -D @next/bundle-analyzer
```

**Atualizar**: `next.config.ts`

```tsx
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // ... config
}

export default withBundleAnalyzer(nextConfig)
```

**Executar análise**:

```bash
ANALYZE=true npm run build
```

**Checklist**:
- [ ] Instalar bundle analyzer
- [ ] Executar análise
- [ ] Identificar bundles > 200kb
- [ ] Otimizar imports (tree-shaking)

---

### 4. Configurar Variáveis de Ambiente para Produção [ ]

**Arquivo**: `.env.production.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

# Auth
JWT_SECRET=<GENERATE_STRONG_SECRET>

# URLs
NEXT_PUBLIC_APP_URL=https://rivehr.com.br
NEXT_PUBLIC_API_URL=https://rivehr.com.br/api

# Email (Resend)
RESEND_API_KEY=<RESEND_KEY>

# Monitoring
SENTRY_DSN=<SENTRY_DSN>
```

**Checklist**:
- [ ] Criar `.env.production.example`
- [ ] Documentar todas as variáveis necessárias
- [ ] Gerar `JWT_SECRET` seguro

---

### 5. Deploy na Vercel [ ]

**Passo 1**: Criar conta na Vercel e conectar repositório

```bash
npm install -g vercel
vercel login
```

**Passo 2**: Configurar projeto

```bash
vercel
```

**Passo 3**: Adicionar variáveis de ambiente no dashboard da Vercel

- Ir em **Settings > Environment Variables**
- Adicionar todas as variáveis do `.env.production`

**Passo 4**: Deploy

```bash
vercel --prod
```

**Checklist**:
- [ ] Criar projeto na Vercel
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Fazer primeiro deploy
- [ ] Testar URL de produção

---

### 6. Configurar CI/CD com GitHub Actions [ ]

**Arquivo**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Run tests (se houver)
        run: npm test
```

**Adicionar script de type-check**: `package.json`

```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

**Checklist**:
- [ ] Criar `.github/workflows/ci.yml`
- [ ] Adicionar secrets no GitHub
- [ ] Testar workflow em PR
- [ ] Garantir que build passa

---

### 7. Adicionar Monitoring com Sentry [ ]

**Instalar Sentry**:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configurar**: `sentry.client.config.ts`

```tsx
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

**Configurar**: `sentry.server.config.ts`

```tsx
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

**Capturar erros em Server Actions**:

```tsx
'use server'

import * as Sentry from '@sentry/nextjs'

export async function createJobAction(data: any) {
  try {
    // ... lógica
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}
```

**Checklist**:
- [ ] Instalar e configurar Sentry
- [ ] Adicionar `SENTRY_DSN` nas env vars
- [ ] Capturar erros em Server Actions
- [ ] Testar envio de erro para Sentry

---

### 8. Otimizar Performance [ ]

**Adicionar caching agressivo**:

```tsx
// src/lib/supabase/server.ts
import { cache } from 'react'

export const getCachedJobs = cache(async (tenantId: string) => {
  const supabase = await createClient()
  return supabase
    .from('jobs')
    .select('*')
    .eq('organization_id', tenantId)
})
```

**Adicionar Revalidation**:

```tsx
// src/app/(authenticated)/[tenantSlug]/vagas/ver-vagas/page.tsx
export const revalidate = 60 // Revalidar a cada 60 segundos
```

**Adicionar Metadata para SEO**:

```tsx
// src/app/(authenticated)/[tenantSlug]/vagas/ver-vagas/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vagas | RIVEHR',
  description: 'Gerencie todas as vagas da sua organização',
}
```

**Checklist**:
- [ ] Adicionar `cache()` do React em queries repetidas
- [ ] Configurar `revalidate` em páginas dinâmicas
- [ ] Adicionar metadata em todas as páginas
- [ ] Rodar Lighthouse e atingir score > 90

---

### 9. Configurar Domínio Customizado [ ]

**Na Vercel**:

1. Ir em **Settings > Domains**
2. Adicionar domínio: `rivehr.com.br`
3. Configurar DNS (A record ou CNAME)

**No registrador de domínio** (ex: Registro.br):

- **A Record**: `@` → `76.76.21.21` (Vercel IP)
- **CNAME**: `www` → `cname.vercel-dns.com`

**Atualizar Supabase Redirect URLs**:

- Ir em **Authentication > URL Configuration**
- Adicionar: `https://rivehr.com.br/auth/callback`

**Checklist**:
- [ ] Adicionar domínio na Vercel
- [ ] Configurar DNS
- [ ] Aguardar propagação (até 48h)
- [ ] Testar HTTPS
- [ ] Atualizar Supabase redirect URLs

---

### 10. Documentação Final [ ]

**Atualizar**: `README.md`

```md
# RIVEHR - Sistema de Recrutamento e Seleção

## 🚀 Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS v3.4
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (cookies)
- **State**: TanStack Query v5
- **Forms**: React Hook Form + Zod
- **UI**: shadcn/ui + Radix UI
- **Rich Text**: TipTap
- **Drag-and-Drop**: @dnd-kit
- **Charts**: Recharts

## 📦 Instalação

```bash
git clone https://github.com/seuusuario/rivehr-nextjs.git
cd rivehr-nextjs
npm install
```

## ⚙️ Configuração

1. Copiar `.env.example` para `.env.local`
2. Preencher variáveis do Supabase
3. Executar migrations: `supabase db push`

## 🏃 Executar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 🧪 Build

```bash
npm run build
npm start
```

## 📚 Documentação das Fases

- [Fase 1: Foundations](FASE1_COMPLETA.md) ✅
- [Fase 2: Portal Público](FASE2_PORTAL_PUBLICO_SSG.md)
- [Fase 3: Autenticação](FASE3_AUTENTICACAO_MIDDLEWARE.md)
- [Fase 4: Área Autenticada - Leitura](FASE4_AREA_AUTENTICADA_LEITURA.md)
- [Fase 5: Área Autenticada - Escrita](FASE5_AREA_AUTENTICADA_ESCRITA.md)
- [Fase 6: Admin Panel](FASE6_ADMIN_PANEL.md)
- [Fase 7: Otimizações e Deploy](FASE7_OTIMIZACOES_DEPLOY.md)

## 🌐 Deploy

Hospedado na Vercel: [https://rivehr.com.br](https://rivehr.com.br)

## 📝 Licença

MIT
```

**Criar**: `ARCHITECTURE.md`

```md
# Arquitetura RIVEHR

## Estrutura de Pastas

```
src/
├── app/                         # App Router
│   ├── (authenticated)/         # Grupo de rotas autenticadas
│   ├── (candidates)/            # Portal do candidato
│   ├── (clients)/               # Portal do cliente
│   ├── actions/                 # Server Actions
│   ├── api/                     # API Routes
│   └── layout.tsx
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Sidebar, Header
│   ├── jobs/                    # Job-related components
│   └── ...
├── lib/
│   ├── supabase/                # Supabase clients
│   ├── utils.ts                 # Utilities
│   └── tenant.ts                # Tenant helpers
└── hooks/                       # Custom hooks
```

## Fluxo de Autenticação

1. Usuário acessa `/auth`
2. Envia email → Server Action gera OTP → Supabase envia email
3. Verifica OTP → Server Action valida → Cria sessão (cookie)
4. Middleware valida cookie em todas as requisições
5. Tenant resolution: extrai slug da URL → valida permissão

## Rendering Strategies

- **SSG**: `/empresas/[slug]/vagas` (public job board)
- **ISR**: Job details (revalidate=3600)
- **SSR**: `/s/[token]` (shortlist), `/meu-portal` (candidate portal)
- **Client**: Forms, Kanban, Realtime tables

## Multi-Tenancy

- URL: `/:tenantSlug/*`
- Middleware resolve `organization_id` do slug
- RLS policies filtram por `organization_id`
- Supabase `auth.uid()` limita acesso

## Database

- **PostgreSQL** via Supabase
- **RLS** habilitado em todas as tabelas
- **Realtime** para job_candidates, jobs
- **Storage** para CVs e logos
```

**Checklist**:
- [ ] Atualizar README.md
- [ ] Criar ARCHITECTURE.md
- [ ] Documentar variáveis de ambiente
- [ ] Documentar deploy process

---

### 11. Testes de Performance [ ]

**Lighthouse CI**:

```bash
npm install -D @lhci/cli
```

**Arquivo**: `.lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run build && npm start",
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

**Executar**:

```bash
npx lhci autorun
```

**Checklist**:
- [ ] Instalar Lighthouse CI
- [ ] Rodar análise em páginas principais
- [ ] Performance score > 90
- [ ] Accessibility score > 90

---

### 12. Migração de Dados (se necessário) [ ]

**Se houver dados em produção no sistema antigo**:

**Arquivo**: `scripts/migrate-data.ts`

```tsx
import { createClient } from '@supabase/supabase-js'

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL!
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const OLD_KEY = process.env.OLD_SUPABASE_KEY!
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_KEY)
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_KEY)

async function migrateJobs() {
  console.log('Migrando jobs...')
  
  const { data: jobs } = await oldSupabase
    .from('jobs')
    .select('*')
  
  if (jobs) {
    const { error } = await newSupabase
      .from('jobs')
      .insert(jobs)
    
    if (error) {
      console.error('Erro ao migrar jobs:', error)
    } else {
      console.log(`✅ ${jobs.length} jobs migrados`)
    }
  }
}

async function main() {
  await migrateJobs()
  // Migrar outras tabelas...
}

main()
```

**Executar**:

```bash
ts-node scripts/migrate-data.ts
```

**Checklist**:
- [ ] Backup completo do banco antigo
- [ ] Script de migração testado em dev
- [ ] Executar migração em horário de baixo tráfego
- [ ] Validar dados migrados

---

## ✅ Critérios de Verificação Final

- [ ] **Performance**: Lighthouse score > 90
- [ ] **SEO**: Meta tags em todas as páginas
- [ ] **Acessibilidade**: ARIA labels, alt texts
- [ ] **Segurança**: HTTPS, CSP headers, sanitização de HTML
- [ ] **Monitoring**: Sentry capturando erros
- [ ] **CI/CD**: GitHub Actions rodando em PRs
- [ ] **Deploy**: Vercel com domínio customizado
- [ ] **Documentação**: README, ARCHITECTURE, env vars
- [ ] **Imagens**: Todas otimizadas com next/image
- [ ] **Bundle**: Sem pacotes > 500kb

---

## 🎉 Projeto Completo!

**Total**: 18-22 semanas de desenvolvimento

**Benefícios da Migração**:
- ✅ SEO otimizado (SSG para rotas públicas)
- ✅ Performance superior (Server Components)
- ✅ DX melhorada (App Router, Server Actions)
- ✅ Segurança (cookie-based auth, sanitização)
- ✅ Escalabilidade (Vercel Edge, ISR)
- ✅ Manutenibilidade (TypeScript, componentização)

**Próximos Passos**:
- Monitorar métricas no Vercel Analytics
- Coletar feedback dos usuários
- Iterar com melhorias incrementais
- Adicionar testes E2E (Playwright)
