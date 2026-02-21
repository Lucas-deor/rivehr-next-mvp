import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase, Clock } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { generatePublicJobUrl } from '@/lib/slug-utils'

interface JobCardProps {
  job: {
    id: string
    title: string
    description?: string | null
    city?: string | null
    work_model?: string | null
    contract_type?: string | null
    seniority?: string | null
    created_at: string
    company_display_name?: string | null
    is_confidential?: boolean
  }
  tenantSlug: string
  companySlug: string
}

export function JobCard({ job, tenantSlug, companySlug }: JobCardProps) {
  const jobUrl = generatePublicJobUrl(tenantSlug, job.id, job.title)
  
  return (
    <Link href={jobUrl}>
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
                {job.description.replace(/<[^>]*>/g, '')}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2">
              {job.city && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.city}
                </Badge>
              )}
              {job.work_model && (
                <Badge variant="outline" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.work_model}
                </Badge>
              )}
              {job.seniority && (
                <Badge variant="outline">
                  {job.seniority}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
