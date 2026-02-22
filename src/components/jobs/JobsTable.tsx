'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, Plus, Briefcase } from 'lucide-react'
import { JobCard } from '@/components/jobs/JobCard'
import type { Job } from '@/types/jobs'
import Link from 'next/link'
import { buildTenantPath } from '@/lib/tenant-utils'

interface JobsTableProps {
  initialJobs: Job[]
  tenantSlug: string
  tenantId: string
}

type TabValue = 'all' | 'active' | 'to_approve' | 'inactive' | 'draft'

function getJobTab(job: Job): TabValue {
  if (job.status === 'draft' || job.step === 0) return 'draft'
  if (job.step === 1) return 'to_approve'
  if (job.status === 'active') return 'active'
  if (job.status === 'inactive' || job.status === 'archived') return 'inactive'
  return 'active'
}

function countByTab(jobs: Job[]) {
  return jobs.reduce(
    (acc, job) => {
      const tab = getJobTab(job)
      acc[tab] = (acc[tab] || 0) + 1
      acc.all = (acc.all || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}

export function JobsTable({ initialJobs, tenantSlug, tenantId }: JobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabValue>('all')

  // --- Real-time subscription ---
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`jobs:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `organization_id=eq.${tenantId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full record with joins
            const { data } = await supabase
              .from('jobs')
              .select('id, title, company, seniority, city, country, work_model, contract_type, status, step, is_published, published_at, created_at, updated_at, job_type, company_id, sector, archive_reason, companies ( id, name, logo_url )')
              .eq('id', payload.new.id)
              .single()
            if (data) setJobs((prev) => [data as unknown as Job, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === payload.new.id ? { ...j, ...payload.new } : j
              )
            )
          }
          if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((j) => j.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  // --- Filtering ---
  const filteredJobs = useMemo(() => {
    let result = jobs

    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter((j) => getJobTab(j) === activeTab)
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q) ||
          j.companies?.name?.toLowerCase().includes(q)
      )
    }

    return result
  }, [jobs, activeTab, search])

  const counts = useMemo(() => countByTab(jobs), [jobs])

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Ativas' },
    { value: 'to_approve', label: 'Para aprovar' },
    { value: 'inactive', label: 'Inativas' },
    { value: 'draft', label: 'Rascunhos' },
  ]

  return (
    <div>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="mb-4 h-auto flex-wrap gap-1 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
            >
              {tab.label}
              {counts[tab.value] != null && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({counts[tab.value] ?? 0})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Search + actions bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href={buildTenantPath(tenantSlug, '/vagas/criar')}>
              <Plus className="h-4 w-4" />
              Nova Vaga
            </Link>
          </Button>
        </div>

        {/* Results */}
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Nenhuma vaga encontrada</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {search
                ? `Nenhuma vaga corresponde a "${search}"`
                : 'Crie sua primeira vaga para começar'}
            </p>
            {!search && (
              <Button asChild>
                <Link href={buildTenantPath(tenantSlug, '/vagas/criar')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar vaga
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} tenantSlug={tenantSlug} />
            ))}
          </div>
        )}
      </Tabs>
    </div>
  )
}
