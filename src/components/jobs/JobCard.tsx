'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Calendar, ArrowRight, Building2, Briefcase } from 'lucide-react'
import { buildTenantPath } from '@/lib/tenant-utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Job } from '@/types/jobs'

interface JobCardProps {
  job: Job
  tenantSlug: string
}

function getStatusBadge(job: Job) {
  if (job.status === 'draft' || job.step === 0) {
    return { label: 'Rascunho', variant: 'secondary' as const }
  }
  if (job.step === 1) {
    return { label: 'Para aprovar', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' }
  }
  if (job.status === 'active' && job.is_published) {
    return { label: 'Publicada', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700' }
  }
  if (job.status === 'active') {
    return { label: 'Ativa', variant: 'default' as const }
  }
  if (job.status === 'inactive' || job.status === 'archived') {
    return { label: 'Inativa', variant: 'secondary' as const }
  }
  return { label: job.status ?? 'Desconhecido', variant: 'secondary' as const }
}

export function JobCard({ job, tenantSlug }: JobCardProps) {
  const { label, variant, className } = getStatusBadge(job)

  const companyName = job.companies?.name ?? job.company ?? 'Empresa não informada'

  const createdAt = job.created_at
    ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })
    : null

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-tight truncate" title={job.title}>
              {job.title}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{companyName}</span>
            </div>
          </div>
          <Badge variant={variant} className={className}>
            {label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {job.city && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              <MapPin className="h-3 w-3" />
              {job.city}
            </span>
          )}
          {job.work_model && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              <Briefcase className="h-3 w-3" />
              {job.work_model}
            </span>
          )}
          {job.seniority && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {job.seniority}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {createdAt}
          </span>
          <Button variant="ghost" size="sm" className="gap-1 h-7" asChild>
            <Link href={buildTenantPath(tenantSlug, `/vagas/detalhes/${job.id}`)}>
              <Users className="h-3.5 w-3.5" />
              Pipeline
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
