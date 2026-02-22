'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { CandidateCard } from '@/components/pipeline/CandidateCard'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { PipelineStage, JobCandidate } from '@/types/pipeline'

interface KanbanBoardProps {
  initialStages: PipelineStage[]
  jobId: string
  tenantSlug: string
}

interface DroppableColumnProps {
  stage: PipelineStage
  isOver: boolean
}

function DroppableColumn({ stage, isOver }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: stage.id })
  const candidates = stage.candidates ?? []

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col shrink-0 w-64 rounded-xl transition-colors',
        isOver ? 'bg-muted/60' : 'bg-muted/30'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-medium truncate">{stage.name}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono bg-background rounded-full px-1.5 py-0.5 min-w-[22px] text-center">
          {candidates.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-2 pb-2 flex-1 min-h-[120px]">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard({ initialStages, jobId, tenantSlug }: KanbanBoardProps) {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages)
  const [activeCandidate, setActiveCandidate] = useState<JobCandidate | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // --- Real-time subscription ---
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`pipeline:${jobId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_candidates', filter: `job_id=eq.${jobId}` },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            setStages((prev) =>
              prev.map((stage) => ({
                ...stage,
                candidates: (stage.candidates ?? []).map((c) =>
                  c.id === payload.new.id ? { ...c, ...payload.new } : c
                ),
              }))
            )
          }
          if (payload.eventType === 'INSERT') {
            // Fetch with member join
            const { data } = await supabase
              .from('job_candidates')
              .select('id, job_id, member_id, stage_id, source, origin_type, origin_user_id, notes, rejection_reason, rejection_notes, added_at, updated_at, member:members ( id, name, role, seniority, avatar_url, city, country, skills, availability )')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setStages((prev) =>
                prev.map((stage) =>
                  stage.id === data.stage_id
                    ? { ...stage, candidates: [...(stage.candidates ?? []), data as unknown as JobCandidate] }
                    : stage
                )
              )
            }
          }
          if (payload.eventType === 'DELETE') {
            setStages((prev) =>
              prev.map((stage) => ({
                ...stage,
                candidates: (stage.candidates ?? []).filter((c) => c.id !== payload.old.id),
              }))
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId])

  // --- DnD handlers ---
  function handleDragStart({ active }: DragStartEvent) {
    const candidate = active.data.current?.candidate as JobCandidate
    setActiveCandidate(candidate ?? null)
  }

  function handleDragOver({ over }: { over: any }) {
    setOverColumnId(over?.id ?? null)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCandidate(null)
    setOverColumnId(null)

    if (!over) return

    const candidateId = active.id as string
    const targetStageId = over.id as string

    // Find source stage
    const sourceStage = stages.find((s) =>
      (s.candidates ?? []).some((c) => c.id === candidateId)
    )
    if (!sourceStage || sourceStage.id === targetStageId) return

    // Optimistic update
    setStages((prev) => {
      const candidate = (sourceStage.candidates ?? []).find((c) => c.id === candidateId)
      if (!candidate) return prev
      return prev.map((stage) => {
        if (stage.id === sourceStage.id) {
          return { ...stage, candidates: (stage.candidates ?? []).filter((c) => c.id !== candidateId) }
        }
        if (stage.id === targetStageId) {
          return { ...stage, candidates: [...(stage.candidates ?? []), { ...candidate, stage_id: targetStageId }] }
        }
        return stage
      })
    })

    // Persist to DB (FASE 5 will handle errors/rollback)
    const supabase = createClient()
    await supabase
      .from('job_candidates')
      .update({ stage_id: targetStageId, updated_at: new Date().toISOString() })
      .eq('id', candidateId)
  }

  return (
    <ScrollArea className="flex-1 w-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 h-full min-h-[calc(100vh-130px)]">
          {stages.map((stage) => (
            <DroppableColumn
              key={stage.id}
              stage={stage}
              isOver={overColumnId === stage.id && activeCandidate !== null}
            />
          ))}
          {stages.length === 0 && (
            <div className="flex items-center justify-center w-full text-muted-foreground">
              Nenhuma etapa configurada para esta vaga
            </div>
          )}
        </div>

        <DragOverlay>
          {activeCandidate && (
            <CandidateCard candidate={activeCandidate} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
