'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, Users, MapPin, Filter } from 'lucide-react'
import type { Member } from '@/app/[tenantSlug]/membros/page'

interface MembersTableProps {
  initialMembers: Member[]
  tenantSlug: string
  tenantId: string
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function getSeniorityLabel(seniority: string | null) {
  const map: Record<string, string> = {
    junior: 'Júnior',
    pleno: 'Pleno',
    senior: 'Sênior',
    especialista: 'Especialista',
  }
  return seniority ? (map[seniority.toLowerCase()] ?? seniority) : null
}

export function MembersTable({ initialMembers, tenantSlug, tenantId }: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [search, setSearch] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState<'all' | 'ux' | 'generic'>('all')

  // --- Real-time subscription ---
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`members:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
          filter: `organization_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMembers((prev) => [payload.new as Member, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            setMembers((prev) =>
              prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
            )
          }
          if (payload.eventType === 'DELETE') {
            setMembers((prev) => prev.filter((m) => m.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  // --- Filtering ---
  const filteredMembers = useMemo(() => {
    let result = members

    if (jobTypeFilter !== 'all') {
      result = result.filter((m) => (m.job_type ?? 'ux') === jobTypeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.skills?.some((s) => s.toLowerCase().includes(q))
      )
    }

    return result
  }, [members, search, jobTypeFilter])

  const tabs = [
    { value: 'all', label: 'Todos', count: members.length },
    { value: 'ux', label: 'UX', count: members.filter((m) => (m.job_type ?? 'ux') === 'ux').length },
    { value: 'generic', label: 'Outros', count: members.filter((m) => m.job_type === 'generic').length },
  ] as const

  return (
    <div>
      {/* Type tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setJobTypeFilter(tab.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              jobTypeFilter === tab.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-muted'
            }`}
          >
            {tab.label}
            <span className="text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cargo ou skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Results */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Nenhum membro encontrado</h3>
          <p className="text-muted-foreground text-sm">
            {search ? `Nenhum resultado para "${search}"` : 'Adicione membros ao banco de talentos'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredMembers.length} membro{filteredMembers.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MemberCard({ member }: { member: Member }) {
  const initials = member.name ? getInitials(member.name) : '?'
  const seniorityLabel = getSeniorityLabel(member.seniority)

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.avatar_url ?? undefined} alt={member.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[seniorityLabel, member.role].filter(Boolean).join(' · ') || 'Sem cargo'}
          </p>
        </div>
      </div>

      {member.city && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3" />
          {[member.city, member.country].filter(Boolean).join(', ')}
        </p>
      )}

      {member.skills && member.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs px-1.5 py-0">
              {skill}
            </Badge>
          ))}
          {member.skills.length > 4 && (
            <span className="text-xs text-muted-foreground self-center">
              +{member.skills.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
