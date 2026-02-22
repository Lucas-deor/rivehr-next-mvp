'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GripVertical, MapPin, User } from 'lucide-react'
import type { JobCandidate } from '@/types/pipeline'

interface CandidateCardProps {
  candidate: JobCandidate
  isDragOverlay?: boolean
  onOpenProfile?: (candidateId: string) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function CandidateCard({
  candidate,
  isDragOverlay = false,
  onOpenProfile,
}: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: candidate.id, data: { candidate } })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const member = candidate.member
  const initials = member?.name ? getInitials(member.name) : '?'

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={cn(
        'group bg-card border rounded-lg p-3 cursor-auto select-none',
        'hover:shadow-sm transition-shadow',
        isDragging && 'opacity-50',
        isDragOverlay && 'shadow-lg rotate-2 opacity-95'
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          aria-label="Arrastar candidato"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={member?.avatar_url ?? undefined} alt={member?.name} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">
            {member?.name ?? 'Candidato'}
          </p>
          {(member?.role || member?.seniority) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {[member.seniority, member.role].filter(Boolean).join(' · ')}
            </p>
          )}
          {member?.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-1">
              <MapPin className="h-2.5 w-2.5" />
              {member.city}
            </p>
          )}
        </div>

        {/* Ver perfil — only shown when not a drag overlay */}
        {!isDragOverlay && onOpenProfile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => onOpenProfile(candidate.id)}
            aria-label="Ver perfil do candidato"
          >
            <User className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Skills */}
      {member?.skills && member.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pl-9">
          {member.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="inline-block text-xs bg-muted rounded-full px-1.5 py-0.5 truncate max-w-[80px]"
            >
              {skill}
            </span>
          ))}
          {member.skills.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{member.skills.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
