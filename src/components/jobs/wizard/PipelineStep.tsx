'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import type { WizardData, WizardStage } from '@/types/wizard'

const STAGE_COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
]

interface PipelineStepProps {
  data: WizardData
  onChange: (fields: Partial<WizardData>) => void
}

interface SortableStageRowProps {
  stage: WizardStage
  onRename: (name: string) => void
  onRemove: () => void
  onColorChange: (color: string) => void
  canRemove: boolean
}

function SortableStageRow({
  stage,
  onRename,
  onRemove,
  onColorChange,
  canRemove,
}: SortableStageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Color dot picker */}
      <div className="flex gap-1">
        {STAGE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColorChange(c)}
            className="h-4 w-4 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              outline: stage.color === c ? `2px solid ${c}` : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>

      {/* Name input */}
      <Input
        className="flex-1 h-8 text-sm"
        value={stage.name}
        onChange={(e) => onRename(e.target.value)}
        placeholder="Nome da etapa"
      />

      {/* Remove */}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

export function PipelineStep({ data, onChange }: PipelineStepProps) {
  const stages = data.stages
  const [nextId, setNextId] = useState(stages.length + 1)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      position: i,
    }))
    onChange({ stages: reordered })
  }

  function addStage() {
    const id = `new-${nextId}`
    setNextId((n) => n + 1)
    onChange({
      stages: [
        ...stages,
        {
          id,
          name: `Etapa ${stages.length + 1}`,
          color: STAGE_COLORS[stages.length % STAGE_COLORS.length],
          position: stages.length,
        },
      ],
    })
  }

  function updateStage(id: string, patch: Partial<WizardStage>) {
    onChange({
      stages: stages.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })
  }

  function removeStage(id: string) {
    onChange({
      stages: stages
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, position: i })),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Etapas do pipeline</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Arraste para reordenar. Ao menos uma etapa é obrigatória.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {stages.map((stage) => (
              <SortableStageRow
                key={stage.id}
                stage={stage}
                onRename={(name) => updateStage(stage.id, { name })}
                onColorChange={(color) => updateStage(stage.id, { color })}
                onRemove={() => removeStage(stage.id)}
                canRemove={stages.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" size="sm" onClick={addStage} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Adicionar etapa
      </Button>
    </div>
  )
}
