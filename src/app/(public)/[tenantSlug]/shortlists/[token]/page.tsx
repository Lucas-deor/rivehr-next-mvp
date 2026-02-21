import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase } from 'lucide-react'

interface PageProps {
  params: Promise<{ tenantSlug: string; token: string }>
}

// NÃO usar generateStaticParams - tokens são dinâmicos e privados
// Esta página usa SSR (Server-Side Rendering)

export default async function ShortlistPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  
  // Buscar shortlist pelo token
  const { data: shortlist } = await supabase
    .from('shortlists')
    .select(`
      *,
      jobs(title, city, work_model, contract_type, companies(company_name, logo_url))
    `)
    .eq('public_token', token)
    .eq('status', 'active')
    .single()
  
  if (!shortlist) {
    notFound()
  }
  
  // Buscar membros da shortlist
  const { data: members } = await supabase
    .from('shortlist_items')
    .select(`
      position,
      members(
        id,
        name,
        avatar_url,
        current_position,
        city,
        country,
        seniority,
        skills,
        languages
      )
    `)
    .eq('shortlist_id', shortlist.id)
    .order('position', { ascending: true })
  
  type MemberData = {
    id: string
    name: string
    avatar_url: string | null
    current_position: string | null
    city: string | null
    country: string | null
    seniority: string | null
    skills: string[] | null
    languages: string[] | null
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{shortlist.title}</h1>
          {shortlist.jobs && (
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <span className="text-lg">{shortlist.jobs.companies?.company_name}</span>
              <span>•</span>
              <span>{shortlist.jobs.title}</span>
            </div>
          )}
          
          {/* Job Info Badges */}
          {shortlist.jobs && (
            <div className="flex flex-wrap gap-2 mt-4">
              {shortlist.jobs.city && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {shortlist.jobs.city}
                </Badge>
              )}
              {shortlist.jobs.work_model && (
                <Badge variant="outline" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {shortlist.jobs.work_model}
                </Badge>
              )}
              {shortlist.jobs.contract_type && (
                <Badge variant="outline">{shortlist.jobs.contract_type}</Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Members Grid */}
        {members && members.length > 0 ? (
          <div className="grid gap-6">
            {members.map(({ members: member }: any) => {
              const memberData = (Array.isArray(member) ? member[0] : member) as MemberData
              return (
              <Card key={memberData.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      {memberData.avatar_url ? (
                        <img src={memberData.avatar_url} alt={memberData.name} />
                      ) : (
                        <AvatarFallback className="text-lg">
                          {memberData.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="mb-1">{memberData.name}</CardTitle>
                      {memberData.current_position && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {memberData.current_position}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {memberData.seniority && (
                          <Badge variant="secondary">{memberData.seniority}</Badge>
                        )}
                        {memberData.city && (
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {memberData.city}{memberData.country ? `, ${memberData.country}` : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Skills */}
                  {memberData.skills && Array.isArray(memberData.skills) && memberData.skills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Habilidades</p>
                      <div className="flex flex-wrap gap-1">
                        {memberData.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Languages */}
                  {memberData.languages && Array.isArray(memberData.languages) && memberData.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Idiomas</p>
                      <div className="flex flex-wrap gap-1">
                        {memberData.languages.map((lang: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum candidato nesta lista ainda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// NÃO cachear - tokens podem ser revogados
export const dynamic = 'force-dynamic'
