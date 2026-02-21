import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { JobCard } from '@/components/public/JobCard'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ tenantSlug: string; companySlug: string }>
}

// Gerar páginas estáticas em build time
export async function generateStaticParams() {
  // Use environment variables directly for SSG (no cookies)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Buscar top 100 empresas com vagas publicadas
  const { data: companies } = await supabase
    .from('companies')
    .select('slug, organizations!inner(slug)')
    .not('slug', 'is', null)
    .limit(100)
  
  if (!companies) return []
  
  return companies.map((company: any) => ({
    tenantSlug: company.organizations?.slug || 'default',
    companySlug: company.slug,
  }))
}

// SEO dinâmico
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug, companySlug } = await params
  const supabase = await createClient()
  
  const { data: company } = await supabase
    .from('companies')
    .select('company_name, description, organizations!inner(slug)')
    .eq('slug', companySlug)
    .eq('organizations.slug', tenantSlug)
    .single()
  
  if (!company) {
    return {
      title: 'Empresa não encontrada',
    }
  }
  
  return {
    title: `Vagas - ${company.company_name}`,
    description: company.description || `Veja todas as vagas abertas na ${company.company_name}`,
    openGraph: {
      title: `Vagas - ${company.company_name}`,
      description: company.description || '',
      type: 'website',
    },
  }
}

export default async function CompanyJobsPage({ params }: PageProps) {
  const { tenantSlug, companySlug } = await params
  const supabase = await createClient()
  
  // Buscar empresa e vagas em paralelo
  const [
    { data: company },
    { data: jobs }
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('*, organizations!inner(slug)')
      .eq('slug', companySlug)
      .eq('organizations.slug', tenantSlug)
      .single(),
    supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        city,
        work_model,
        contract_type,
        seniority,
        created_at,
        company_display_name,
        is_confidential,
        companies!inner(slug, organizations!inner(slug))
      `)
      .eq('companies.slug', companySlug)
      .eq('companies.organizations.slug', tenantSlug)
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
        <h1 className="text-4xl font-bold mb-4">{company.company_name}</h1>
        {company.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {company.description}
          </p>
        )}
        {company.website_url && (
          <a 
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Visitar site →
          </a>
        )}
      </div>
      
      {/* Jobs Grid */}
      {jobs && jobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job}
              tenantSlug={tenantSlug}
              companySlug={companySlug}
            />
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
