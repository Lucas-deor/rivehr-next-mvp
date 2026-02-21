# Fase 4: Área Autenticada - Leitura

**Duração Estimada**: 4 semanas  
**Prioridade**: 🔥 ALTA  
**Status**: ⏳ Pendente

---

## 🎯 Objetivo

Migrar páginas de visualização (listagens, dashboards, detalhes) da área autenticada usando **Hybrid Rendering** (Server Components para dados iniciais + Client Components para interatividade).

---

## 📋 Tarefas

### 1. Criar Layout Autenticado com Sidebar [ ]

**Arquivo**: `src/app/(authenticated)/layout.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth')
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar `src/app/(authenticated)/layout.tsx`
- [ ] Verificar autenticação no layout
- [ ] Criar componente `Sidebar`
- [ ] Criar componente `Header` com menu de usuário
- [ ] Testar responsividade

---

### 2. Criar Componente Sidebar [ ]

**Arquivo**: `src/components/layout/Sidebar.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  Users,
  Building2,
  Settings,
  LayoutDashboard,
  ListChecks,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vagas', href: '/vagas/ver-vagas', icon: Briefcase },
  { name: 'Criar Vaga', href: '/vagas/criar-vaga', icon: Briefcase },
  { name: 'Membros', href: '/membros', icon: Users },
  { name: 'Clientes', href: '/clientes', icon: Building2 },
  { name: 'Minhas Listas', href: '/minhas-listas', icon: ListChecks },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">RIVEHR</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar `Sidebar.tsx` como Client Component
- [ ] Adicionar navegação principal
- [ ] Destacar item ativo
- [ ] Adicionar ícones (Lucide)

---

### 3. Criar Componente Header [ ]

**Arquivo**: `src/components/layout/Header.tsx`

```tsx
'use client'

import { User } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User as UserIcon } from 'lucide-react'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const { signOut } = useAuth()
  
  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      <div>
        {/* Breadcrumb ou título da página */}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarFallback>
              {user.email?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

**Checklist**:
- [ ] Criar `Header.tsx`
- [ ] Adicionar menu de usuário
- [ ] Implementar logout
- [ ] Avatar com iniciais

---

### 4. Migrar Página de Lista de Vagas [ ]

**Referência**: `src/pages/VerVagas.tsx`  
**Arquivo**: `src/app/(authenticated)/[tenantSlug]/vagas/ver-vagas/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { JobsTable } from '@/components/jobs/JobsTable'

export default async function VerVagasPage() {
  const { tenantId } = await getTenantContext()
  const supabase = await createClient()
  
  // Buscar vagas no servidor
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      companies(name, slug),
      contract_types(name),
      seniority_levels(name),
      work_models(name)
    `)
    .eq('organization_id', tenantId)
    .order('created_at', { ascending: false })
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Vagas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as vagas da sua organização
        </p>
      </div>
      
      <JobsTable initialJobs={jobs || []} tenantId={tenantId} />
    </div>
  )
}
```

**Checklist**:
- [ ] Criar página em `[tenantSlug]/vagas/ver-vagas/page.tsx`
- [ ] Buscar jobs no servidor
- [ ] Criar componente `JobsTable` (client)
- [ ] Passar dados iniciais para client component

---

### 5. Criar Componente JobsTable (Client) [ ]

**Arquivo**: `src/components/jobs/JobsTable.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatDistance } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Job {
  id: string
  title: string
  status: string
  created_at: string
  companies?: { name: string; slug: string }
  contract_types?: { name: string }
  seniority_levels?: { name: string }
}

interface JobsTableProps {
  initialJobs: Job[]
  tenantId: string
}

export function JobsTable({ initialJobs, tenantId }: JobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  
  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `organization_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new as Job, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === payload.new.id ? (payload.new as Job) : job
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((job) => job.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, supabase])
  
  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Buscar vagas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button asChild>
          <Link href="criar-vaga">Nova Vaga</Link>
        </Button>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Nenhuma vaga encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.companies?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistance(new Date(job.created_at), new Date(), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`detalhes/${job.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar `JobsTable.tsx` como Client Component
- [ ] Implementar busca local
- [ ] Adicionar Realtime subscription
- [ ] Testar atualização em tempo real

---

### 6. Migrar Pipeline Kanban (VagaDetalhes) [ ]

**Referência**: `src/pages/VagaDetalhes.tsx` (1557 linhas)  
**Arquivo**: `src/app/(authenticated)/[tenantSlug]/vagas/detalhes/[jobId]/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'

interface PageProps {
  params: { jobId: string }
}

export default async function VagaDetalhesPage({ params }: PageProps) {
  const { tenantId } = await getTenantContext()
  const supabase = await createClient()
  
  // Buscar dados em paralelo
  const [
    { data: job },
    { data: candidates },
    { data: stages }
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, companies(name)')
      .eq('id', params.jobId)
      .eq('organization_id', tenantId)
      .single(),
    supabase
      .from('job_candidates')
      .select(`
        *,
        member:members(*),
        stage:pipeline_stages(*)
      `)
      .eq('job_id', params.jobId)
      .order('created_at', { ascending: false }),
    supabase
      .from('pipeline_stages')
      .select('*')
      .eq('job_id', params.jobId)
      .order('order')
  ])
  
  if (!job) {
    notFound()
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="text-muted-foreground">{job.companies?.name}</p>
      </div>
      
      <KanbanBoard
        jobId={params.jobId}
        initialCandidates={candidates || []}
        initialStages={stages || []}
      />
    </div>
  )
}
```

**Checklist**:
- [ ] Criar página de detalhes
- [ ] Buscar job, candidates e stages em paralelo
- [ ] Criar componente `KanbanBoard` (client)

---

### 7. Criar KanbanBoard com Drag-and-Drop [ ]

**Arquivo**: `src/components/pipeline/KanbanBoard.tsx`

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CandidateCard } from './CandidateCard'

interface KanbanBoardProps {
  jobId: string
  initialCandidates: any[]
  initialStages: any[]
}

export function KanbanBoard({
  jobId,
  initialCandidates,
  initialStages,
}: KanbanBoardProps) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [stages] = useState(initialStages)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const supabase = createClient()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )
  
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }
  
  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }
    
    const candidateId = active.id
    const newStageId = over.id
    
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId ? { ...c, stage_id: newStageId } : c
      )
    )
    
    // Update no banco
    const { error } = await supabase
      .from('job_candidates')
      .update({ stage_id: newStageId })
      .eq('id', candidateId)
    
    if (error) {
      console.error(error)
      toast.error('Erro ao mover candidato')
      // Revert
      setCandidates(initialCandidates)
    } else {
      toast.success('Candidato movido!')
    }
    
    setActiveId(null)
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageCandidates = candidates.filter(
            (c) => c.stage_id === stage.id
          )
          
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-4"
            >
              <h3 className="font-semibold mb-4">
                {stage.name} ({stageCandidates.length})
              </h3>
              
              <SortableContext
                id={stage.id}
                items={stageCandidates.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stageCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      
      <DragOverlay>
        {activeId ? (
          <CandidateCard
            candidate={candidates.find((c) => c.id === activeId)!}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
```

