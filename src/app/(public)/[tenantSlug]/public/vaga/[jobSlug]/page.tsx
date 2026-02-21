import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { ApplicationForm } from '@/components/public/ApplicationForm'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase, Clock, DollarSign } from 'lucide-react'
import type { Metadata } from 'next'
import { parsePublicJobId } from '@/lib/slug-utils'

interface PageProps {
  params: Promise<{ tenantSlug: string; jobSlug: string }>
}

// Gerar páginas estáticas
export async function generateStaticParams() {
  // Use environment variables directly for SSG (no cookies)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, organizations!inner(slug)')
    .eq('status', 'published')
    .limit(100)
  
  if (!jobs) return []
  
  return jobs.map((job: any) => {
    const jobSlug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}--${job.id}`
    return {
      tenantSlug: job.organizations?.slug || 'default',
      jobSlug,
    }
  })
}

// SEO dinâmico com JSON-LD
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { jobSlug } = await params
  const jobId = parsePublicJobId(jobSlug)
  if (!jobId) return { title: 'Vaga não encontrada' }
  
  const supabase = await createClient()
  
  const { data: job } = await supabase
    .from('jobs')
    .select('title, description, companies(company_name)')
    .eq('id', jobId)
    .single()
  
  if (!job) {
    return { title: 'Vaga não encontrada' }
  }
  
  const company: any = job.companies
  const description = job.description?.replace(/<[^>]*>/g, '').slice(0, 160) || 'Veja detalhes da vaga'
  
  return {
    title: `${job.title} - ${company?.company_name || 'Empresa'}}`,
    description,
    openGraph: {
      title: job.title,
      description,
      type: 'website',
    },
  }
}

export default async function JobDetailsPage({ params }: PageProps) {
  const { tenantSlug, jobSlug } = await params
  const jobId = parsePublicJobId(jobSlug)
  
  if (!jobId) {
    notFound()
  }
  
  const supabase = await createClient()
  
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      companies(company_name, slug, description, website_url, logo_url),
      organizations!inner(slug)
    `)
    .eq('id', jobId)
    .eq('status', 'published')
    .eq('organizations.slug', tenantSlug)
    .single()
  
  if (!job) {
    notFound()
  }
  
  // JSON-LD para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description?.replace(/<[^>]*>/g, ''),
    datePosted: job.created_at,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companies?.company_name || 'Empresa Confidencial',
    },
    jobLocation: job.city ? {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city,
        addressCountry: job.country || 'BR',
      },
    } : undefined,
    employmentType: job.contract_type || 'FULL_TIME',
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
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {!job.is_confidential && job.companies?.company_name && (
                <span className="text-xl">{job.companies.company_name}</span>
              )}
            </div>
            
            {/* Job Info Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
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
                <Badge variant="outline">{job.seniority}</Badge>
              )}
              {job.contract_type && (
                <Badge variant="outline">{job.contract_type}</Badge>
              )}
            </div>
          </div>
          
          {/* Job Details */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {job.description && (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Descrição da Vaga</h2>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </Card>
              )}
              
              {/* Requirements */}
              {job.requirements && (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Requisitos</h2>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                </Card>
              )}
              
              {/* Activities */}
              {job.activities && (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Atividades</h2>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.activities }}
                  />
                </Card>
              )}
              
              {/* Benefits */}
              {job.benefits && (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Benefícios</h2>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.benefits }}
                  />
                </Card>
              )}
              
              {/* Application Form */}
              <ApplicationForm 
                jobId={job.id} 
                jobTitle={job.title}
                tenantSlug={tenantSlug}
              />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Salary Info */}
              {job.publish_salary && (job.salary_min || job.salary_max) && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Remuneração
                  </h3>
                  <div className="text-lg font-medium">
                    {job.salary_min && job.salary_max ? (
                      `${job.salary_currency || 'R$'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                    ) : job.salary_min ? (
                      `A partir de ${job.salary_currency || 'R$'} ${job.salary_min.toLocaleString()}`
                    ) : (
                      `Até ${job.salary_currency || 'R$'} ${job.salary_max?.toLocaleString()}`
                    )}
                  </div>
                  {job.salary_periodicity && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.salary_periodicity}
                    </p>
                  )}
                </Card>
              )}
              
              {/* Company Info */}
              {!job.is_confidential && job.companies && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Sobre a Empresa</h3>
                  {job.companies.logo_url && (
                    <img 
                      src={job.companies.logo_url} 
                      alt={job.companies.company_name}
                      className="w-32 h-32 object-contain mb-4"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {job.companies.description || job.companies.company_name}
                  </p>
                  {job.companies.website_url && (
                    <a 
                      href={job.companies.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                    >
                      Visitar site →
                    </a>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ISR: Revalidar a cada 1 hora
export const revalidate = 3600
