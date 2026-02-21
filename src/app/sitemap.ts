import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generatePublicJobUrl } from '@/lib/slug-utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use environment variables directly for sitemap generation (no cookies)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Buscar todas as vagas públicas com organização e empresa
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, updated_at, organizations!inner(slug), companies!inner(slug)')
    .eq('status', 'published')
    .limit(1000)
  
  const jobUrls = jobs?.map((job: any) => {
    const url = generatePublicJobUrl(job.organizations?.slug || 'default', job.id, job.title)
    return {
      url: `https://yourdomain.com${url}`,
      lastModified: new Date(job.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  }) || []
  
  // Buscar empresas com vagas
  const { data: companies } = await supabase
    .from('companies')
    .select(`
      slug, 
      organizations!inner(slug),
      jobs!inner(id)
    `)
    .eq('jobs.status', 'published')
    .not('slug', 'is', null)
  
  const companyUrls = companies?.map((company: any) => ({
    url: `https://yourdomain.com/${company.organizations?.slug || 'default'}/empresas/${company.slug}/vagas`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  })) || []
  
  return [
    {
      url: 'https://yourdomain.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    ...jobUrls,
    ...companyUrls,
  ]
}