**Checklist**:
- [ ] Instalar `@dnd-kit/core` e `@dnd-kit/sortable` (já instalado)
- [ ] Criar `KanbanBoard.tsx`
- [ ] Implementar drag-and-drop
- [ ] Optimistic updates
- [ ] Server Action para mover candidato

---

### 8. Migrar Página de Membros [ ]

**Referência**: `src/pages/Membros.tsx`  
**Arquivo**: `src/app/(authenticated)/[tenantSlug]/membros/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { MembersTable } from '@/components/members/MembersTable'

export default async function MembrosPage() {
  const { tenantId } = await getTenantContext()
  const supabase = await createClient()
  
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('organization_id', tenantId)
    .order('created_at', { ascending: false })
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Membros</h1>
        <p className="text-muted-foreground">
          Gerencie todos os candidatos
        </p>
      </div>
      
      <MembersTable initialMembers={members || []} />
    </div>
  )
}
```

**Checklist**:
- [ ] Criar página de membros
- [ ] Buscar members no servidor
- [ ] Criar `MembersTable` (similar a JobsTable)

---

### 9. Migrar Dashboard [ ]

**Referência**: `src/pages/VagasDashboard.tsx`  
**Arquivo**: `src/app/(authenticated)/[tenantSlug]/dashboard/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export default async function DashboardPage() {
  const { tenantId } = await getTenantContext()
  const supabase = await createClient()
  
  // Buscar dados agregados
  const [
    { count: totalJobs },
    { count: totalCandidates },
    { data: recentJobs }
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', tenantId),
    supabase
      .from('job_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', tenantId),
    supabase
      .from('jobs')
      .select('*, companies(name)')
      .eq('organization_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5)
  ])
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total de Vagas</p>
          <p className="text-3xl font-bold">{totalJobs || 0}</p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Candidatos</p>
          <p className="text-3xl font-bold">{totalCandidates || 0}</p>
        </div>
      </div>
      
      <DashboardCharts />
    </div>
  )
}
```

**Checklist**:
- [ ] Criar dashboard
- [ ] Buscar dados agregados no servidor
- [ ] Criar `DashboardCharts` (client, com Recharts)
- [ ] Dynamic import de Recharts com `{ ssr: false }`

---

### 10. Adicionar Loading e Error States [ ]

**Arquivo**: `src/app/(authenticated)/[tenantSlug]/vagas/ver-vagas/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
```

**Arquivo**: `src/app/(authenticated)/[tenantSlug]/vagas/ver-vagas/error.tsx`

```tsx
'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
      <p className="text-muted-foreground mb-6">{error.message}</p>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar `loading.tsx` em cada rota
- [ ] Criar `error.tsx` em cada rota
- [ ] Testar loading states
- [ ] Testar error boundaries

---

## ✅ Critérios de Verificação

- [ ] Todas as páginas de leitura funcionam
- [ ] Realtime updates funcionam
- [ ] Drag-and-drop funciona sem lag
- [ ] Loading e error states funcionam
- [ ] Performance: TTFB < 500ms
- [ ] Navegação é fluida

---

## 🎯 Próxima Fase

**Fase 5: Área Autenticada - Escrita** (3-4 semanas)
